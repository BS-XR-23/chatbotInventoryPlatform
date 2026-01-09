import hashlib
import base64
import secrets
from sqlalchemy.orm import Session
from fastapi import HTTPException
from modules.api_keys.models.api_model import APIKey
from modules.api_keys.schemas.api_schema import (
    APIKeyCreate,
    APIKeyUpdate,
    APIKeyCreateResponse
)
from core.enums import APIKeyStatus

def _generate_token(vendor_domain: str, chatbot_id: int):
    secret = secrets.token_urlsafe(32)
    raw = f"{vendor_domain}:{chatbot_id}:{secret}"
    encoded = base64.urlsafe_b64encode(raw.encode()).decode()
    token = f"vd_{encoded}"
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token, token_hash

def create_api_key(
    db: Session,
    api_key_data: APIKeyCreate,
    vendor_id: int
) -> APIKeyCreateResponse:

    token, token_hash = _generate_token(
        api_key_data.vendor_domain,
        api_key_data.chatbot_id
    )

    new_key = APIKey(
        vendor_id=vendor_id,
        chatbot_id=api_key_data.chatbot_id,
        vendor_domain=api_key_data.vendor_domain,
        token_hash=token_hash,
        status=APIKeyStatus.active
    )

    db.add(new_key)
    db.commit()
    db.refresh(new_key)

    return APIKeyCreateResponse(
        id=new_key.id,
        token=token
    )

def get_api_keys(db: Session, vendor_id: int):
    keys = db.query(APIKey).filter(
        APIKey.vendor_id == vendor_id
    ).all()
    return keys

def get_api_key(db: Session, key_id: int, vendor_id: int):
    key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.vendor_id == vendor_id
    ).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    return key

def update_api_key(
    db: Session,
    key_id: int,
    vendor_id: int,
    api_key_data: APIKeyUpdate
):
    key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.vendor_id == vendor_id
    ).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    for field, value in api_key_data.dict(exclude_unset=True).items():
        setattr(key, field, value)
    db.commit()
    db.refresh(key)
    return key

def delete_api_key(db: Session, key_id: int, vendor_id: int):
    key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.vendor_id == vendor_id
    ).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    key.status = APIKeyStatus.revoked
    db.commit()
