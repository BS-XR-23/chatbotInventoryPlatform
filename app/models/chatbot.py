from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.config.database import Base

class Chatbot(Base):
    __tablename__ = "chatbot"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    system_prompt = Column(String, nullable=False, default="You are a helpful AI assistant")
    vector_db = Column(String, nullable=False)
    context_limit = Column(Float, nullable=False)
    token_limit = Column(Float, nullable=False)
    llm_id = Column(Integer, ForeignKey("llm.id"), nullable=False)

    llm = relationship("LLM", back_populates="chatbots")
    documents = relationship("Document", back_populates="chatbot")
    vendor_chatbots = relationship("VendorChatbot", back_populates="chatbot")