from fastapi import FastAPI
from app.api.v1.router import api_router
from app.core.database import Base, engine
from app.models.user import User
from app.models.contract import Contract

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Contract Intelligence")

app.include_router(api_router)

@app.get("/")
def root():
    return {"message": "API is running"}