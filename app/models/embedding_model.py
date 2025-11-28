from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.config.database import Base

class EmbeddingModel(Base):
    __tablename__ = "embedding_model"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    llms = relationship("LLM", back_populates="embedding_model")
