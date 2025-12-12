from pydantic import BaseModel, ConfigDict
from typing import Optional
from core.enums import DocumentStatus

class DocumentBase(BaseModel):
    vendor_id: int
    chatbot_id: int
    title: str
    summary: str
    tags: str
    file_path: str
    status: DocumentStatus = DocumentStatus.processing

class DocumentCreate(BaseModel):
    title: str
    tags: str
    file_path: str
    summary: Optional[str] = ""  
    status: DocumentStatus = DocumentStatus.processing

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    tags: Optional[str] = None
    status: Optional[DocumentStatus] = None

class DocumentRead(DocumentBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

