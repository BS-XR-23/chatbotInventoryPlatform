from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from backend.db.database import Base
from backend.models.enums import UserRole
from backend.models.conversations import Conversation

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.external)
    is_active = Column(Boolean, default=True)

    vendor = relationship("Vendor", back_populates="users")
    conversations = relationship("Conversation", back_populates="user")
