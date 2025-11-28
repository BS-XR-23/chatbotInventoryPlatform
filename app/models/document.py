from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.config.database import Base

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    chunk_summary = Column(String, nullable = False)
    summary = Column(Text, nullable=False)
    tags = Column(String, nullable=False)
    chatbot_id = Column(Integer, ForeignKey("chatbot.id"), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("vendor.id"), nullable=False)

    uploaded_by = relationship("Vendor", back_populates="documents")
    chatbot = relationship("Chatbot", back_populates="documents")