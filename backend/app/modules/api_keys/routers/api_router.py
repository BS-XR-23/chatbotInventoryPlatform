from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from modules.api_keys.services import api_service
from modules.api_keys.schemas import api_schema
from modules.vendors.models.vendor_model import Vendor
from modules.auth.vendors.auth_vendor import get_current_vendor

router = APIRouter(tags=["API Keys"])

@router.post("/create_api_key",response_model=api_schema.APIKeyCreateResponse,status_code=status.HTTP_201_CREATED)
def create_api_key(
    api_key: api_schema.APIKeyCreate,
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(get_current_vendor),
):
    return api_service.create_api_key(
        db=db,
        api_key_data=api_key,
        vendor_id=current_vendor.id
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

