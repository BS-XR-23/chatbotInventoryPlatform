from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from core.enums import SenderType

class MessageBase(BaseModel):
    sender_type: SenderType
    content: str
    token_count: int = 0

class MessageCreate(MessageBase):
    conversation_id: int

class MessageUpdate(BaseModel):
    content: Optional[str] = None
    token_count: Optional[int] = None

class MessageRead(MessageBase):
    id: int
    conversation_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

