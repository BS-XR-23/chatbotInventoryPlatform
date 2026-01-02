from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from core.enums import APIKeyStatus

class APIKeyBase(BaseModel):
    vendor_id: int
    chatbot_id: int
    vendor_domain: str
    status: APIKeyStatus = APIKeyStatus.active

class APIKeyCreate(BaseModel):
    vendor_id: int
    chatbot_id: int
    vendor_domain: str

class APIKeyCreateResponse(BaseModel):
    id: int
    token: str

class APIKeyUpdate(BaseModel):
    status: Optional[APIKeyStatus] = None

class APIKeyRead(BaseModel):
    id: int
    vendor_id: int
    chatbot_id: int
    vendor_domain: str
    status: APIKeyStatus
    token_hash: str

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class APIKeyContext(BaseModel):
    vendor_id: int
    chatbot_id: int
    vendor_domain: str
    api_key_id: int

