import hashlib
import math
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


def _load_model():
    global _model
    if _model is not None:
        return _model
    try:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer("all-MiniLM-L6-v2")
    except Exception as exc:
        app_logger.warning("SentenceTransformer unavailable, using deterministic fallback embeddings: %s", exc)
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


def generate_embedding(text: str, timeout_seconds: int = 20) -> list[float]:
    model = _load_model()
    if not model:
        return _fallback_embedding(text)

    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(lambda: model.encode(text or "").tolist())
        try:
            return future.result(timeout=timeout_seconds)
        except FutureTimeout:
            app_logger.warning("Embedding generation timed out, using fallback embedding")
            return _fallback_embedding(text)


def _cosine(a: list[float], b: list[float]) -> float:
    denom = (math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))) or 1.0
    return sum(x * y for x, y in zip(a, b)) / denom


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
        points = []
        for clause in clauses:
            embedding = generate_embedding(clause.text)
            payload = {
                "contract_id": contract_id,
                "clause_id": clause.id,
                "text": clause.text,
                "heading": clause.heading,
            }
            points.append({"id": clause.id, "vector": embedding, "payload": payload})

        qdrant = _load_qdrant()
        if qdrant:
            from qdrant_client.models import PointStruct

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
    except Exception:
        if contract:
            contract.embedding_status = EMBEDDING_STATUS_FAILED
            db.commit()
        raise


def search_similar_clauses(query: str, limit: int = 5, contract_id: int | None = None):
    query_vector = generate_embedding(query)
    qdrant = _load_qdrant()

    if qdrant:
        search_filter = None
        if contract_id is not None:
            from qdrant_client.models import FieldCondition, Filter, MatchValue

            search_filter = Filter(must=[FieldCondition(key="contract_id", match=MatchValue(value=contract_id))])

        results = qdrant.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_vector,
            query_filter=search_filter,
            limit=limit,
        )
        return [
            {
                "clause_id": result.payload.get("clause_id") or result.id,
                "score": result.score,
                "snippet": (result.payload.get("text") or "")[:300],
                "text": result.payload.get("text"),
                "contract_id": result.payload.get("contract_id"),
            }
            for result in results
        ]

    candidates = [p for p in _memory_points if contract_id is None or p["payload"]["contract_id"] == contract_id]
    ranked = sorted(candidates, key=lambda p: _cosine(query_vector, p["vector"]), reverse=True)[:limit]
    return [
        {
            "clause_id": p["payload"]["clause_id"],
            "score": _cosine(query_vector, p["vector"]),
            "snippet": p["payload"]["text"][:300],
            "text": p["payload"]["text"],
            "contract_id": p["payload"]["contract_id"],
        }
        for p in ranked
    ]
