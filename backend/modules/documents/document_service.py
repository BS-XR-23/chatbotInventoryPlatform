from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List
from pathlib import Path
import uuid, shutil
from modules.documents.document_model import Document
from modules.documents.document_schema import DocumentCreate
from modules.rag import rag_service
from modules.chatbots.chatbot_model import Chatbot
from modules.llms.llm_model import LLM
from modules.embeddings.embedding_model import Embedding
from modules.documents.utils.ai_summarizer import summarize_documents_generate_tags

UPLOAD_DIR = Path("temp_uploads")
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)


def preview_document(file, vendor_id: int, chatbot_id: int) -> DocumentCreate:
    """
    Save file temporarily, generate summary and tags.
    """
    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    temp_file_path = UPLOAD_DIR / unique_filename
    with open(temp_file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        ai_summary, ai_tags = summarize_documents_generate_tags(temp_file_path)
        preview_data = DocumentCreate(
            title=file.filename,
            summary=ai_summary,
            tags=ai_tags,
            file_path=str(temp_file_path),
            status="processing"
        )
    finally:
        pass

    return preview_data



def save_document(db: Session, vendor_id: int, chatbot_id: int, title: str, summary: str, tags: str, file_path: str):

    db_document = Document(
        vendor_id=vendor_id,
        chatbot_id=chatbot_id,
        title=title,
        summary=summary,
        tags=tags,
        file_path=file_path,
        status="success"  
    )

    db.add(db_document)
    db.commit()
    db.refresh(db_document)  

    return db_document

def get_documents(db: Session) -> List[Document]:
    return db.query(Document).all()

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

def embed_document(db: Session, document_id: int):

    document_obj = db.query(Document).filter(Document.id == document_id).first()
    if not document_obj:
        raise HTTPException(status_code=404, detail="Document not found")

    chatbot_id = document_obj.chatbot_id

    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
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

    document_list = db.query(Document).filter(Document.chatbot_id == chatbot_id).all()
    if not document_list:
        raise HTTPException(status_code=404, detail="No documents found for this chatbot")

    vectordb = rag_service.embedd_document(db, chatbot_id, embedd_obj, document_list)

    return vectordb



