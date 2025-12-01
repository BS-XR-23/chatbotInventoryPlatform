from pydantic import BaseModel
from typing import Optional
from backend.models.enums import ChatbotMode

class ChatbotBase(BaseModel):
    name: str
    description: Optional[str]
    system_prompt: str
    llm_id: Optional[int]
    vector_db: Optional[str] = "qdrant"
    mode: Optional[ChatbotMode] = ChatbotMode.private
    is_active: Optional[bool] = True

class ChatbotCreate(ChatbotBase):
    vendor_id: int

class ChatbotRead(ChatbotBase):
    id: int
    vendor_id: int

    class Config:
        orm_mode = True

class ChatbotDocumentBase(BaseModel):
    tags: Optional[str]
    summary: Optional[str]

class ChatbotDocumentCreate(ChatbotDocumentBase):
    chatbot_id: int
    document_id: int

class ChatbotDocumentRead(ChatbotDocumentBase):
    id: int
    chatbot_id: int
    document_id: int

    class Config:
        orm_mode = True
