from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.db.database import get_db
from backend.models.documents import Document, DocumentChunk
from backend.schemas.documents import DocumentCreate, DocumentRead, DocumentChunkCreate, DocumentChunkRead

# --- Documents Router ---
router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/", response_model=DocumentRead)
def create_document(document: DocumentCreate, db: Session = Depends(get_db)):
    new_doc = Document(**document.dict())
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc

@router.get("/", response_model=List[DocumentRead])
def get_documents(db: Session = Depends(get_db)):
    return db.query(Document).all()  # ORM query

@router.get("/{document_id}", response_model=DocumentRead)
def get_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.put("/{document_id}", response_model=DocumentRead)
def update_document(document_id: int, document_data: DocumentCreate, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    for key, value in document_data.dict().items():
        setattr(document, key, value)
    db.commit()
    db.refresh(document)
    return document

@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(document)
    db.commit()
    return {"detail": "Document deleted successfully"}


# --- Document Chunks Router ---
chunk_router = APIRouter(prefix="/document-chunks", tags=["Document Chunks"])

@chunk_router.post("/", response_model=DocumentChunkRead)
def create_chunk(chunk: DocumentChunkCreate, db: Session = Depends(get_db)):
    new_chunk = DocumentChunk(**chunk.dict())
    db.add(new_chunk)
    db.commit()
    db.refresh(new_chunk)
    return new_chunk

@chunk_router.get("/", response_model=List[DocumentChunkRead])
def get_chunks(db: Session = Depends(get_db)):
    return db.query(DocumentChunk).all()  # ORM query

@chunk_router.get("/{chunk_id}", response_model=DocumentChunkRead)
def get_chunk(chunk_id: int, db: Session = Depends(get_db)):
    chunk = db.query(DocumentChunk).filter(DocumentChunk.id == chunk_id).first()
    if not chunk:
        raise HTTPException(status_code=404, detail="Document chunk not found")
    return chunk

@chunk_router.put("/{chunk_id}", response_model=DocumentChunkRead)
def update_chunk(chunk_id: int, chunk_data: DocumentChunkCreate, db: Session = Depends(get_db)):
    chunk = db.query(DocumentChunk).filter(DocumentChunk.id == chunk_id).first()
    if not chunk:
        raise HTTPException(status_code=404, detail="Document chunk not found")
    for key, value in chunk_data.dict().items():
        setattr(chunk, key, value)
    db.commit()
    db.refresh(chunk)
    return chunk

@chunk_router.delete("/{chunk_id}")
def delete_chunk(chunk_id: int, db: Session = Depends(get_db)):
    chunk = db.query(DocumentChunk).filter(DocumentChunk.id == chunk_id).first()
    if not chunk:
        raise HTTPException(status_code=404, detail="Document chunk not found")
    db.delete(chunk)
    db.commit()
    return {"detail": "Document chunk deleted successfully"}
