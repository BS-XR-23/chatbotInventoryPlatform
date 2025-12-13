from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.orm import relationship
from db.database import Base
from core.enums import VendorStatus

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    domain = Column(String, unique=True, nullable=False)
    status = Column(Enum(VendorStatus, native_enum=False), default=VendorStatus.active, nullable=False)

    users = relationship("User", back_populates="vendor")
    chatbots = relationship("Chatbot", back_populates="vendor")
    documents = relationship("Document", back_populates="vendor")
    api_keys = relationship("APIKey", back_populates="vendor", cascade="all, delete-orphan")
