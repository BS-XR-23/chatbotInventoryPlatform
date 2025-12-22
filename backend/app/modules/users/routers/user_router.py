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


@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_user.get_current_user)
):
    user = user_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/", response_model=List[UserRead])
def get_users(
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(auth_vendor.get_current_vendor)
):
    return user_service.get_users_by_vendor(db, current_vendor.id)
    

@router.put("/update/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_user.get_current_user)
):
    updated_user = user_service.update_user(db, user_id, user_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_user.get_current_user)
):
    success = user_service.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "User deleted successfully"}
