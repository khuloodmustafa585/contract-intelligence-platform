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

VECTOR_SIZE = 384
COLLECTION_NAME = settings.QDRANT_COLLECTION

_model = None
_qdrant = None
_memory_points: list[dict] = []
# Persistent executor — avoids thread-pool creation overhead on every embedding call
_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="embed")

# Chunk constants for upsert — smaller chunks give sharper embeddings
_CHUNK_SIZE = 400      # chars per chunk
_CHUNK_OVERLAP = 60    # overlap between consecutive chunks
# Chunk point IDs: clause.id * _CHUNK_ID_STRIDE + chunk_index (supports 4095 chunks/clause)
_CHUNK_ID_STRIDE = 4096


def _load_model():
    global _model
    if _model is not None:
        return _model
    try:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    except Exception as exc:
        app_logger.warning("SentenceTransformer unavailable, using deterministic fallback: %s", exc)
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
        if not _qdrant.collection_exists(COLLECTION_NAME):
            _qdrant.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )
    except Exception as exc:
        app_logger.warning("Qdrant unavailable, using process-local vector store: %s", exc)
        _qdrant = False
    return _qdrant


def _fallback_embedding(text: str) -> list[float]:
    vector = [0.0] * VECTOR_SIZE
    for token in (text or "").lower().split():
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        index = int.from_bytes(digest[:2], "big") % VECTOR_SIZE
        vector[index] += 1.0
    norm = math.sqrt(sum(v * v for v in vector)) or 1.0
    return [v / norm for v in vector]


def generate_embedding(text: str, timeout_seconds: int = 10) -> list[float]:
    model = _load_model()
    if not model:
        return _fallback_embedding(text)

    t0 = time.monotonic()
    future = _executor.submit(model.encode, text or "")
    try:
        result = future.result(timeout=timeout_seconds)
        app_logger.debug("embedding generated in %.3fs", time.monotonic() - t0)
        return result.tolist()
    except FutureTimeout:
        app_logger.warning("embedding timed out after %ds, using fallback", timeout_seconds)
        return _fallback_embedding(text)


def _cosine(a: list[float], b: list[float]) -> float:
    denom = (math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))) or 1.0
    return sum(x * y for x, y in zip(a, b)) / denom

MAX_CHUNKS = 500


def _split_into_chunks(text: str) -> list[str]:
    """Split long clause text into overlapping chunks for sharper embeddings."""
    if not text:
        return []
    if len(text) <= _CHUNK_SIZE:
        return [text]

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + _CHUNK_SIZE, len(text))
        chunk = text[start:end]

        if chunk.strip():
            chunks.append(chunk.strip())

        if len(chunks) >= MAX_CHUNKS:
            app_logger.warning(
                "Chunk limit exceeded. Text length=%s",
                len(text)
            )
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
