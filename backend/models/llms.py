from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from backend.db.database import Base

class LLM(Base):
    __tablename__ = "llms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    model_type = Column(String, nullable=False)
    token_limit = Column(Integer, nullable=False)
    context_limit = Column(Integer, nullable=False)

    chatbots = relationship("Chatbot", back_populates="llm")

class Embedding(Base):
    __tablename__ = "embeddings"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    model_name = Column(String, nullable=False)
