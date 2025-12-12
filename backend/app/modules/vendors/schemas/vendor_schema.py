from pydantic import BaseModel, EmailStr
from typing import Optional
from core.enums import VendorStatus

class VendorBase(BaseModel):
    name: str
    email: EmailStr
    domain: str
    status: VendorStatus = VendorStatus.active

class VendorCreate(VendorBase):
    password: str 

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    domain: Optional[str] = None
    

class VendorStatusUpdate(BaseModel):
    role: Optional[VendorStatus] = None

class VendorRead(VendorBase):
    id: int

    class Config:
        orm_mode = True

