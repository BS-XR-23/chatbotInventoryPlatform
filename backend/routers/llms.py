from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.db.database import get_db
from backend.models.llms import LLM, Embedding
from backend.schemas.llms import LLMCreate, LLMRead, EmbeddingCreate, EmbeddingRead

# --- LLM Router ---
router = APIRouter(prefix="/llms", tags=["LLMs"])

@router.post("/", response_model=LLMRead)
def create_llm(llm: LLMCreate, db: Session = Depends(get_db)):
    new_llm = LLM(**llm.dict())
    db.add(new_llm)
    db.commit()
    db.refresh(new_llm)
    return new_llm

@router.get("/", response_model=List[LLMRead])
def get_llms(db: Session = Depends(get_db)):
    return db.query(LLM).all()  # ORM query

@router.get("/{llm_id}", response_model=LLMRead)
def get_llm(llm_id: int, db: Session = Depends(get_db)):
    llm = db.query(LLM).filter(LLM.id == llm_id).first()
    if not llm:
        raise HTTPException(status_code=404, detail="LLM not found")
    return llm

@router.put("/{llm_id}", response_model=LLMRead)
def update_llm(llm_id: int, llm_data: LLMCreate, db: Session = Depends(get_db)):
    llm = db.query(LLM).filter(LLM.id == llm_id).first()
    if not llm:
        raise HTTPException(status_code=404, detail="LLM not found")
    for key, value in llm_data.dict().items():
        setattr(llm, key, value)
    db.commit()
    db.refresh(llm)
    return llm

@router.delete("/{llm_id}")
def delete_llm(llm_id: int, db: Session = Depends(get_db)):
    llm = db.query(LLM).filter(LLM.id == llm_id).first()
    if not llm:
        raise HTTPException(status_code=404, detail="LLM not found")
    db.delete(llm)
    db.commit()
    return {"detail": "LLM deleted successfully"}


# --- Embeddings Router ---
embedding_router = APIRouter(prefix="/embeddings", tags=["Embeddings"])

@embedding_router.post("/", response_model=EmbeddingRead)
def create_embedding(embed: EmbeddingCreate, db: Session = Depends(get_db)):
    new_embed = Embedding(**embed.dict())
    db.add(new_embed)
    db.commit()
    db.refresh(new_embed)
    return new_embed

@embedding_router.get("/", response_model=List[EmbeddingRead])
def get_embeddings(db: Session = Depends(get_db)):
    return db.query(Embedding).all()  # ORM query

@embedding_router.get("/{embedding_id}", response_model=EmbeddingRead)
def get_embedding(embedding_id: int, db: Session = Depends(get_db)):
    embed = db.query(Embedding).filter(Embedding.id == embedding_id).first()
    if not embed:
        raise HTTPException(status_code=404, detail="Embedding not found")
    return embed

@embedding_router.put("/{embedding_id}", response_model=EmbeddingRead)
def update_embedding(embedding_id: int, embed_data: EmbeddingCreate, db: Session = Depends(get_db)):
    embed = db.query(Embedding).filter(Embedding.id == embedding_id).first()
    if not embed:
        raise HTTPException(status_code=404, detail="Embedding not found")
    for key, value in embed_data.dict().items():
        setattr(embed, key, value)
    db.commit()
    db.refresh(embed)
    return embed

@embedding_router.delete("/{embedding_id}")
def delete_embedding(embedding_id: int, db: Session = Depends(get_db)):
    embed = db.query(Embedding).filter(Embedding.id == embedding_id).first()
    if not embed:
        raise HTTPException(status_code=404, detail="Embedding not found")
    db.delete(embed)
    db.commit()
    return {"detail": "Embedding deleted successfully"}
