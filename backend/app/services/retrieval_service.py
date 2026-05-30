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
    "confidentiality":       ["non-disclosure", "nda", "confidential information", "proprietary information",
                              "trade secret", "confidentiality obligation", "duty of confidentiality"],
    "payment":               ["fees", "invoice", "billing", "compensation", "consideration", "remuneration",
                              "penalty", "late payment", "interest rate", "overdue", "past due"],
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
    # sub-concept entries — matched when only the sub-term appears in the question
    "penalty":               ["late payment penalty", "interest overdue", "late fee", "payment default"],
    "obligation":            ["duty", "undertaking", "responsible for", "must", "shall", "required to"],
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
        # penalty — competing clauses:
        #   renew/subscription/expir/auto-renew → renewal clauses
        #   compli/regulat → compliance-period clauses that say "termination of
        #     reporting period" or "termination of compliance cycle"
        ["renew", "subscription", "expir", "auto-renew", "compli", "regulat"],
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
        # penalty — competing clauses:
        #   payment/renew → existing
        #   service level/sla/availab/uptime → SLA clauses whose "sole exclusive
        #     remedy" language is semantically close to limitation-of-liability
        #   maintenan/support → support/maintenance clauses with remedy language
        #   warrant → warranty clauses (representation ≠ liability)
        ["payment", "renew",
         "service level", "sla", "availab", "uptime", "maintenan", "support", "warrant"],
    ),
    (
        frozenset({"payment", "invoice", "billing", "fee", "compensat", "remuner",
                   "penalt", "late payment", "overdu", "interest rate", "past due"}),
        # boost — clauses that ARE about payment / penalties
        ["payment", "invoice", "billing", "fee", "compensat", "penalt", "overdu", "interest"],
        # penalty — competing clauses:
        #   terminat/liabilit → existing
        #   renew/rollover → renewal clauses only ("subscription" intentionally
        #     excluded — SaaS contracts name the payment section "Subscription Fee"
        #     or "Annual Subscription", so penalising "subscription" incorrectly
        #     demotes the very clause we want to surface for payment queries)
        #   compli/regulat → compliance clauses that mention "regulatory fees"
        #     and "late submission penalties" — vocabulary identical to payment
        #   sla/availab/maintenan/support → service-level clauses with credit fees
        ["terminat", "liabilit", "renew", "rollover",
         "compli", "regulat", "sla", "availab", "maintenan", "support"],
    ),
    (
        frozenset({"confidenti", "non-disclos", "nda", "proprietary", "trade secret",
                   "confidentiality obligation", "duty of confidentiality"}),
        # boost — clauses that ARE about confidentiality / NDA
        ["confidenti", "non-disclos", "proprietary", "trade secret", "nda"],
        # penalty — arbitration/dispute clauses that mention "confidential" only incidentally
        ["payment", "terminat", "arbitrat", "dispute", "mediat"],
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

# Weighted formula weights — must sum to 1.0.
# 60/40 gives keyword precision enough authority to override semantic false
# positives (compliance clauses mentioning "fees/penalties", SLA clauses
# mentioning "exclusive remedy", Term clauses mentioning "termination notice")
# without making keyword so dominant that non-headed plain-text clauses suffer.
_SEMANTIC_WEIGHT = 0.60
_KEYWORD_WEIGHT  = 0.40

# Confidence thresholds on final_score = (semantic×0.6) + (keyword×0.4)
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

    Illustration for "What are the termination conditions?" (weights 0.6/0.4)
    -------------------------------------------------------------------------
    Termination clause  (heading "8. Termination",  text "Either party may terminate…")
      → "terminat" in heading  → raw = +0.60
      → "terminat" appears 2×  → raw += 0.12  →  total = +0.72
      → normalized = (0.72 + 1) / 2 = 0.86
      → final = 0.65 × 0.6 + 0.86 × 0.4 = 0.390 + 0.344 = 0.734   ← WINS

    Auto-renewal clause (heading "9. Auto-Renewal", text "Unless terminated…renews…")
      → "renew" in heading (penalty) → raw = −0.50
      → "terminat" appears 1×   → raw += 0.06
      → "renew" appears 2×      → raw −= 0.08  →  total = −0.52
      → normalized = (−0.52 + 1) / 2 = 0.24
      → final = 0.80 × 0.6 + 0.24 × 0.4 = 0.480 + 0.096 = 0.576
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


# Sub-concept signals → targeted query string used as the second expansion query.
# Checked after the primary concept is matched; first matching entry wins.
_SUB_CONCEPT_QUERIES: dict[str, list[tuple[list[str], str]]] = {
    "payment": [
        (["penalt", "late", "interest", "overdu", "past due"],
         "payment penalty late fee interest overdue invoice billing"),
        (["invoice", "billing", "compensation"],
         "payment invoice billing fee compensation terms"),
    ],
    "confidentiality": [
        (["obligat", "both part", "each part", "duty"],
         "confidentiality obligation non-disclosure both parties duty"),
        (["breach", "violat", "disclose"],
         "breach of confidentiality disclosure obligation proprietary"),
    ],
    "termination": [
        (["condition", "right", "notice", "clause"],
         "termination conditions right to terminate notice period breach default"),
        (["immediat", "material breach"],
         "immediate termination material breach right to cancel"),
    ],
    "liability": [
        (["limit", "cap", "maximum"],
         "limitation of liability cap damages maximum exposure indemnification"),
        (["indemnif", "hold harmless"],
         "indemnification hold harmless defend losses liability"),
    ],
    "renewal": [
        (["auto", "automatic", "evergreen"],
         "auto-renewal automatic renewal evergreen rollover notice opt-out"),
    ],
}


def _expand_queries(question: str) -> list[str]:
    """Return up to 3 query strings to maximise recall across phrasings."""
    queries: list[str] = [question]
    q_lower = question.lower()

    for term, synonyms in _LEGAL_SYNONYMS.items():
        if term in q_lower or any(s in q_lower for s in synonyms):
            # Build a targeted second query using sub-concept signals when possible.
            sub_query: str | None = None
            for signals, candidate_query in _SUB_CONCEPT_QUERIES.get(term, []):
                if any(sig in q_lower for sig in signals):
                    sub_query = candidate_query
                    break
            if sub_query is None:
                # Fall back to the first synonym that is not already in the question.
                absent = [s for s in synonyms if s not in q_lower]
                sub_query = f"{term} {absent[0]}" if absent else term
            if sub_query not in queries:
                queries.append(sub_query)
            # Third query: broad concept keyword for maximum recall.
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
           final_score = (semantic_score × 0.6) + (keyword_score × 0.4)

    The 60/40 split gives keyword precision enough authority to override
    semantic false positives (compliance clauses with "fees/penalty" vocabulary,
    SLA clauses with "exclusive remedy" language, Term clauses that share
    "termination notice" wording) without letting keyword dominate over
    clauses that lack formal headings.
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

    Thresholds are calibrated for final = (semantic×0.6) + (keyword×0.4):
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
         final_score = (semantic × 0.6) + (keyword × 0.4)
       where keyword_score ∈ [0, 1] encodes both concept BOOST and
       competing-concept PENALTY — the mechanism that surfaces the
       termination clause over auto-renewal clauses.
    5. Return top `limit` clauses and a confidence label.
    """
    t0      = time.monotonic()
    queries = _expand_queries(query)

    all_results: list[list[dict]] = []
    for q in queries:
        res = search_similar_clauses(q, limit=12, contract_id=contract_id)
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
