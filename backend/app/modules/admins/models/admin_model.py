from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, DateTime, Enum
from sqlalchemy.orm import relationship
from db.database import Base


class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    
    documents = relationship("Document", back_populates="uploaded_by")
    conversations = relationship("ConversationHistory", back_populates="admin")