from pydantic import BaseModel, EmailStr
from typing import Optional
from backend.models.enums import UserRole

class UserBase(BaseModel):
    email: EmailStr
    role: Optional[UserRole] = UserRole.external
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str
    vendor_id: Optional[int]  # nullable for external users

class UserRead(UserBase):
    id: int
    vendor_id: Optional[int]

    class Config:
        orm_mode = True
