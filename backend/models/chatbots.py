from sqlalchemy import Column, Integer, String, Text, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from backend.db.database import Base
from backend.models.enums import ChatbotMode
from backend.models.llms import LLM

class Chatbot(Base):
    __tablename__ = "chatbots"
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    system_prompt = Column(Text, nullable=False)
    llm_id = Column(Integer, ForeignKey("llms.id"))
    vector_db = Column(String, default="qdrant")
    mode = Column(Enum(ChatbotMode), default=ChatbotMode.private)
    is_active = Column(Boolean, default=True)

    vendor = relationship("Vendor", back_populates="chatbots")
    llm = relationship("LLM", back_populates="chatbots")
    documents = relationship("ChatbotDocument", back_populates="chatbot")
    conversations = relationship("Conversation", back_populates="chatbot")
    api_keys = relationship("APIKey", back_populates="chatbot")

class ChatbotDocument(Base):
    __tablename__ = "chatbot_documents"
    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    tags = Column(String)
    summary = Column(Text)

    chatbot = relationship("Chatbot", back_populates="documents")
    document = relationship("Document", back_populates="chatbots")
