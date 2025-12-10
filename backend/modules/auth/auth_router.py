# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from modules.users import user_model
from modules.vendors import vendor_model
from modules.auth import auth_user, auth_vendor
from db.database import get_db

router = APIRouter(tags=["Auth"])

@router.post("/user/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth_user.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth_user.create_access_token(
        data={"sub": user.email}  
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/vendor/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    admin = auth_vendor.authenticate_vendor(db, form_data.username, form_data.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth_vendor.create_access_token(
        data={"sub": admin.email}  
    )
    return {"access_token": access_token, "token_type": "bearer"}