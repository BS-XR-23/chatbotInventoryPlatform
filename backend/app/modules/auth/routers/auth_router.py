# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from modules.vendors.models import vendor_model
from modules.users.models import user_model
from modules.auth.users import auth_user
from modules.auth.vendors import auth_vendor
from modules.chatbots.models.chatbot_model import Chatbot
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

@router.post("/login/{vendor_domain}/{chatbot_id}")
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

@router.post("/login/{vendor_domain}/{chatbot_id}")
def vendor_login(
    vendor_domain: str,
    chatbot_id: int,
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    # 1️⃣ Get Vendor by domain
    vendor = db.query(vendor_model.Vendor).filter(vendor_model.Vendor.domain == vendor_domain).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # 2️⃣ Verify chatbot belongs to this vendor
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.vendor_id == vendor.id,
        Chatbot.is_active == True
    ).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found or inactive")

    # 3️⃣ Verify email and password
    if vendor.email != email or not auth_vendor.verify_password(password, vendor.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 4️⃣ Generate JWT or session token
    token = auth_vendor.create_access_token({"vendor_id": vendor.id, "chatbot_id": chatbot.id})

    return {
        "access_token": token,
        "token_type": "bearer",
        "vendor_name": vendor.name,
        "chatbot_name": chatbot.name
    }