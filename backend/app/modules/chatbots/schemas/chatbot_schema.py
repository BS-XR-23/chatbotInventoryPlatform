from pydantic import BaseModel, ConfigDict
from typing import Optional
from core.enums import ChatbotMode

class ChatbotBase(BaseModel):
    vendor_id: int
    name: str
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    llm_id: Optional[int] = None
    llm_path: Optional[str] = None  # New field: path to the LLM
    mode: ChatbotMode = ChatbotMode.private
    is_active: bool = True


class ChatbotCreate(ChatbotBase):
    pass

class ChatbotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    llm_id: Optional[int] = None
    llm_path: Optional[str] = None  # Allow updating path
    mode: Optional[ChatbotMode] = None
    is_active: Optional[bool] = None


class ChatbotRead(ChatbotBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


