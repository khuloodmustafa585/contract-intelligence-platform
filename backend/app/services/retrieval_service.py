import re
import time
from sqlalchemy.orm import Session

from app.core.logging import app_logger
from app.models.contract import Contract
from app.services.embedding_service import search_similar_clauses

# ── Query expansion synonyms ───────────────────────────────────────────────
_LEGAL_SYNONYMS: dict[str, list[str]] = {
    "termination":           ["terminate", "cancellation", "notice period", "end of agreement", "right to terminate"],
    "liability":             ["indemnification", "damages", "limitation of liability", "indemnify", "hold harmless"],
    "confidentiality":       ["non-disclosure", "nda", "confidential information", "proprietary information", "trade secret"],
    "payment":               ["fees", "invoice", "billing", "compensation", "consideration", "remuneration"],
    "intellectual property": ["ip", "copyright", "patent", "trademark", "ownership of work product"],
    "warranty":              ["representation", "guarantee", "disclaimer", "fitness for purpose"],
    "dispute":               ["arbitration", "mediation", "governing law", "jurisdiction", "legal proceedings"],
    "renewal":               ["auto-renewal", "automatic renewal", "extension", "evergreen clause"],
    "compliance":            ["regulatory requirements", "applicable law", "gdpr", "data protection"],
    "force majeure":         ["act of god", "unforeseen event", "beyond reasonable control", "extraordinary circumstances"],
    "assignment":            ["transfer of rights", "delegation", "novation", "change of control"],
    "governing law":         ["choice of law", "applicable law", "jurisdiction", "venue"],
    "indemnification":       ["liability", "hold harmless", "defend", "indemnify", "losses"],
    "auto-renewal":          ["renewal", "automatic extension", "rollover", "evergreen"],
}

_STOP_WORDS = frozenset({
    "what", "when", "where", "which", "that", "this", "with", "have", "from",
    "they", "will", "been", "does", "your", "their", "there", "about", "would",
    "could", "should", "these", "those", "such", "each", "under", "also",
    "explain", "describe", "tell", "show", "find", "list", "summarize",
})

# ── Post-retrieval reranking tables ───────────────────────────────────────
#
# Each entry is (query_triggers, boost_stems, penalty_stems).
#
# boost_stems   — substrings that signal the clause IS about the queried concept.
#                 Partial stems are used so they match inflections without a
#                 stemmer: "terminat" matches terminate / termination / terminated.
#
# penalty_stems — substrings that signal the clause is about a COMPETING concept.
#                 A clause whose heading or opening text is dominated by a penalty
#                 stem receives a negative adjustment to its keyword score.
#
# The termination entry directly addresses the reported bug:
#   boost:   terminat, breach, insolvency, suspension, cancel, default
#   penalty: renew, subscription, expir, auto-renew
#
# This means an auto-renewal clause whose heading contains "renew" is actively
# down-scored for a termination query, not merely left un-boosted.
#
# Order matters: first matching entry wins.
_CONCEPT_SCORING: list[tuple[frozenset[str], list[str], list[str]]] = [
    (
        frozenset({"terminat", "cancel", "end agreement", "suspend",
                   "breach", "default", "discontinu", "insolvency"}),
        # boost — clauses that ARE about termination
        ["terminat", "breach", "insolvency", "suspension", "cancel", "default"],
        # penalty — clauses about competing concepts
        ["renew", "subscription", "expir", "auto-renew"],
    ),
    (
        frozenset({"renew", "auto-renew", "rollover", "subscription",
                   "evergreen", "automatic renewal"}),
        ["renew", "auto-renew", "rollover", "evergreen", "subscription"],
        ["terminat", "breach", "cancel"],
    ),
    (
        frozenset({"liabilit", "indemnif", "hold harmless", "damages"}),
        ["liabilit", "indemnif", "damages", "hold harmless"],
        ["payment", "renew"],
    ),
    (
        frozenset({"payment", "invoice", "billing", "fee", "compensat", "remuner"}),
        ["payment", "invoice", "billing", "fee", "compensat"],
        ["terminat", "liabilit"],
    ),
    (
        frozenset({"confidenti", "non-disclos", "nda", "proprietary", "trade secret"}),
        ["confidenti", "non-disclos", "proprietary", "trade secret"],
        ["payment", "terminat"],
    ),
    (
        frozenset({"arbitrat", "mediat", "governing law", "jurisdict", "venue"}),
        ["arbitrat", "mediat", "jurisdict", "governing law"],
        [],
    ),
    (
        frozenset({"warrant", "represent", "disclaim", "fitness"}),
        ["warrant", "represent", "disclaim"],
        [],
    ),
    (
        frozenset({"intellectu", "patent", "copyright", "trademark", "ownership"}),
        ["intellectu", "patent", "copyright", "trademark"],
        [],
    ),
    (
        frozenset({"force majeure", "act of god", "unforeseen", "beyond control"}),
        ["force majeure", "act of god", "unforeseen"],
        [],
    ),
    (
        frozenset({"assign", "transfer", "novation", "change of control"}),
        ["assign", "transfer", "novation"],
        [],
    ),
]

# Weighted formula weights — must sum to 1.0
_SEMANTIC_WEIGHT = 0.7
_KEYWORD_WEIGHT  = 0.3

# Confidence thresholds on final_score = (semantic×0.7) + (keyword×0.3)
_HIGH_SCORE     = 0.62
_MODERATE_SCORE = 0.42


# ── Internal helpers ──────────────────────────────────────────────────────

def _get_scoring_terms(query_lower: str) -> tuple[list[str], list[str]]:
    """Return (boost_stems, penalty_stems) for the legal concept in the query."""
    for triggers, boost, penalty in _CONCEPT_SCORING:
        if any(t in query_lower for t in triggers):
            return boost, penalty
    return [], []


def _keyword_score(
    clause_text: str,
    heading: str | None,
    boost_stems: list[str],
    penalty_stems: list[str],
) -> float:
    """
    Normalized keyword relevance score in [0.0, 1.0].

    Neutral baseline is 0.5 (no strong signal in either direction).
    > 0.5  clause is about the queried concept  → boosts final_score
    < 0.5  clause is about a competing concept  → penalises final_score

    Raw score is accumulated in a range of roughly [-1.0, +1.0] then
    mapped linearly to [0.0, 1.0] via  normalized = (raw + 1) / 2.

    Boost tiers (per boost stem, highest fires)
    -------------------------------------------
    +0.60  stem in clause HEADING          — clause is definitionally about topic
    +0.40  first word of body starts with stem — body opens with topic as label
    +0.20  stem appears ≥4× in full text   — topic is repeated → primary subject
    +0.12  stem appears ≥2× in full text   — notable / central mention
    +0.06  stem appears once               — at least one relevant reference

    Penalty tiers (per penalty stem, strongest fires)
    --------------------------------------------------
    −0.50  penalty stem in HEADING         — clause is definitionally about competitor
    −0.30  first word starts with penalty  — body opens with competitor concept
    −0.15  penalty stem appears ≥3× in text
    −0.08  penalty stem appears ≥2×
    −0.03  penalty stem appears once       — incidental mention, small reduction

    Bug-fix illustration for "What are the termination conditions?"
    ---------------------------------------------------------------
    Termination clause  (heading "8. Termination",  text "Either party may terminate…")
      → "terminat" in heading  → raw = +0.60
      → "terminat" appears 2×  → raw += 0.12  →  total = +0.72
      → normalized = (0.72 + 1) / 2 = 0.86
      → final = 0.48 × 0.7 + 0.86 × 0.3 = 0.336 + 0.258 = 0.594   ← WINS

    Auto-renewal clause (heading "9. Auto-Renewal", text "Unless terminated…renews…")
      → "renew" in heading (penalty) → raw = −0.50
      → "terminat" appears 1×   → raw += 0.06
      → "renew" appears 2×      → raw −= 0.08  →  total = −0.52
      → normalized = (−0.52 + 1) / 2 = 0.24
      → final = 0.52 × 0.7 + 0.24 × 0.3 = 0.364 + 0.072 = 0.436
    """
    if not boost_stems and not penalty_stems:
        return 0.5  # no concept detected → neutral

    h          = (heading or "").lower()
    tl         = (clause_text or "").lower()
    first_word = tl.split(None, 1)[0] if tl.strip() else ""

    raw = 0.0

    # ── Boost accumulation ────────────────────────────────────────────────
    # Heading match (strongest signal — at most one fires)
    for stem in boost_stems:
        if stem in h:
            raw += 0.60
            break

    # First-word match (body opens with the concept as a label)
    for stem in boost_stems:
        if first_word.startswith(stem):
            raw += 0.40
            break

    # Frequency in full text
    boost_freq = sum(tl.count(stem) for stem in boost_stems)
    if boost_freq >= 4:
        raw += 0.20
    elif boost_freq >= 2:
        raw += 0.12
    elif boost_freq >= 1:
        raw += 0.06

    # ── Penalty accumulation ──────────────────────────────────────────────
    for stem in penalty_stems:
        if stem in h:
            raw -= 0.50
            break

    for stem in penalty_stems:
        if first_word.startswith(stem):
            raw -= 0.30
            break

    penalty_freq = sum(tl.count(stem) for stem in penalty_stems)
    if penalty_freq >= 3:
        raw -= 0.15
    elif penalty_freq >= 2:
        raw -= 0.08
    elif penalty_freq >= 1:
        raw -= 0.03

    # Map [-1.0, +1.0] → [0.0, 1.0]  (0 → 0.5 neutral)
    return max(0.0, min(1.0, (raw + 1.0) / 2.0))


def _expand_queries(question: str) -> list[str]:
    """Return up to 3 query strings to maximise recall across phrasings."""
    queries: list[str] = [question]
    q_lower = question.lower()

    for term, synonyms in _LEGAL_SYNONYMS.items():
        if term in q_lower or any(s in q_lower for s in synonyms):
            clause_form = f"{term} {synonyms[0]}"
            if clause_form not in queries:
                queries.append(clause_form)
            if len(queries) < 3 and term not in queries:
                queries.append(term)
            break

    if len(queries) < 3:
        words = [w for w in re.findall(r"\b[a-zA-Z]{4,}\b", question) if w.lower() not in _STOP_WORDS]
        if len(words) >= 2:
            kw_query = " ".join(words[:5])
            if kw_query not in queries:
                queries.append(kw_query)

    return queries[:3]


def _merge_by_best_score(result_lists: list[list[dict]]) -> list[dict]:
    """Merge results from multiple queries, keeping the highest raw score per clause."""
    best: dict[int | str, dict] = {}
    for results in result_lists:
        for item in results:
            cid = item["clause_id"]
            if cid not in best or item["score"] > best[cid]["score"]:
                best[cid] = item
    return list(best.values())


def _rerank(results: list[dict], query: str) -> list[dict]:
    """
    Apply post-retrieval legal reranking.

    For each Qdrant candidate:
      1. Compute keyword_score ∈ [0.0, 1.0] using concept-specific boost
         and penalty stems.  0.5 is neutral; >0.5 means the clause IS about
         the queried concept; <0.5 means it is about a competing concept.

      2. Combine with the raw semantic score using the weighted formula:
           final_score = (semantic_score × 0.7) + (keyword_score × 0.3)

    This formula is the decisive fix for the renewal-over-termination bug:
    the renewal clause's higher semantic score is overridden by its strong
    keyword penalty, while the termination clause's heading/opening-text
    boost pushes its final_score decisively higher.
    """
    q_lower                  = query.lower()
    boost_stems, penalty_stems = _get_scoring_terms(q_lower)

    for item in results:
        semantic  = item.get("score", 0.0)
        kw        = _keyword_score(
            item.get("text") or item.get("snippet") or "",
            item.get("heading"),
            boost_stems,
            penalty_stems,
        )
        final = (semantic * _SEMANTIC_WEIGHT) + (kw * _KEYWORD_WEIGHT)

        item["rerank_score"]  = round(final, 4)
        item["keyword_score"] = round(kw, 4)     # exposed in debug log

    return sorted(results, key=lambda x: x["rerank_score"], reverse=True)


def _confidence_label(final_score: float) -> str:
    """
    Confidence tier based on the weighted final_score.

    Thresholds are calibrated for final = (semantic×0.7) + (keyword×0.3):
      High     ≥ 0.62  — strong semantic match + concept confirmed by keywords
      Moderate ≥ 0.42  — usable match, partial keyword confirmation
      Low      < 0.42  — weak match; answer may be incomplete
    """
    if final_score >= _HIGH_SCORE:
        return "high"
    if final_score >= _MODERATE_SCORE:
        return "moderate"
    return "low"


# ── Public API ────────────────────────────────────────────────────────────

def retrieve_contract_text(contract_id: int, db: Session) -> str:
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract or not contract.cleaned_text:
        return ""
    return contract.cleaned_text


def search_in_contract(contract_id: int, query: str, db: Session, limit: int = 5) -> dict:
    """
    Returns {"sources": list[dict], "confidence": str}.

    Pipeline
    --------
    1. Expand the user query into up to 3 semantic variants (catches paraphrases).
    2. Retrieve top-10 Qdrant candidates per variant.
    3. Merge by best raw cosine score per clause (deduplication).
    4. Post-retrieval rerank:
         final_score = (semantic × 0.7) + (keyword × 0.3)
       where keyword_score ∈ [0, 1] encodes both concept BOOST and
       competing-concept PENALTY — the mechanism that surfaces the
       termination clause over auto-renewal clauses.
    5. Return top `limit` clauses and a confidence label.
    """
    t0      = time.monotonic()
    queries = _expand_queries(query)

    all_results: list[list[dict]] = []
    for q in queries:
        res = search_similar_clauses(q, limit=10, contract_id=contract_id)
        if res:
            all_results.append(res)

    merged   = _merge_by_best_score(all_results)
    reranked = _rerank(merged, query)
    top      = reranked[:limit]

    top_score  = top[0].get("rerank_score", 0.0) if top else 0.0
    confidence = _confidence_label(top_score)

    app_logger.info(
        "retrieval contract_id=%d query=%r expanded=%d candidates=%d "
        "returned=%d confidence=%s elapsed=%.3fs | "
        "final=[%s] semantic=[%s] keyword=[%s] headings=[%s] clause_ids=[%s]",
        contract_id,
        query[:80],
        len(queries),
        len(merged),
        len(top),
        confidence,
        time.monotonic() - t0,
        ", ".join(f"{r.get('rerank_score', 0):.3f}" for r in top),
        ", ".join(f"{r.get('score', 0):.3f}" for r in top),
        ", ".join(f"{r.get('keyword_score', 0):.3f}" for r in top),
        ", ".join(repr(r.get("heading")) for r in top),
        ", ".join(str(r.get("clause_id")) for r in top),
    )

    return {"sources": top, "confidence": confidence}
