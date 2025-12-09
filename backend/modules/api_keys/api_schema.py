from pydantic import BaseModel
from typing import Optional
from chatbot.chatbotInventoryPlatform.backend.core.enums import APIKeyStatus

class APIKeyBase(BaseModel):
    name: str
    vendor_id: int
    key: str
    chatbot_id: Optional[int] = None
    status: APIKeyStatus = APIKeyStatus.active

class APIKeyCreate(APIKeyBase):
    pass

class APIKeyUpdate(BaseModel):
    
    status: Optional[APIKeyStatus] = None
    chatbot_id: Optional[int] = None

class APIKeyRead(APIKeyBase):
    id: int 
    class Config:
        orm_mode = True

