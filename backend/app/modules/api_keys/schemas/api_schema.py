from pydantic import BaseModel
from typing import Optional
from core.enums import APIKeyStatus

class APIKeyBase(BaseModel):
    name: str
    vendor_id: int
    key: str
    status: APIKeyStatus = APIKeyStatus.active

class APIKeyCreate(APIKeyBase):
    pass

class APIKeyUpdate(BaseModel):
    status: Optional[APIKeyStatus] = None

class APIKeyRead(APIKeyBase):
    id: int 
    class Config:
        orm_mode = True

