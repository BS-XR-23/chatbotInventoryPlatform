from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from core.enums import ChatbotMode, VectorStoreType

class ChatbotBase(BaseModel):
    vendor_id: int
    name: str
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    llm_id: Optional[int] = None
    llm_path: Optional[str] = None  
    mode: ChatbotMode = ChatbotMode.private
    is_active: bool = True
    vector_store_type: VectorStoreType = VectorStoreType.chroma
    vector_store_config: Optional[Dict[str, Any]] = None  

class ChatbotCreate(ChatbotBase):
    pass

class ChatbotUpdate(BaseModel):
    name: Optional[str] = None
    vendor_id : Optional[int] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    llm_id: Optional[int] = None
    llm_path: Optional[str] = None
    mode: Optional[ChatbotMode] = None
    is_active: Optional[bool] = None
    vector_store_type: Optional[VectorStoreType] = None
    vector_store_config: Optional[Dict[str, Any]] = None

class ChatbotRead(ChatbotBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
