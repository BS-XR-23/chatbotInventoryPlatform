from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from core.enums import UserRole

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole = UserRole.external
    is_active: bool = True
    vendor_id: Optional[int] = None

class UserCreate(UserBase):
    password: str  

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    vendor_id: Optional[int] = None

class UserRead(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

