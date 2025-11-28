from pydantic import BaseModel
from typing import Optional

class ChatbotBase(BaseModel):
    name: str
    description: Optional[str]
    system_prompt: str
    vector_db : str
    context_limit :int
    token_limit : int

class ChatbotCreate(ChatbotBase):
    pass 

class ChatbotRead(ChatbotBase):
    id: int
   
    class Config:
        orm_mode = True