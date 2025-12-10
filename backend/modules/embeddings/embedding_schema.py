from pydantic import BaseModel
from typing import Optional
from core.enums import EmbeddingProvider

class EmbeddingBase(BaseModel):
    model_name: str
    provider: EmbeddingProvider
    path: Optional[str] = None  

class EmbeddingCreate(EmbeddingBase):
    pass

class EmbeddingUpdate(BaseModel):
    model_name: Optional[str] = None
    provider: Optional[EmbeddingProvider] = None
    path: Optional[str] = None

class EmbeddingRead(EmbeddingBase):
    id: int

    class Config:
        orm_mode = True
