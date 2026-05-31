import hashlib
import math
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import EMBEDDING_STATUS_COMPLETED, EMBEDDING_STATUS_FAILED, EMBEDDING_STATUS_PROCESSING
from app.core.logging import app_logger
from app.models.clause import Clause
from app.models.contract import Contract

# ── Embedding model selection ─────────────────────────────────────────────
#
# Priority order:
#   1. OpenAI text-embedding-3-small  (best quality, requires OPENAI_API_KEY)
#      Vector size: 1536
#   2. SentenceTransformer all-MiniLM-L6-v2  (local, no API cost)
#      Vector size: 384
#   3. Deterministic hash fallback  (always available, poor semantic quality)
#      Vector size: matches whichever model is active
#
# IMPORTANT: VECTOR_SIZE must be consistent between indexing and querying.
# If OpenAI is configured at indexing time, it MUST also be used at query time
# (or vice-versa).  A mismatch causes Qdrant to reject the query outright.
# The logic below ensures both paths always invoke the same model.
#
# When OpenAI fails mid-query (transient network error), generate_embedding()
# returns a fallback vector of the correct VECTOR_SIZE so Qdrant accepts the
# query — but the scores will be near-zero for everything, causing retrieval to
# fall through to the SQL keyword fallback in retrieval_service.py.

VECTOR_SIZE: int = 1536 if settings.OPENAI_API_KEY else 384
COLLECTION_NAME = settings.QDRANT_COLLECTION

_model = None
_qdrant = None
_memory_points: list[dict] = []
# Used only for local SentenceTransformer (fallback path)
_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="embed")

_CHUNK_SIZE = 500
_CHUNK_OVERLAP = 80
_SENT_BOUNDARIES = [". ", ".\n", "? ", "! ", ";\n", "\n\n"]
_CHUNK_ID_STRIDE = 4096


def _load_model():
    """Load SentenceTransformer.  Only used when OPENAI_API_KEY is not set."""
    global _model
    if _model is not None:
        return _model
    try:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        app_logger.info("SentenceTransformer all-MiniLM-L6-v2 loaded (fallback path)")
    except Exception as exc:
        app_logger.warning("SentenceTransformer unavailable, using hash fallback: %s", exc)
        _model = False
    return _model


def _load_qdrant():
    global _qdrant
    if _qdrant is not None:
        return _qdrant
    try:
        from qdrant_client import QdrantClient
        from qdrant_client.models import Distance, VectorParams

        _qdrant = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY,
        ) if settings.QDRANT_URL else QdrantClient(":memory:")

        if _qdrant.collection_exists(COLLECTION_NAME):
            # Recreate collection if the stored vector size doesn't match the
            # current model (e.g. after switching from MiniLM→OpenAI or back).
            try:
                info = _qdrant.get_collection(COLLECTION_NAME)
                existing_size = info.config.params.vectors.size
                if existing_size != VECTOR_SIZE:
                    app_logger.warning(
                        "Qdrant collection '%s' has vector size %d but current model "
                        "needs %d — deleting and recreating (contracts will be re-indexed "
                        "automatically on next Ask AI call)",
                        COLLECTION_NAME, existing_size, VECTOR_SIZE,
                    )
                    _qdrant.delete_collection(COLLECTION_NAME)
            except Exception as exc:
                app_logger.warning("could not inspect collection size: %s", exc)

        if not _qdrant.collection_exists(COLLECTION_NAME):
            _qdrant.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )
            app_logger.info(
                "Qdrant collection '%s' created (vector_size=%d)", COLLECTION_NAME, VECTOR_SIZE
            )
    except Exception as exc:
        app_logger.warning("Qdrant unavailable, using process-local vector store: %s", exc)
        _qdrant = False
    return _qdrant


def _fallback_embedding(text: str) -> list[float]:
    """
    Deterministic hash-based embedding.  VECTOR_SIZE dimensions so it is always
    compatible with whatever is stored in Qdrant.

    Quality note: cosine similarity scores between a hash query vector and
    OpenAI-indexed vectors will be ~0 for everything — retrieval falls through
    to the SQL keyword fallback in retrieval_service.py.  This is intentional:
    wrong-model vectors must NOT produce confident-looking scores.
    """
    vector = [0.0] * VECTOR_SIZE
    for token in (text or "").lower().split():
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        index = int.from_bytes(digest[:2], "big") % VECTOR_SIZE
        vector[index] += 1.0
    norm = math.sqrt(sum(v * v for v in vector)) or 1.0
    return [v / norm for v in vector]


def _generate_openai_embedding(text: str) -> list[float]:
    """
    Call OpenAI text-embedding-3-small.

    Returns a VECTOR_SIZE-dimensional embedding.  Raises on any failure so the
    caller can decide whether to fall back or propagate the error.
    """
    from openai import OpenAI as _OpenAI
    client = _OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.embeddings.create(
        model=settings.OPENAI_EMBEDDING_MODEL,
        input=text or " ",
        dimensions=VECTOR_SIZE,
    )
    return response.data[0].embedding


def generate_embedding(text: str, timeout_seconds: int = 10) -> list[float]:
    """
    Generate a semantic embedding for `text`.

    Model selection:
      1. OpenAI text-embedding-3-small (when OPENAI_API_KEY is set) — best quality
      2. SentenceTransformer all-MiniLM-L6-v2 (when OpenAI unavailable) — local
      3. Hash fallback (last resort) — correct dimensions, no semantic quality

    The `timeout_seconds` parameter is kept for backward compatibility but is
    only applied to the local SentenceTransformer path.
    """
    if settings.OPENAI_API_KEY:
        t0 = time.monotonic()
        try:
            vec = _generate_openai_embedding(text)
            app_logger.debug("OpenAI embedding generated in %.3fs", time.monotonic() - t0)
            return vec
        except Exception as exc:
            app_logger.warning(
                "OpenAI embedding failed (%s) — using hash fallback "
                "(vector search will return low scores; SQL keyword fallback will handle query)",
                exc,
            )
            return _fallback_embedding(text)

    # OpenAI not configured — use local SentenceTransformer
    model = _load_model()
    if not model:
        return _fallback_embedding(text)

    t0 = time.monotonic()
    future = _executor.submit(model.encode, text or "")
    try:
        result = future.result(timeout=timeout_seconds)
        app_logger.debug("SentenceTransformer embedding generated in %.3fs", time.monotonic() - t0)
        return result.tolist()
    except FutureTimeout:
        app_logger.warning("SentenceTransformer embedding timed out after %ds, using hash fallback", timeout_seconds)
        return _fallback_embedding(text)


def _cosine(a: list[float], b: list[float]) -> float:
    denom = (math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))) or 1.0
    return sum(x * y for x, y in zip(a, b)) / denom

MAX_CHUNKS = 500


def _split_into_chunks(text: str) -> list[str]:
    """Split long clause text into overlapping chunks, preferring sentence boundaries."""
    if not text:
        return []
    if len(text) <= _CHUNK_SIZE:
        return [text]

    chunks: list[str] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + _CHUNK_SIZE, text_len)

        # Try to snap to a sentence boundary within the back quarter of the window
        # so we don't cut mid-sentence and destroy embedding quality.
        if end < text_len:
            search_from = start + _CHUNK_SIZE // 2
            for sep in _SENT_BOUNDARIES:
                pos = text.rfind(sep, search_from, end)
                if pos != -1:
                    end = pos + len(sep)
                    break

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if len(chunks) >= MAX_CHUNKS:
            app_logger.warning("Chunk limit exceeded. Text length=%s", len(text))
            break

        next_start = end - _CHUNK_OVERLAP
        if next_start <= start:
            break
        start = next_start

    return chunks


def generate_embeddings_for_contract(contract_id: int, db: Session):
    clauses = db.query(Clause).filter(Clause.contract_id == contract_id).all()
    return [{"clause_id": clause.id, "embedding": generate_embedding(clause.text)} for clause in clauses]


def upsert_embeddings(contract_id: int, db: Session):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if contract:
        contract.embedding_status = EMBEDDING_STATUS_PROCESSING
        db.commit()

    clauses = db.query(Clause).filter(Clause.contract_id == contract_id).all()
    try:
        points: list[dict] = []
        for clause in clauses:
            app_logger.warning(
                "CLAUSE id=%s length=%s",
                clause.id,
                len(clause.text or "")
            )
            chunks = _split_into_chunks(clause.text or "")
            app_logger.warning(
                "CLAUSE id=%s chunks=%s",
                clause.id,
                len(chunks)
            )
            if not chunks:
                continue
            for chunk_idx, chunk_text in enumerate(chunks):
                # Prepend the heading to the text that gets embedded.
                # This pulls the legal concept name ("8. Termination", "PAYMENT TERMS")
                # into the vector so that queries like "termination conditions" land
                # near the right clause even when the body text is written passively.
                # The raw chunk_text (without prefix) is stored in the payload for display.
                embed_text = f"{clause.heading}: {chunk_text}" if clause.heading else chunk_text
                embedding = generate_embedding(embed_text)
                point_id = clause.id * _CHUNK_ID_STRIDE + chunk_idx
                payload = {
                    "contract_id": contract_id,
                    "clause_id": clause.id,
                    "chunk_index": chunk_idx,
                    "text": chunk_text,
                    "heading": clause.heading,
                }
                points.append({"id": point_id, "vector": embedding, "payload": payload})

        qdrant = _load_qdrant()
        if qdrant:
            from qdrant_client.models import FieldCondition, Filter, MatchValue, PointStruct

            # Delete stale points before re-indexing so old non-chunked entries don't linger
            try:
                qdrant.delete(
                    collection_name=COLLECTION_NAME,
                    points_selector=Filter(
                        must=[FieldCondition(key="contract_id", match=MatchValue(value=contract_id))]
                    ),
                )
            except Exception as exc:
                app_logger.warning("failed to clean up old embeddings for contract %d: %s", contract_id, exc)

            qdrant.upsert(
                collection_name=COLLECTION_NAME,
                points=[PointStruct(id=p["id"], vector=p["vector"], payload=p["payload"]) for p in points],
            )
        else:
            global _memory_points
            _memory_points = [p for p in _memory_points if p["payload"]["contract_id"] != contract_id] + points

        if contract:
            contract.is_indexed = True
            contract.embedding_status = EMBEDDING_STATUS_COMPLETED
            db.commit()

        app_logger.info(
            "indexed contract %d: %d clauses → %d chunks",
            contract_id, len(clauses), len(points),
        )
    except Exception:
        if contract:
            contract.embedding_status = EMBEDDING_STATUS_FAILED
            db.commit()
        raise


def delete_embeddings_for_contract(contract_id: int) -> None:
    """Remove all vector points for a contract from the vector store."""
    global _memory_points
    qdrant = _load_qdrant()
    if qdrant:
        try:
            from qdrant_client.models import FieldCondition, Filter, MatchValue
            qdrant.delete(
                collection_name=COLLECTION_NAME,
                points_selector=Filter(
                    must=[FieldCondition(key="contract_id", match=MatchValue(value=contract_id))]
                ),
            )
            app_logger.info("deleted embeddings for contract %d", contract_id)
        except Exception as exc:
            app_logger.warning("could not delete embeddings for contract %d: %s", contract_id, exc)
    else:
        _memory_points = [p for p in _memory_points if p["payload"]["contract_id"] != contract_id]


def is_contract_indexed_in_qdrant(contract_id: int) -> bool:
    """
    Return True if the active vector store has at least one point for this contract.

    Used by retrieval_service to detect when an in-memory Qdrant was wiped by a
    server restart so it can auto-reindex before answering questions.
    """
    qdrant = _load_qdrant()
    if qdrant is False:
        # Qdrant unavailable — fall back to in-process list
        return any(p["payload"]["contract_id"] == contract_id for p in _memory_points)
    try:
        from qdrant_client.models import FieldCondition, Filter, MatchValue
        result = qdrant.count(
            collection_name=COLLECTION_NAME,
            count_filter=Filter(
                must=[FieldCondition(key="contract_id", match=MatchValue(value=contract_id))]
            ),
        )
        return result.count > 0
    except Exception as exc:
        app_logger.warning(
            "is_contract_indexed_in_qdrant contract_id=%d check failed: %s", contract_id, exc
        )
        return False


def search_similar_clauses(query: str, limit: int = 5, contract_id: int | None = None):
    query_vector = generate_embedding(query)
    qdrant = _load_qdrant()

    if qdrant:
        try:
            query_filter = None
            if contract_id is not None:
                from qdrant_client.models import FieldCondition, Filter, MatchValue
                query_filter = Filter(
                    must=[FieldCondition(key="contract_id", match=MatchValue(value=contract_id))]
                )

            results = qdrant.query_points(
                collection_name=COLLECTION_NAME,
                query=query_vector,
                query_filter=query_filter,
                limit=limit,
            )
            points = results.points if hasattr(results, "points") else []
            return [
                {
                    "clause_id": point.payload.get("clause_id") or point.id,
                    "score": point.score,
                    "snippet": (point.payload.get("text") or "")[:300],
                    "text": point.payload.get("text"),
                    "contract_id": point.payload.get("contract_id"),
                    "heading": point.payload.get("heading"),
                }
                for point in points
            ]
        except Exception as exc:
            app_logger.error("Qdrant vector search failed: %s", exc)

    candidates = [
        p for p in _memory_points
        if contract_id is None or p["payload"]["contract_id"] == contract_id
    ]
    ranked = sorted(candidates, key=lambda p: _cosine(query_vector, p["vector"]), reverse=True)[:limit]
    return [
        {
            "clause_id": p["payload"]["clause_id"],
            "score": _cosine(query_vector, p["vector"]),
            "snippet": p["payload"]["text"][:300],
            "text": p["payload"]["text"],
            "contract_id": p["payload"]["contract_id"],
            "heading": p["payload"].get("heading"),
        }
        for p in ranked
    ]
