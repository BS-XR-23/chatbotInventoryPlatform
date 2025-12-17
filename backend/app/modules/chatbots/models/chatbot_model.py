from sqlalchemy import Column, Integer, String, Text, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from db.database import Base
from core.enums import ChatbotMode

class Chatbot(Base):
    __tablename__ = "chatbots"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    system_prompt = Column(Text, nullable=True)
    llm_id = Column(Integer, ForeignKey("llms.id"))
    llm_path = Column(String, nullable=False) 
    mode = Column(Enum(ChatbotMode), default=ChatbotMode.private)
    is_active = Column(Boolean, default=True)

    vendor = relationship("Vendor", back_populates="chatbots")
    llm = relationship("LLM", back_populates="chatbots")
    documents = relationship("Document", back_populates="chatbot", cascade="all, delete-orphan")
    messages = relationship("Conversation", back_populates="chatbot", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="chatbot", cascade="all, delete-orphan")
    vector_dbs = relationship("VectorDB", back_populates="chatbot")








