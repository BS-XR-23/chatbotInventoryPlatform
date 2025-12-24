from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from jose import jwt
from core.config import settings 
from db.database import get_db
from modules.vendors.schemas.vendor_schema import VendorCreate, VendorRead, VendorUpdate, ChangePasswordRequest
from modules.vendors.services import vendor_service
from modules.vendors.models.vendor_model import Vendor
from modules.auth.vendors import auth_vendor
from modules.vendors.models.vendor_model import Vendor
from modules.admins.models.admin_model import Admin
from modules.auth.admins import auth_admin


router = APIRouter(tags=["Vendors"])

@router.post("/create", response_model=VendorRead)
def create_vendor(vendor: VendorCreate, db: Session = Depends(get_db), current_admin: Admin = Depends(auth_admin.get_current_admin)):
    new_vendor = vendor_service.create_vendor(db, vendor)
    if not new_vendor:
        raise HTTPException(status_code=400, detail="Email already registered")
    return new_vendor

@router.put("/change-password")
def update_vendor_password(
    body: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_vendor=Depends(auth_vendor.get_current_vendor)
):
    updated_vendor, error = vendor_service.change_vendor_password(
        db,
        vendor_id=current_vendor.id,
        current_password=body.current_password,
        new_password=body.new_password
    )

    if error:
        raise HTTPException(status_code=400, detail=error)

    return {"message": "Password updated successfully"}

@router.get("/all-vendors", response_model=List[VendorRead])
def list_vendors(db: Session = Depends(get_db)):
    return vendor_service.list_vendors(db)

@router.get("/{vendor_id}", response_model=VendorRead)
def get_vendor(vendor_id: int, db: Session = Depends(get_db)):
    vendor = vendor_service.get_vendor(db, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor

@router.put("/update/{vendor_id}", response_model=VendorRead)
def update_vendor(
    vendor_id: int,
    vendor_data: VendorUpdate,
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(auth_vendor.get_current_vendor)
):
    updated_vendor = vendor_service.update_vendor(db, vendor_id, vendor_data)
    if not updated_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return updated_vendor

@router.get("/top-chatbots/messages")
def vendor_top_chatbots_by_messages(
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(auth_vendor.get_current_vendor)
):
    return vendor_service.get_vendor_top_chatbots_by_messages(db, current_vendor.id)


@router.get("/top-chatbots/users")
def vendor_top_chatbots_by_unique_users(
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(auth_vendor.get_current_vendor)
):
    return vendor_service.get_vendor_top_chatbots_by_users(db, current_vendor.id)


# ------------------------------
# Vendor 7-Day Charts
# ------------------------------

@router.get("/daily/messages")
def vendor_daily_messages(
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(auth_vendor.get_current_vendor)
):
    return vendor_service.get_vendor_daily_message_count(db, current_vendor.id)


@router.get("/daily/unique-users")
def vendor_daily_unique_users(
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(auth_vendor.get_current_vendor)
):
    return vendor_service.get_vendor_daily_unique_users(db, current_vendor.id)


# ------------------------------
# User-Specific Token Usage
# ------------------------------

@router.get("/user/{user_id}/tokens-last7")
def vendor_user_tokens_last7(
    user_id: int,
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(auth_vendor.get_current_vendor)
):
    return {
        "user_id": user_id,
        "tokens_last_7_days": vendor_service.get_user_tokens_last_7_days_for_vendor(
            db, current_vendor.id, user_id
        )
    }


@router.get("/user/{user_id}/tokens-total")
def vendor_user_tokens_total(
    user_id: int,
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(auth_vendor.get_current_vendor)
):
    return {
        "user_id": user_id,
        "total_tokens": vendor_service.get_user_total_tokens_for_vendor(
            db, current_vendor.id, user_id
        )
    }


@router.get("/user/{user_id}/chatbot/{chatbot_id}/messages-count")
def vendor_user_chatbot_message_count(
    user_id: int,
    chatbot_id: int,
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(auth_vendor.get_current_vendor)
):
    return {
        "user_id": user_id,
        "chatbot_id": chatbot_id,
        "message_count": vendor_service.get_user_message_count_for_chatbot_and_vendor(
            db, current_vendor.id, user_id, chatbot_id
        )
    }



