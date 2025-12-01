from sqlalchemy import Column, Integer, String, ForeignKey, Text, Enum, JSON
from sqlalchemy.orm import relationship
from backend.db.database import Base
from backend.models.enums import DocumentStatus

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    title = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.processing)

    vendor = relationship("Vendor", back_populates="documents")
    chatbots = relationship("ChatbotDocument", back_populates="document")
    chunks = relationship("DocumentChunk", back_populates="document")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    text = Column(Text, nullable=False)
    vector = Column(JSON)
    metadata = Column(JSON)

    document = relationship("Document", back_populates="chunks")
