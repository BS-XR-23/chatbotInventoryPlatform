from pydantic import BaseModel, validator
from typing import Optional

class EmbeddingBase(BaseModel):
    name: str
    model_name: str
    @validator("name")
    def name_must_be_lowercase(cls, v: str) -> str:
        if not v:
            raise ValueError("name cannot be empty")
        return v.lower()

class EmbeddingCreate(EmbeddingBase):
    pass

class EmbeddingUpdate(BaseModel):
    name: Optional[str] = None
    model_name: Optional[str] = None

    @validator("name")
    def name_must_be_lowercase(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.lower()
        return v

class EmbeddingRead(EmbeddingBase):
    id: int

    class Config:
        orm_mode = True
