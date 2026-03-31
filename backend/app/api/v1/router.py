print("MAIN LOADED")
from fastapi import APIRouter
from app.api.v1.endpoints import auth, users

api_router = APIRouter()

@api_router.get("/health")
def health_check():
    return {"status": "OK"}

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
print("ROUTER LOADED")