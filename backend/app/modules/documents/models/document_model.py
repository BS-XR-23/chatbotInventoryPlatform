from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base
from core.enums import DocumentStatus

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
    title = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.processing)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    chatbot = relationship("Chatbot", back_populates="documents")




