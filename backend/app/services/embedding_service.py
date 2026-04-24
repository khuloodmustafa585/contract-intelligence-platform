from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session
from app.models.clause import Clause
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance


model = SentenceTransformer("all-MiniLM-L6-v2")

qdrant = QdrantClient(":memory:")
COLLECTION_NAME = "contracts"

if not qdrant.collection_exists(COLLECTION_NAME):
    qdrant.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE)
    )


def generate_embedding(text: str) -> list[float]:
    if not text:
        return [0.0] * 384
    return model.encode(text).tolist()


def generate_embeddings_for_contract(contract_id: int, db: Session):
    clauses = db.query(Clause).filter(Clause.contract_id == contract_id).all()

    embeddings = []

    for clause in clauses:
        embedding = generate_embedding(clause.text)

        embeddings.append({
            "clause_id": clause.id,
            "embedding": embedding
        })

    return embeddings

def upsert_embeddings(contract_id: int, db: Session):
    clauses = db.query(Clause).filter(Clause.contract_id == contract_id).all()

    points = []

    for clause in clauses:
        embedding = generate_embedding(clause.text)

        point = PointStruct(
            id=clause.id,
            vector=embedding,
            payload={
                "contract_id": contract_id,
                "text": clause.text
            }
        )

        points.append(point)

    qdrant.upsert(
        collection_name=COLLECTION_NAME,
        points=points
    )

def search_similar_clauses(query: str, limit: int = 5):
    query_vector = generate_embedding(query)

    results = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        limit=limit
    )

    matches = []

    for result in results:
       matches.append({
        "clause_id": result.id,
        "score": result.score,
        "snippet": (result.payload.get("text") or "")[:200],
        "text": result.payload.get("text"), 
        "contract_id": result.payload.get("contract_id")
        })

    return matches  