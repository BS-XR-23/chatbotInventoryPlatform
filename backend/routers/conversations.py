from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.db.database import get_db
from backend.models.conversations import Conversation, Message
from backend.schemas.conversations import ConversationCreate, ConversationRead, MessageCreate, MessageRead

# --- Conversations Router ---
router = APIRouter(prefix="/conversations", tags=["Conversations"])

@router.post("/", response_model=ConversationRead)
def create_conversation(conv: ConversationCreate, db: Session = Depends(get_db)):
    new_conv = Conversation(**conv.dict())
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)
    return new_conv

@router.get("/", response_model=List[ConversationRead])
def get_conversations(db: Session = Depends(get_db)):
    return db.query(Conversation).all()

@router.get("/{conversation_id}", response_model=ConversationRead)
def get_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.put("/{conversation_id}", response_model=ConversationRead)
def update_conversation(conversation_id: int, conv_data: ConversationCreate, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    for key, value in conv_data.dict().items():
        setattr(conv, key, value)
    db.commit()
    db.refresh(conv)
    return conv

@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return {"detail": "Conversation deleted successfully"}


# --- Messages Router ---
message_router = APIRouter(prefix="/messages", tags=["Messages"])

@message_router.post("/", response_model=MessageRead)
def create_message(msg: MessageCreate, db: Session = Depends(get_db)):
    new_msg = Message(**msg.dict())
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg

@message_router.get("/", response_model=List[MessageRead])
def get_messages(db: Session = Depends(get_db)):
    return db.query(Message).all()

@message_router.get("/conversation/{conversation_id}", response_model=List[MessageRead])
def get_messages_by_conversation(conversation_id: int, db: Session = Depends(get_db)):
    return db.query(Message).filter(Message.conversation_id == conversation_id).all()

@message_router.get("/{message_id}", response_model=MessageRead)
def get_message(message_id: int, db: Session = Depends(get_db)):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    return message

@message_router.put("/{message_id}", response_model=MessageRead)
def update_message(message_id: int, msg_data: MessageCreate, db: Session = Depends(get_db)):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    for key, value in msg_data.dict().items():
        setattr(message, key, value)
    db.commit()
    db.refresh(message)
    return message

@message_router.delete("/{message_id}")
def delete_message(message_id: int, db: Session = Depends(get_db)):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(message)
    db.commit()
    return {"detail": "Message deleted successfully"}
