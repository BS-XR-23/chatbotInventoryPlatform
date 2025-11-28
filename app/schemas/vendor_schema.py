from pydantic import BaseModel, EmailStr
from typing import Optional

class VendorBase(BaseModel):
    name: str
    email: EmailStr
    role:str

class VendorCreate(VendorBase):
    password: str  

class VendorRead(VendorBase):
    id: int
   
    class Config:
        orm_mode = True