from pydantic import BaseModel
from typing import Optional
from core.enums import ChatbotMode

class ChatbotBase(BaseModel):
    vendor_id: int
    name: str
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    llm_id: Optional[int] = None
    llm_path: Optional[str] = None  # New field: path to the LLM
    api_key_id: Optional[int] = None
    vector_db: Optional[str] = None
    mode: ChatbotMode = ChatbotMode.private
    is_active: bool = True
    token_limit: int
    context_limit: int

class ChatbotCreate(ChatbotBase):
    pass

class ChatbotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    llm_id: Optional[int] = None
    llm_path: Optional[str] = None  # Allow updating path
    api_key_id: Optional[int] = None
    vector_db: Optional[str] = None
    mode: Optional[ChatbotMode] = None
    is_active: Optional[bool] = None
    token_limit: Optional[int] = None
    context_limit: Optional[int] = None

class ChatbotRead(ChatbotBase):
    id: int

    class Config:
        orm_mode = True


