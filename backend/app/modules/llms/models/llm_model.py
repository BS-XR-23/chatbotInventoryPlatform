# modules/llms/llm_model.py
from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship, validates
from db.database import Base
from core.enums import LLMProvider


class LLM(Base):
    __tablename__ = "llms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    provider = Column(Enum(LLMProvider), nullable=False)
    embedding_id = Column(Integer, ForeignKey("embeddings.id"), nullable=False)

    def_token_limit = Column(Integer, nullable=False)
    def_context_limit = Column(Integer, nullable=False)

    path = Column(String, nullable=True)

    chatbots = relationship("Chatbot", back_populates="llm", cascade="all, delete-orphan")
    embedding = relationship("Embedding", back_populates="llms")

    @validates("provider")
    def validate_provider(self, key, value):
        value = value.lower()
        if value not in [e.value for e in LLMProvider]:
            raise ValueError(
                f"Invalid provider '{value}'. Must be one of {[e.value for e in LLMProvider]}"
            )
        return value

