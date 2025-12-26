from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from core.enums import VendorStatus, UserRole

class VendorBase(BaseModel):
    name: str
    email: EmailStr
    domain: str
    role: UserRole = UserRole.vendor
    status: VendorStatus = VendorStatus.active

class VendorCreate(VendorBase):
    password: str 

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    domain: Optional[str] = None
    

class VendorWithStats(BaseModel):
    id: int
    name: str
    status: VendorStatus
    user_count: int
    chatbot_count: int

class VendorStatusUpdate(BaseModel):
    status: Optional[VendorStatus] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class VendorRead(VendorBase):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

