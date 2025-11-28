from pydantic import BaseModel
from typing import Optional

class LlmBase(BaseModel):
    name: str
    company_name: str
    system_prompt: str
    default_ctx_limit :int
    default_token_limit : int

class LlmCreate(LlmBase):
    pass 

class LlmRead(LlmBase):
    id: int
   
    class Config:
        orm_mode = True