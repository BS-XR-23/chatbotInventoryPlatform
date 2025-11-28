from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.database import Base

class ConversationHistory(Base):
    __tablename__ = "conversation_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    admin_id = Column(Integer, ForeignKey("admins.id"))
    history = Column(Text, default="")
    token_usage = Column(Integer, nullable=False, default=0)
    session_metadata = Column(String, nullable = False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="conversations")
    