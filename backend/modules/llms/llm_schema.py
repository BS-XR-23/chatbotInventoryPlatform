from pydantic import BaseModel
from typing import Optional, Dict
from modules.embeddings.embedding_schema import EmbeddingRead

class LLMBase(BaseModel):
    name: str
    provider: str
    embedding_id: int
    def_token_limit: int
    def_context_limit: int
    path: Optional[str] = None                      
    status: Optional[str] = "active"          

class LLMCreate(LLMBase):
    pass

class LLMUpdate(BaseModel):
    name: Optional[str] = None
    provider: Optional[str] = None
    embedding_id: Optional[int] = None
    def_token_limit: Optional[int] = None
    def_context_limit: Optional[int] = None
    path: Optional[str] = None
    status: Optional[str] = None

class LLMRead(LLMBase):
    id: int
    embedding: Optional[EmbeddingRead] = None

    class Config:
        orm_mode = True


