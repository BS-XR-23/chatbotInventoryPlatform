from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.database import get_db
from modules.api_keys.services import api_service
from modules.api_keys.schemas import api_schema
from modules.users.models.user_model import User
from modules.vendors.models.vendor_model import Vendor
from modules.auth.vendors.auth_vendor import get_current_vendor
from modules.auth.users.auth_user import get_current_user


router = APIRouter(tags=["API Keys"])

# Create API Key
@router.post("/", response_model=api_schema.APIKeyRead)
def create_api_key(api_key: api_schema.APIKeyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return api_service.create_api_key(db, api_key)

# Get all API Keys
@router.get("/", response_model=List[api_schema.APIKeyRead])
def get_api_keys(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return api_service.get_api_keys(db, current_user.id)

# Get single API Key
@router.get("/{key_id}", response_model=api_schema.APIKeyRead)
def get_api_key(key_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    key = api_service.get_api_key(db, key_id)
    if not key:
        raise HTTPException(status_code=404, detail="API Key not found")
    return key

# Update API Key
@router.put("/{key_id}", response_model=api_schema.APIKeyRead)
def update_api_key(key_id: int, api_key_data: api_schema.APIKeyCreate, db: Session = Depends(get_db), current_vendor: Vendor = Depends(get_current_vendor)):
    key = api_service.update_api_key(db, key_id, api_key_data)
    if not key:
        raise HTTPException(status_code=404, detail="API Key not found")
    return key

# Delete API Key
@router.delete("/{key_id}")
def delete_api_key(key_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    success = api_service.delete_api_key(db, key_id)
    if not success:
        raise HTTPException(status_code=404, detail="API Key not found")
    return {"detail": "API Key deleted successfully"}
