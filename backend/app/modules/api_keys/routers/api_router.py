from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from modules.api_keys.services import api_service
from modules.api_keys.models.api_model import APIKey
from modules.api_keys.schemas import api_schema
from modules.vendors.models.vendor_model import Vendor
from modules.auth.vendors.auth_vendor import get_current_vendor
from modules.auth.admins.auth_admin import get_current_admin

router = APIRouter(tags=["API Keys"])

@router.post(
    "/create",
    response_model=api_schema.APIKeyCreateResponse,
    status_code=status.HTTP_201_CREATED
)
def admin_create_api_key(
    api_key: api_schema.APIKeyCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return api_service.create_api_key(
        db=db,
        api_key_data=api_key,
        vendor_id=api_key.vendor_id
    )

@router.get(
    "/by-vendor/{vendor_id}",
    response_model=list[api_schema.APIKeyRead]
)
def get_api_keys_by_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return (
        db.query(APIKey)
        .filter(APIKey.vendor_id == vendor_id)
        .order_by(APIKey.created_at.desc())
        .all()
    )


@router.get("/list_of_keys",response_model=List[api_schema.APIKeyRead])
def get_api_keys(
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(get_current_vendor),
):
    return api_service.get_api_keys(
        db=db,
        vendor_id=current_vendor.id
    )

@router.get("/by-chatbot/{chatbot_id}", response_model=List[api_schema.APIKeyRead])
def get_api_keys_by_chatbot(chatbot_id: int, db: Session = Depends(get_db), current_admin = Depends(get_current_admin)):
    return db.query(APIKey).filter(APIKey.chatbot_id == chatbot_id).all()


@router.get("/api_key/{key_id}",response_model=api_schema.APIKeyRead)
def get_api_key(
    key_id: int,
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(get_current_vendor),
):
    return api_service.get_api_key(
        db=db,
        key_id=key_id,
        vendor_id=current_vendor.id
    )

@router.put("/update_status/{key_id}",response_model=api_schema.APIKeyRead)
def update_api_key(
    key_id: int,
    api_key_data: api_schema.APIKeyUpdate,
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(get_current_vendor),
):
    return api_service.update_api_key(
        db=db,
        key_id=key_id,
        vendor_id=current_vendor.id,
        api_key_data=api_key_data
    )

@router.delete("/remove_key/{key_id}")
def delete_api_key(
    key_id: int,
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(get_current_vendor),
):
    api_service.delete_api_key(
        db=db,
        key_id=key_id,
        vendor_id=current_vendor.id
    )
    return {"detail": "API key revoked successfully"}

