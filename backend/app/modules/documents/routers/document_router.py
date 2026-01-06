from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.database import get_db
from modules.documents.schemas.document_schema import DocumentCreate, DocumentRead
from modules.documents.services import document_service
from modules.vendors.models.vendor_model import Vendor
from modules.admins.models.admin_model import Admin
from modules.auth.vendors.auth_vendor import get_current_vendor
from modules.auth.admins.auth_admin import get_current_admin

router = APIRouter(tags=["Documents"])

@router.post("/chatbots/{chatbot_id}/documents", response_model=List[DocumentRead])
def upload_documents(
    chatbot_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    saved_docs = document_service.create_documents_bulk(db, chatbot_id, files)

    for doc in saved_docs:
        try:
            vector_db = document_service.embed_document(db, doc.id)
            doc.status = "embedded"
        except Exception as e:
            doc.status = "processing_failed"

    db.commit()
    return saved_docs

@router.get("/", response_model=List[DocumentRead])
def get_documents(db: Session = Depends(get_db), current_vendor: Vendor = Depends(get_current_vendor)):
    return document_service.get_documents(db)

@router.get("/{document_id}", response_model=DocumentRead)
def get_document(document_id: int, db: Session = Depends(get_db), current_vendor: Vendor = Depends(get_current_vendor)):
    document = document_service.get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.get("/specific_documents/{chatbot_id}", response_model=List[DocumentRead])
def get_specific_documents(
    chatbot_id: int,
    db: Session = Depends(get_db),
):
    docs = document_service.get_specific_documents(db, chatbot_id)
    return docs

@router.get("/chatbots_documents/{chatbot_id}", response_model=List[DocumentRead])
def get_documents_by_chatbot(chatbot_id: int, db: Session = Depends(get_db)):
    documents = document_service.get_documents_by_chatbot(db, chatbot_id)
    if not documents:
        raise HTTPException(status_code=404, detail="No documents found for this chatbot")
    return documents

@router.put("/{document_id}", response_model=DocumentRead)
def update_document(document_id: int, document_data: DocumentCreate, db: Session = Depends(get_db), current_vendor: Vendor = Depends(get_current_vendor)):
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

@router.post("/documents/{document_id}/knowledge-base")
def embed_document_endpoint(
    document_id: int,
    db: Session = Depends(get_db),
):
    try:
        vector_db = document_service.embed_document(db, document_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to embed document: {str(e)}")

    return {
        "document_id": document_id,
        "vector_db_id": vector_db.id,
        "vector_db_type": vector_db.db_path.split("://")[0],
        "message": "Document embedding completed successfully"
    }

