from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: Optional[str]
    address: str
    contact_no: str

class UserCreate(UserBase):
    password: str  

class UserRead(UserBase):
    id: int
   
    class Config:
        orm_mode = True