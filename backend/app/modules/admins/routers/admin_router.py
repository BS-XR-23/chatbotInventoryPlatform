from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.database import get_db
from modules.admins.models.admin_model import Admin
from modules.admins.schemas.admin_schema import AdminCreate, AdminRead, AdminUpdate, AdminChangePassword
from modules.auth.admins import auth_admin
from modules.admins.services import admin_service
from modules.vendors.schemas.vendor_schema import VendorRead, VendorStatusUpdate
from modules.vendors.services import vendor_service
from modules.documents.schemas.document_schema import DocumentRead
from modules.documents.services import document_service
from modules.chatbots.schemas.chatbot_schema import ChatbotRead
from modules.chatbots.services import chatbot_service


router = APIRouter(tags=["Admins"])

@router.post("/create", response_model=AdminRead)
def create_admin(admin: AdminCreate, db: Session = Depends(get_db)):
    new_admin = admin_service.create_admin(db, admin)
    if not new_admin:
        raise HTTPException(status_code=400, detail="Email already registered")
    return new_admin

@router.get("/me/{admin_id}", response_model=AdminRead)
def get_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(auth_admin.get_current_admin)
):
    admin = admin_service.get_admin(db, admin_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return admin

@router.put("/edit/{admin_id}", response_model=AdminRead)
def update_admin(
    admin_id: int,
    admin_data: AdminUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin= Depends(auth_admin.get_current_admin)
):
    updated_admin = admin_service.update_admin(db, admin_id, admin_data)
    if not updated_admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return updated_admin

@router.put("/change-password")
def update_admin_password(
    body: AdminChangePassword,
    db: Session = Depends(get_db),
    current_admin=Depends(auth_admin.get_current_admin)
):
    updated_admin, error = admin_service.change_admin_password(
        db,
        admin_id=current_admin.id,
        old_password=body.old_password,
        new_password=body.new_password
    )

    if error:
        raise HTTPException(status_code=400, detail=error)

    return {"message": "Password updated successfully"}


@router.put("/update-vendors/{vendor_id}", response_model=VendorRead)
def update_vendor_status(
    vendor_id: int,
    vendor_data: VendorStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(auth_admin.get_current_admin)
):
    updated_vendor = admin_service.update_vendor_status(db, vendor_id, vendor_data)
    if not updated_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return updated_vendor

@router.post("/chatbots/duplicate/{chatbot_id}")
def duplicate_chatbot(
    chatbot_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(auth_admin.get_current_admin)
):
    duplicated_chatbot = admin_service.duplicate_chatbot(db, chatbot_id)

    if not duplicated_chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found or cannot be duplicated")

    return duplicated_chatbot

@router.get("/documents", response_model=List[DocumentRead])
def get_documents(db: Session = Depends(get_db), current_admin: Admin = Depends(auth_admin.get_current_admin)):
    return document_service.get_documents(db)


@router.get("/most-users-by-vendors")
def most_users(db: Session = Depends(get_db), current_admin: Admin = Depends(auth_admin.get_current_admin)):
    return admin_service.get_vendor_with_most_users(db)

@router.get("/most-chatbots-by-vendors")
def most_chatbots(db: Session = Depends(get_db), current_admin: Admin = Depends(auth_admin.get_current_admin)):
    return admin_service.get_vendor_with_most_chatbots(db)

@router.get("/most-used-chatbot")
def most_used_chatbot(db: Session = Depends(get_db), current_admin: Admin = Depends(auth_admin.get_current_admin)):
    return admin_service.get_most_used_chatbot(db)

@router.get("/total-tokens/{vendor_id}")
def total_tokens(vendor_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(auth_admin.get_current_admin)):
    return admin_service.get_total_tokens_by_vendor(db, vendor_id)

@router.get("/all-vendors", response_model=List[VendorRead])
def list_vendors(db: Session = Depends(get_db)):
    return vendor_service.list_vendors(db)

@router.get("/", response_model=List[ChatbotRead])
def get_chatbots(db: Session = Depends(get_db)):
    return chatbot_service.get_chatbots(db)