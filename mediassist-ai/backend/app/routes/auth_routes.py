from fastapi import APIRouter, HTTPException
from app.models.user_model import UserSignup, UserLogin
from app.database.db import users_collection
from app.utils.auth_utils import hash_password, verify_password, create_access_token

router = APIRouter()

# ✅ SIGNUP
@router.post("/signup")
def signup(user: UserSignup):
    existing_user = users_collection.find_one({"email": user.email})
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_password = hash_password(user.password)

    users_collection.insert_one({
        "name": user.name,
        "email": user.email,
        "password": hashed_password
    })

    return {"message": "User registered successfully"}

# ✅ LOGIN
@router.post("/login")
def login(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})

    if not db_user:
        raise HTTPException(status_code=400, detail="User not found")

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid password")

    token = create_access_token({"email": user.email})

    return {"access_token": token, "token_type": "bearer"}