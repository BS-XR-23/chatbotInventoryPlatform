from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.db.database import get_db
from backend.models.api_keys import APIKey
from backend.schemas.api_keys import APIKeyCreate, APIKeyRead

router = APIRouter(prefix="/api-keys", tags=["API Keys"])

# Create API Key
@router.post("/", response_model=APIKeyRead)
def create_api_key(api_key: APIKeyCreate, db: Session = Depends(get_db)):
    new_key = APIKey(**api_key.dict())
    db.add(new_key)
    db.commit()
    db.refresh(new_key)
    return new_key

# Get all API Keys
@router.get("/", response_model=List[APIKeyRead])
def get_api_keys(db: Session = Depends(get_db)):
    api_keys = db.query(APIKey).all()  # ORM query
    return api_keys

# Get single API Key
@router.get("/{key_id}", response_model=APIKeyRead)
def get_api_key(key_id: int, db: Session = Depends(get_db)):
    key = db.query(APIKey).get(key_id)  # ORM query
    if not key:
        raise HTTPException(status_code=404, detail="API Key not found")
    return key

# Update API Key
@router.put("/{key_id}", response_model=APIKeyRead)
def update_api_key(key_id: int, api_key_data: APIKeyCreate, db: Session = Depends(get_db)):
    key = db.query(APIKey).get(key_id)
    if not key:
        raise HTTPException(status_code=404, detail="API Key not found")
    for k, v in api_key_data.dict().items():
        setattr(key, k, v)
    db.add(key)
    db.commit()
    db.refresh(key)
    return key

# Delete API Key
@router.delete("/{key_id}")
def delete_api_key(key_id: int, db: Session = Depends(get_db)):
    key = db.query(APIKey).get(key_id)
    if not key:
        raise HTTPException(status_code=404, detail="API Key not found")
    db.delete(key)
    db.commit()
    return {"detail": "API Key deleted successfully"}
