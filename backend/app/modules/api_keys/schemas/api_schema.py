from pydantic import BaseModel, ConfigDict
from typing import Optional
from core.enums import APIKeyStatus

class APIKeyBase(BaseModel):
    vendor_id: int
    user_id: int
    chatbot_id: int
    key: str
    status: APIKeyStatus = APIKeyStatus.active

class APIKeyCreate(APIKeyBase):
    pass

class APIKeyUpdate(BaseModel):
    chatbot_id: Optional[int] = None
    status: Optional[APIKeyStatus] = None

class APIKeyRead(APIKeyBase):
    id: int 
    model_config = ConfigDict(from_attributes=True)

