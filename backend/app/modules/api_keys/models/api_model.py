from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base
from core.enums import APIKeyStatus

class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False)
    vendor_domain = Column(String(255), nullable=False)
    status = Column(Enum(APIKeyStatus), default=APIKeyStatus.active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vendor = relationship("Vendor", back_populates="api_keys")
    chatbot = relationship("Chatbot", back_populates="api_keys")

