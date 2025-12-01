from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from backend.models.enums import UserType, SenderType

class ConversationBase(BaseModel):
    user_type: Optional[UserType] = UserType.external
    user_id: Optional[int]

class ConversationCreate(ConversationBase):
    chatbot_id: int
    vendor_id: int

class ConversationRead(ConversationBase):
    id: int
    chatbot_id: int
    vendor_id: int
    start_time: datetime
    end_time: Optional[datetime]

    class Config:
        orm_mode = True

class MessageBase(BaseModel):
    sender: SenderType
    content: str
    token_count: Optional[int] = 0

class MessageCreate(MessageBase):
    conversation_id: int

class MessageRead(MessageBase):
    id: int
    conversation_id: int
    timestamp: datetime

    class Config:
        orm_mode = True
