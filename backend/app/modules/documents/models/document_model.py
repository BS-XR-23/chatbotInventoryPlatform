from sqlalchemy import Column, Integer, String, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from db.database import Base
from core.enums import DocumentStatus

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
    title = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.processing)

    vendor = relationship("Vendor", back_populates="documents")
    chatbot = relationship("Chatbot", back_populates="documents")


# class Document(Base):
#     __tablename__ = "documents"

#     id = Column(Integer, primary_key=True, index=True)
#     vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
#     chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
#     title = Column(String, nullable=False)
#     summary = Column(Text, nullable=True)
#     tags = Column(String, nullable=True)
#     file_path = Column(String, nullable=False)
#     status = Column(Enum(DocumentStatus), default=DocumentStatus.processing)

#     vendor = relationship("Vendor", back_populates="documents")
#     chatbot = relationship("Chatbot", back_populates="documents")



