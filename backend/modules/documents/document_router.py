from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.database import get_db
from modules.documents.document_schema import DocumentCreate, DocumentRead
from modules.chatbots.chatbot_schema import ChatbotRead
from modules.documents import document_service
from modules.rag import rag_service

router = APIRouter(tags=["Documents"])

@router.post("/preview", response_model=DocumentCreate)
def preview_document(
    file: UploadFile = File(...),
    vendor_id: int = Form(...),
    chatbot_id: int = Form(...)
):
   
    return document_service.preview_document(file, vendor_id, chatbot_id)


@router.post("/add", response_model=DocumentRead)
def add_document(
    title: str = Form(...),
    summary: str = Form(...),
    tags: str = Form(...),
    file_path: str = Form(...),
    vendor_id: int = Form(...),
    chatbot_id: int = Form(...),
    db: Session = Depends(get_db)
):
    return document_service.save_document(db, vendor_id, chatbot_id, title, summary, tags, file_path)


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

@router.post("/{document_id}/knowledge-base")
def create_knowledgebase(document_id: int, db: Session = Depends(get_db)):
    try:
        vectordb = document_service.embed_document(db, document_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to embed document: {str(e)}")

    return {
        "document_id": document_id,
        "vector_db_type": vectordb.__class__.__name__,
        "message": "Document embedding completed successfully"
    }

