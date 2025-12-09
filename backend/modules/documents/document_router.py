from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.db.database import get_db
from backend.modules.documents.document_schema import DocumentCreate, DocumentRead
from backend.modules.chatbots.chatbot_schema import ChatbotRead
from backend.modules.documents import document_service
from backend.modules.rag import rag_service

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/", response_model=DocumentRead)
def create_document(document: DocumentCreate, db: Session = Depends(get_db)):
    return document_service.create_document(db, document)

@router.get("/", response_model=List[DocumentRead])
def get_documents(db: Session = Depends(get_db)):
    return document_service.get_documents(db)

@router.get("/{document_id}", response_model=DocumentRead)
def get_document(document_id: int, db: Session = Depends(get_db)):
    document = document_service.get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.put("/{document_id}", response_model=DocumentRead)
def update_document(document_id: int, document_data: DocumentCreate, db: Session = Depends(get_db)):
    document = document_service.update_document(db, document_id, document_data)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    success = document_service.delete_document(db, document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"detail": "Document deleted successfully"}

