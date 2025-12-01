from pydantic import BaseModel
from backend.models.enums import APIKeyStatus
from typing import Optional

class APIKeyBase(BaseModel):
    key: str
    status: Optional[APIKeyStatus] = APIKeyStatus.active

class APIKeyCreate(APIKeyBase):
    vendor_id: int
    chatbot_id: Optional[int]

class APIKeyRead(APIKeyBase):
    id: int
    vendor_id: int
    chatbot_id: Optional[int]

    class Config:
        orm_mode = True
