from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.db.database import get_db
from backend.models.chatbots import Chatbot, ChatbotDocument
from backend.schemas.chatbots import ChatbotCreate, ChatbotRead, ChatbotDocumentCreate, ChatbotDocumentRead

router = APIRouter(prefix="/chatbots", tags=["Chatbots"])

# --- Chatbots CRUD ---
@router.post("/", response_model=ChatbotRead)
def create_chatbot(chatbot: ChatbotCreate, db: Session = Depends(get_db)):
    new_chatbot = Chatbot(**chatbot.dict())
    db.add(new_chatbot)
    db.commit()
    db.refresh(new_chatbot)
    return new_chatbot

@router.get("/", response_model=List[ChatbotRead])
def get_chatbots(db: Session = Depends(get_db)):
    chatbots = db.query(Chatbot).all()  # ORM query
    return chatbots

@router.get("/{chatbot_id}", response_model=ChatbotRead)
def get_chatbot(chatbot_id: int, db: Session = Depends(get_db)):
    chatbot = db.query(Chatbot).get(chatbot_id)
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    return chatbot

@router.put("/{chatbot_id}", response_model=ChatbotRead)
def update_chatbot(chatbot_id: int, chatbot_data: ChatbotCreate, db: Session = Depends(get_db)):
    chatbot = db.query(Chatbot).get(chatbot_id)
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    for key, value in chatbot_data.dict().items():
        setattr(chatbot, key, value)
    db.add(chatbot)
    db.commit()
    db.refresh(chatbot)
    return chatbot

@router.delete("/{chatbot_id}")
def delete_chatbot(chatbot_id: int, db: Session = Depends(get_db)):
    chatbot = db.query(Chatbot).get(chatbot_id)
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    db.delete(chatbot)
    db.commit()
    return {"detail": "Chatbot deleted successfully"}

# --- Chatbot Documents CRUD ---
doc_router = APIRouter(prefix="/chatbot-documents", tags=["Chatbot Documents"])

@doc_router.post("/", response_model=ChatbotDocumentRead)
def add_chatbot_document(doc: ChatbotDocumentCreate, db: Session = Depends(get_db)):
    new_doc = ChatbotDocument(**doc.dict())
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc

@doc_router.get("/", response_model=List[ChatbotDocumentRead])
def get_chatbot_documents(db: Session = Depends(get_db)):
    documents = db.query(ChatbotDocument).all()  # ORM query
    return documents

@doc_router.get("/{doc_id}", response_model=ChatbotDocumentRead)
def get_chatbot_document(doc_id: int, db: Session = Depends(get_db)):
    document = db.query(ChatbotDocument).get(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Chatbot document not found")
    return document

@doc_router.put("/{doc_id}", response_model=ChatbotDocumentRead)
def update_chatbot_document(doc_id: int, doc_data: ChatbotDocumentCreate, db: Session = Depends(get_db)):
    document = db.query(ChatbotDocument).get(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Chatbot document not found")
    for key, value in doc_data.dict().items():
        setattr(document, key, value)
    db.add(document)
    db.commit()
    db.refresh(document)
    return document

@doc_router.delete("/{doc_id}")
def delete_chatbot_document(doc_id: int, db: Session = Depends(get_db)):
    document = db.query(ChatbotDocument).get(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Chatbot document not found")
    db.delete(document)
    db.commit()
    return {"detail": "Chatbot document deleted successfully"}
