from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.config.database import Base

class Vendor(Base):
    __tablename__ = "vendor"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="admin")
    
    documents = relationship("Document", back_populates="uploaded_by")
    vendor_chatbots = relationship("VendorChatbot", back_populates="vendor")