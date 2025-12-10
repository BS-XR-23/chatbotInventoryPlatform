from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    question: str 
    session_id: Optional[str] = None  
    user_id: Optional[int] = None   

class ChatResponse(BaseModel):
    answer: str
    session_id: Optional[str] = None  

