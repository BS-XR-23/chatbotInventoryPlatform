from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from datetime import datetime
from typing import List, Optional
from pathlib import Path
import uuid, shutil
from core.enums import DocumentStatus
from modules.documents.models.document_model import Document
from modules.documents.schemas.document_schema import DocumentCreate
from modules.rag.services import rag_service
from modules.chatbots.models.chatbot_model import Chatbot
from modules.llms.models.llm_model import LLM
from modules.embeddings.models.embedding_model import Embedding
from modules.vector_dbs.models.vector_db_model import VectorDB
# from utils.ai_summarizer import summarize_documents_generate_tags

UPLOAD_DIR = Path("temp_uploads")
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

PERMANENT_UPLOAD_DIR = Path("uploads/documents")
PERMANENT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def create_documents_bulk(
    db: Session,
    chatbot_id: int,
    files: List[UploadFile]
) -> List[Document]:
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    saved_documents = []
    upload_dir = PERMANENT_UPLOAD_DIR / str(chatbot_id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    for file in files:
        unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
        file_path = upload_dir / unique_filename

        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        doc = Document(
            chatbot_id=chatbot_id,
            title=file.filename,
            file_path=str(file_path),
            status="processing"  
        )
        db.add(doc)
        saved_documents.append(doc)

    db.commit()
    for doc in saved_documents:
        db.refresh(doc)

    return saved_documents

def get_documents(db: Session) -> List[Document]:
    return db.query(Document).all()

def get_specific_documents(db: Session, chatbot_id: int):
    if chatbot_id:
        documents = db.query(Document).filter(Document.chatbot_id==chatbot_id).all()
        return documents



def get_documents_by_chatbot(db: Session, chatbot_id: int):
    return db.query(Document).filter(Document.chatbot_id == chatbot_id).all()


def get_document(db: Session, document_id: int) -> Document:
    return db.query(Document).filter(Document.id == document_id).first()

def update_document(db: Session, document_id: int, document_data: DocumentCreate) -> Document:
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        return None
    for key, value in document_data.dict().items():
        setattr(document, key, value)
    db.commit()
    db.refresh(document)
    return document

def delete_document(db: Session, document_id: int) -> bool:
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        return False
    db.delete(document)
    db.commit()
    return True


def embed_document(db: Session, document_id: int) -> VectorDB:
    try:
        document_obj = db.query(Document).filter(Document.id == document_id).first()
        if not document_obj:
            raise HTTPException(status_code=404, detail="Document not found")

        chatbot = db.query(Chatbot).filter(
            Chatbot.id == document_obj.chatbot_id,
            Chatbot.is_active == True
        ).first()
        if not chatbot:
            raise HTTPException(status_code=404, detail="Associated chatbot not found or inactive")

        llm_obj = db.query(LLM).filter(LLM.id == chatbot.llm_id).first()
        if not llm_obj:
            raise HTTPException(status_code=404, detail="LLM not found for this chatbot")

        embedd_obj = db.query(Embedding).filter(Embedding.id == llm_obj.embedding_id).first()
        if not embedd_obj:
            raise HTTPException(status_code=404, detail="Embedding not found for this LLM")

        document_list = db.query(Document).filter(Document.chatbot_id == chatbot.id).all()
        if not document_list:
            raise HTTPException(status_code=404, detail="No documents found for this chatbot")

        existing_count = db.query(VectorDB).filter(VectorDB.chatbot_id == chatbot.id).count()
        vector_db_name = f"{chatbot.name}_vdb_{existing_count + 1}"

        vectordb_obj = rag_service.embedd_document(db, chatbot.id, embedd_obj, document_list)
        persist_path = vectordb_obj._persist_directory


        vector_db = VectorDB(
            chatbot_id=chatbot.id,
            name=vector_db_name,
            db_path=persist_path, 
            is_active=True
        )
        db.add(vector_db)

        for doc in document_list:
            doc.status = DocumentStatus.embedded

        db.commit()
        db.refresh(vector_db)

        return vector_db

    except Exception as e:
        db.rollback()
        if 'document_list' in locals():
            for doc in document_list:
                doc.status = DocumentStatus.processing_failed
            db.commit()
        raise e



