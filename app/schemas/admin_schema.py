from pydantic import BaseModel, EmailStr
from typing import Optional

class AdminBase(BaseModel):
    name: str
    email: EmailStr
    role:str

class VendorCreate(AdminBase):
    password: str  

class VendorRead(AdminBase):
    id: int
   
    class Config:
        orm_mode = True