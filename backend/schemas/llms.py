from pydantic import BaseModel
from typing import Optional

class LLMBase(BaseModel):
    name: str
    model_type: str
    token_limit: int
    context_limit: int

class LLMCreate(LLMBase):
    pass

class LLMRead(LLMBase):
    id: int

    class Config:
        orm_mode = True

class EmbeddingBase(BaseModel):
    name: str
    model_name: str

class EmbeddingCreate(EmbeddingBase):
    pass

class EmbeddingRead(EmbeddingBase):
    id: int

    class Config:
        orm_mode = True
