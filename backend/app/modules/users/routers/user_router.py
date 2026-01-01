from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.database import get_db
from modules.auth.vendors import auth_vendor
from modules.users.schemas.user_schema import UserCreate, UserRead, UserUpdate
from modules.users.services import user_service
from modules.users.models.user_model import User
from modules.auth.users import auth_user
from modules.vendors.models.vendor_model import Vendor
from modules.chatbots.services import chatbot_service
from modules.chatbots.schemas.chatbot_schema import ChatbotRead
from modules.auth.users.auth_user import get_current_user

router = APIRouter(tags=["Users"])

@router.post("/create", response_model=UserRead)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    new_user = user_service.create_user(db, user)
    if not new_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return new_user

@router.get("/vendor_chatbots", response_model=List[ChatbotRead])
def get_vendor_chatbots(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_user.get_current_user)
):
    vendor_id = current_user.vendor_id
    return user_service.get_vendor_chatbots(db, vendor_id)

@router.get("/me", response_model=UserRead)
def get_current_user_info(
    current_user: User = Depends(auth_user.get_current_user)
):
    return current_user

@router.get("/", response_model=List[UserRead])
def get_users(
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(auth_vendor.get_current_vendor)
):
    return user_service.get_users_by_vendor(db, current_vendor.id)
    

@router.put("/update", response_model=UserRead)
def update_user(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_user.get_current_user)
):
    updated_user = user_service.update_user(db, current_user.id, user_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@router.delete("/me")
def delete_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_user.get_current_user)
):
    success = user_service.delete_user(db, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "User deleted successfully"}

@router.put("/register/{vendor_id}", response_model=UserRead)
def register_with_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return user_service.register_user_with_vendor(db, current_user.id, vendor_id)

