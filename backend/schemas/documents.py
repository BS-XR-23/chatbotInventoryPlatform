from pydantic import BaseModel
from typing import Optional, List
from backend.models.enums import DocumentStatus

class DocumentBase(BaseModel):
    title: str
    file_path: str
    status: Optional[DocumentStatus] = DocumentStatus.processing

class DocumentCreate(DocumentBase):
    vendor_id: int

class DocumentRead(DocumentBase):
    id: int
    vendor_id: int

    class Config:
        orm_mode = True

class DocumentChunkBase(BaseModel):
    text: str
    vector: Optional[List[float]] = []
    metadata: Optional[dict] = {}

class DocumentChunkCreate(DocumentChunkBase):
    document_id: int

class DocumentChunkRead(DocumentChunkBase):
    id: int
    document_id: int

    class Config:
        orm_mode = True
