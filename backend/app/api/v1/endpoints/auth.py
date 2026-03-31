from fastapi import APIRouter, Depends
#from app.services.auth_service import register_user, login_user
router = APIRouter()

@router.post("/register")
def register():
    return {"msg": "register works"}

@router.post("/login")
def login():
    return {"msg": "login works"}
print("AUTH LOADED")    
