from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException
from typing import List
from modules.api_keys.models.api_model import APIKey
from modules.api_keys.schemas.api_schema import APIKeyCreate, APIKeyUpdate

def create_api_key(db: Session, api_key_data: APIKeyCreate) -> APIKey:
    new_key = APIKey(**api_key_data.dict())
    db.add(new_key)
    db.commit()
    db.refresh(new_key)
    return new_key


def get_api_keys(db: Session, user_id: int) -> list[APIKey]:
    keys = db.query(APIKey).filter_by(user_id=user_id).all()
    if not keys:
        raise HTTPException(status_code=404, detail="No API keys found for this user")
    return keys


def get_api_key(db: Session, key_id: int) -> APIKey:
    api_key = db.query(APIKey).get(key_id)
    if not api_key:
        raise HTTPException(status_code=404, detail=f"API key with id {key_id} not found")
    return api_key


def update_api_key(db: Session, key_id: int, api_key_data: APIKeyUpdate) -> APIKey:
    key = db.query(APIKey).get(key_id)
    if not key:
        return None
    for k, v in api_key_data.dict().items():
        setattr(key, k, v)
    db.add(key)
    db.commit()
    db.refresh(key)
    return key


def delete_api_key(db: Session, key_id: int) -> bool:
    key = db.query(APIKey).get(key_id)
    if not key:
        return False
    db.delete(key)
    db.commit()
    return True
