from datetime import datetime
import subprocess
import json
from typing import Optional

from celery import Task
from sqlalchemy.orm import Session
from db.database import SessionLocal
from utils.websocket_broadcaster import broadcast_llm_update
from core.celery_app import celery_app

# -----------------------------
# Helper: update LLM in DB
# -----------------------------
def update_llm(llm_id: int, **fields):
    """
    Update LLM fields in DB and broadcast update via websocket.
    """
    # Dynamic import to avoid SQLAlchemy registry issues
    from modules.llms.models.llm_model import LLM
    from modules.embeddings.models.embedding_model import Embedding
    from modules.chatbots.models.chatbot_model import Chatbot
    from modules.vendors.models.vendor_model import Vendor
    from modules.api_keys.models.api_model import APIKey
    from modules.conversations.models.conversation_model import Conversation
    from modules.documents.models.document_model import Document
    from modules.users.models.user_model import User

    db: Session = SessionLocal()
    try:
        llm: Optional[LLM] = db.get(LLM, llm_id)
        if not llm:
            return
        for key, value in fields.items():
            if hasattr(llm, key):
                setattr(llm, key, value)
        db.add(llm)
        db.commit()
        db.refresh(llm)

        # Best-effort websocket broadcast
        try:
            broadcast_llm_update(llm)
        except Exception:
            pass
    finally:
        db.close()


# -----------------------------
# Pull a model from Ollama registry (blocking)
# -----------------------------
@celery_app.task(bind=True)
def pull_ollama_model(self: Task, llm_id: int, model_path: str):
    if not model_path:
        update_llm(llm_id, pull_status="failed")
        return

    update_llm(llm_id, pull_status="pulling", pull_progress=0)

    try:
        # Blocking call; waits until download finishes
        result = subprocess.run(
            ["ollama", "pull", model_path],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )


        if result.returncode != 0:
            print("[OLLAMA PULL ERROR]", result.stderr)
            update_llm(llm_id, pull_status="failed")
            return

        # Success → get local size
        try:
            out = subprocess.check_output(["ollama", "list", "--json"], text=True)
            items = json.loads(out)
            for item in items:
                if item.get("name") == model_path:
                    size = item.get("size")
                    local_mb = round(size / (1024 * 1024), 2) if isinstance(size, (int, float)) else None
                    update_llm(
                        llm_id,
                        pull_status="success",
                        pull_progress=100,
                        is_available_locally=True,
                        local_size_mb=local_mb,
                        last_synced=datetime.utcnow()
                    )
                    break
            else:
                # fallback if model not found in list
                update_llm(
                    llm_id,
                    pull_status="success",
                    pull_progress=100,
                    is_available_locally=True,
                    last_synced=datetime.utcnow()
                )
        except Exception:
            update_llm(
                llm_id,
                pull_status="success",
                pull_progress=100,
                is_available_locally=True,
                last_synced=datetime.utcnow()
            )

    except Exception as e:
        print(f"[OLLAMA TASK EXCEPTION] {e}")
        update_llm(llm_id, pull_status="failed")


# -----------------------------
# Sync local Ollama models to DB
# -----------------------------
@celery_app.task
def sync_ollama_models():
    from modules.llms.models.llm_model import LLM

    try:
        out = subprocess.check_output(["ollama", "list", "--json"], text=True)
        items = json.loads(out)
    except Exception:
        items = []

    db: Session = SessionLocal()
    try:
        for item in items:
            name = item.get("name")
            size = item.get("size")
            if not name:
                continue
            llm: Optional[LLM] = db.query(LLM).filter(LLM.path == name).first()
            if llm:
                llm.is_available_locally = True
                llm.local_size_mb = round(size / (1024 * 1024), 2) if isinstance(size, (int, float)) else None
                llm.last_synced = datetime.utcnow()
        db.commit()
    finally:
        db.close()


# -----------------------------
# Pull embedding model
# -----------------------------
@celery_app.task
def pull_embedding_model(model_path: str, embedding_id: Optional[int] = None):
    if not model_path:
        return

    from modules.embeddings.models.embedding_model import Embedding

    db: Session = SessionLocal()
    try:
        # Blocking pull
        result = subprocess.run(
            ["ollama", "pull", model_path],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

        if result.returncode != 0:
            print("[OLLAMA EMBEDDING PULL ERROR]", result.stderr)
            return

        # Update embedding path if ID is provided
        if embedding_id:
            embedding: Optional[Embedding] = db.get(Embedding, embedding_id)
            if embedding:
                embedding.path = model_path
                db.add(embedding)
                db.commit()
    finally:
        db.close()
