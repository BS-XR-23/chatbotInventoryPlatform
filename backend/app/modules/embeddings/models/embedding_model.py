from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.orm import relationship, validates
from db.database import Base
from core.enums import EmbeddingProvider

class Embedding(Base):
    __tablename__ = "embeddings"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, nullable=False)
    provider = Column(Enum(EmbeddingProvider), nullable=False)
    path = Column(String, nullable=True)

    # string reference to LLM to avoid circular import
    llms = relationship("LLM", back_populates="embedding")

    @validates("provider")
    def validate_provider(self, key, value):
        value = value.lower()
        if value not in [e.value for e in EmbeddingProvider]:
            raise ValueError(
                f"Invalid provider '{value}'. Must be one of {[e.value for e in EmbeddingProvider]}"
            )
        return value

