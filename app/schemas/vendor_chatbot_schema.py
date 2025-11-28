from pydantic import BaseModel

class VendorChatbotBase(BaseModel):
    pass

class VendorChatborRead(VendorChatbotBase):
    id: int
    class Config:
        orm_mode = True