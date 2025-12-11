# modules/llms/llm_service.py
from sqlalchemy.orm import Session
import threading, subprocess
from typing import List, Optional
from modules.llms.models.llm_model import LLM
from modules.llms.schemas.llm_schema import LLMCreate, LLMUpdate
from utils.ollama_tasks import pull_ollama_model, pull_embedding_model, sync_ollama_models



def create_llm(db: Session, data: LLMCreate) ->LLM:
    """Create LLM record and start background pull."""
    llm = LLM(**data.dict())
    db.add(llm)
    db.commit()
    db.refresh(llm)

    # Trigger pull
    pull_in_background(llm.path)

    return llm


def pull_in_background(path: str):
    threading.Thread(
        target=lambda: subprocess.call(["ollama", "pull", path]),
        daemon=True
    ).start()


def get_llms(db: Session) -> List[LLM]:
    return db.query(LLM).all()


def get_llm(db: Session, llm_id: int) -> Optional[LLM]:
    return db.query(LLM).filter(LLM.id == llm_id).first()


def update_llm(db: Session, llm_id: int, llm_data: LLMUpdate) -> Optional[LLM]:
    llm = db.query(LLM).filter(LLM.id == llm_id).first()
    if not llm:
        return None
    for key, value in llm_data.dict(exclude_unset=True).items():
        setattr(llm, key, value)
    db.commit()
    db.refresh(llm)
    return llm


def delete_llm(db: Session, llm_id: int) -> bool:
    llm = db.query(LLM).filter(LLM.id == llm_id).first()
    if not llm:
        return False
    db.delete(llm)
    db.commit()
    return True


# def trigger_pull(db: Session, llm_id: int) -> Optional[LLM]:
#     llm = get_llm(db, llm_id)
#     if not llm:
#         return None
#     pull_ollama_model.delay(llm.id, llm.path)
#     return llm


# def bulk_pull(db: Session, ids: List[int]) -> List[LLM]:
#     llms = db.query(LLM).filter(LLM.id.in_(ids)).all()
#     for l in llms:
#         pull_ollama_model.delay(l.id, l.path)
#     return llms


# def trigger_sync_registry():
#     # fire-and-forget: Celery will run sync and update DB
#     try:
#         sync_ollama_models.delay()
#     except Exception:
#         pass

