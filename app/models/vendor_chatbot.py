from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.config.database import Base

class VendorChatbot(Base):
    __tablename__ = "vendor_chatbot"
    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(Integer, ForeignKey("chatbot.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendor.id"), nullable=False)
    
    vendor = relationship("Vendor", back_populates="vendor_chatbots")
    chatbot = relationship("Chatbot", back_populates="vendor_chatbots")