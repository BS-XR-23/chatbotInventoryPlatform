from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ConversationBase(BaseModel):
    session_id: str
    chatbot_id: int
    user_id: Optional[int] = None
    is_active: Optional[bool] = True  # <-- new field

class ConversationCreate(ConversationBase):
    pass

class ConversationRead(ConversationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
