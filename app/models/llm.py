from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.config.database import Base

class LLM(Base):
    __tablename__ = "llm"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    company_name = Column(String, nullable=False)
    default_ctx_limit = Column(Float, nullable=False)
    default_token_limit = Column(Float, nullable=False)
    embedding_model_id = Column(Integer, ForeignKey("embedding_model.id"), nullable=False)

    chatbots = relationship("Chatbot", back_populates="llm")
    embedding_model = relationship("EmbeddingModel", back_populates="llms")

