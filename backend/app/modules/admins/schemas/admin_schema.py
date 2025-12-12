from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

class AdminBase(BaseModel):
    email: EmailStr
    name: str

class AdminCreate(AdminBase):
    password: str  

class AdminUpdate(AdminBase):
    email: Optional[EmailStr]
    name: Optional[str]

class AdminChangePassword(BaseModel):
    old_password: str
    new_password: str

class AdminRead(AdminBase):
    id: int
   
    model_config = ConfigDict(from_attributes=True)
