from fastapi import FastAPI

from app.core.database import Base, engine
from app.models.user import User
from app.models.contract import Contract


Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Contract Intelligence")


@app.get("/")
def read_root():
    return {"message": "AI Contract Intelligence API is running successfully."}