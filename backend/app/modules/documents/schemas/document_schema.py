from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from core.enums import DocumentStatus

class DocumentBase(BaseModel):
    chatbot_id: int
    title: str
    file_path: str
    status: DocumentStatus = DocumentStatus.processing

class DocumentCreate(BaseModel):
    title: str
    file_path: str
    status: DocumentStatus = DocumentStatus.processing

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[DocumentStatus] = None

class DocumentRead(DocumentBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# from pydantic import BaseModel, ConfigDict
# from typing import Optional
# from core.enums import DocumentStatus

# class DocumentBase(BaseModel):
#     chatbot_id: int
#     title: str
#     summary: Optional[str] =None
#     tags: Optional[str] =None
#     file_path: str
#     status: DocumentStatus = DocumentStatus.processing

# class DocumentCreate(BaseModel):
#     title: str
#     file_path: str
#     tags: Optional[str]
#     summary: Optional[str] = ""  
#     status: DocumentStatus = DocumentStatus.processing

# class DocumentUpdate(BaseModel):
#     title: Optional[str] = None
#     summary: Optional[str] = None
#     tags: Optional[str] = None
#     status: Optional[DocumentStatus] = None

# class DocumentRead(DocumentBase):
#     id: int

#     model_config = ConfigDict(from_attributes=True)

