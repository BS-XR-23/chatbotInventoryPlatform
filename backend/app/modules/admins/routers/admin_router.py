from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from modules.admin import admin_services
from modules.admin.admin_schema import (
    AdminCreate, AdminUpdate, AdminOut,
    SystemSettingsUpdate, SystemSettingsOut
)

router = APIRouter(prefix="/admin", tags=["Admin"])

# -------------------
# Admin Profile
# -------------------
@router.get("/profile", response_model=AdminOut)
def get_admin_profile(admin_id: int, db: Session = Depends(get_db)):
    admin = admin_services.get_admin(db, admin_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return admin

@router.put("/profile", response_model=AdminOut)
def update_admin_profile(admin_id: int, data: AdminUpdate, db: Session = Depends(get_db)):
    admin = admin_services.update_admin(db, admin_id, data)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return admin

@router.post("/", response_model=AdminOut)
def create_admin(data: AdminCreate, db: Session = Depends(get_db)):
    return admin_services.create_admin(db, data)

# -------------------
# System Settings
# -------------------
@router.get("/settings", response_model=SystemSettingsOut)
def get_system_settings(db: Session = Depends(get_db)):
    settings = admin_services.get_system_settings(db)
    if not settings:
        raise HTTPException(status_code=404, detail="System settings not found")
    return settings

@router.put("/settings", response_model=SystemSettingsOut)
def update_system_settings(data: SystemSettingsUpdate, db: Session = Depends(get_db)):
    return admin_services.update_system_settings(db, data)

# -------------------
# Analytics Overview
# -------------------
@router.get("/analytics")
def get_platform_analytics(db: Session = Depends(get_db)):
    return admin_services.get_analytics(db)

# -------------------
# Vendor Management
# -------------------
@router.get("/vendors")
def list_vendors(db: Session = Depends(get_db)):
    return admin_services.list_vendors(db)

@router.post("/vendors")
def create_vendor(data: dict, db: Session = Depends(get_db)):
    return admin_services.create_vendor(db, data)

@router.put("/vendors/{vendor_id}")
def update_vendor(vendor_id: int, data: dict, db: Session = Depends(get_db)):
    return admin_services.update_vendor(db, vendor_id, data)

@router.delete("/vendors/{vendor_id}")
def delete_vendor(vendor_id: int, db: Session = Depends(get_db)):
    return admin_services.delete_vendor(db, vendor_id)

# -------------------
# Chatbot Management
# -------------------
@router.get("/chatbots")
def list_chatbots(db: Session = Depends(get_db)):
    return admin_services.list_chatbots(db)

@router.post("/chatbots")
def create_chatbot(data: dict, db: Session = Depends(get_db)):
    return admin_services.create_chatbot(db, data)

@router.put("/chatbots/{chatbot_id}")
def update_chatbot(chatbot_id: int, data: dict, db: Session = Depends(get_db)):
    return admin_services.update_chatbot(db, chatbot_id, data)

@router.delete("/chatbots/{chatbot_id}")
def delete_chatbot(chatbot_id: int, db: Session = Depends(get_db)):
    return admin_services.delete_chatbot(db, chatbot_id)

@router.post("/chatbots/{chatbot_id}/duplicate")
def duplicate_chatbot(chatbot_id: int, db: Session = Depends(get_db)):
    return admin_services.duplicate_chatbot(db, chatbot_id)

@router.post("/chatbots/{chatbot_id}/toggle")
def toggle_chatbot_status(chatbot_id: int, db: Session = Depends(get_db)):
    return admin_services.toggle_chatbot_status(db, chatbot_id)

# -------------------
# LLM & Embeddings
# -------------------
@router.get("/llms")
def list_llms(db: Session = Depends(get_db)):
    return admin_services.list_llms(db)

@router.post("/llms")
def create_llm(data: dict, db: Session = Depends(get_db)):
    return admin_services.create_llm(db, data)

@router.put("/llms/{llm_id}")
def update_llm(llm_id: int, data: dict, db: Session = Depends(get_db)):
    return admin_services.update_llm(db, llm_id, data)

@router.delete("/llms/{llm_id}")
def delete_llm(llm_id: int, db: Session = Depends(get_db)):
    return admin_services.delete_llm(db, llm_id)

@router.get("/embeddings")
def list_embeddings(db: Session = Depends(get_db)):
    return admin_services.list_embeddings(db)

@router.post("/embeddings")
def create_embedding(data: dict, db: Session = Depends(get_db)):
    return admin_services.create_embedding(db, data)

@router.put("/embeddings/{embedding_id}")
def update_embedding(embedding_id: int, data: dict, db: Session = Depends(get_db)):
    return admin_services.update_embedding(db, embedding_id, data)

@router.delete("/embeddings/{embedding_id}")
def delete_embedding(embedding_id: int, db: Session = Depends(get_db)):
    return admin_services.delete_embedding(db, embedding_id)

# -------------------
# Document Library
# -------------------
@router.get("/documents")
def list_documents(db: Session = Depends(get_db)):
    return admin_services.list_documents(db)

@router.delete("/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    return admin_services.delete_document(db, document_id)

@router.post("/documents/{document_id}/reprocess")
def reprocess_document(document_id: int, db: Session = Depends(get_db)):
    return admin_services.reprocess_document(db, document_id)
