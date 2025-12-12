from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import uuid4
from db.database import get_db
from modules.chatbots.schemas.chatbot_schema import ChatbotCreate, ChatbotRead, ChatbotUpdate
from modules.chatbots.services import chatbot_service
from modules.chatbots.models.chatmodel import ChatRequest, ChatResponse
from modules.vendors.models.vendor_model import Vendor
from modules.users.models.user_model import User
from modules.auth.vendors.auth_vendor import get_current_vendor
from modules.auth.users.auth_user import get_current_user


router = APIRouter(tags=["Chatbots"])

@router.post("/", response_model=ChatbotRead)
def create_chatbot(chatbot: ChatbotCreate, db: Session = Depends(get_db), current_vendor: Vendor = Depends(get_current_vendor)):
    return chatbot_service.create_chatbot(db, chatbot)

@router.get("/", response_model=List[ChatbotRead])
def get_vendor_chatbots(db: Session = Depends(get_db),  current_vendor: Vendor = Depends(get_current_vendor)):
    return chatbot_service.get_vendor_chatbots(db, current_vendor.id)


@router.get("/", response_model=List[ChatbotRead])
def get_chatbots(db: Session = Depends(get_db)):
    return chatbot_service.get_chatbots(db)

@router.get("/{chatbot_id}", response_model=ChatbotRead)
def get_chatbot(chatbot_id: int, db: Session = Depends(get_db)):
    chatbot = chatbot_service.get_chatbot(db, chatbot_id)
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    return chatbot

@router.put("/{chatbot_id}", response_model=ChatbotRead)
def update_chatbot(chatbot_id: int, chatbot_data: ChatbotUpdate, db: Session = Depends(get_db), current_vendor: Vendor = Depends(get_current_vendor)):
    chatbot = chatbot_service.update_chatbot(db, chatbot_id, chatbot_data)
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    return chatbot

@router.delete("/{chatbot_id}")
def delete_chatbot(chatbot_id: int, db: Session = Depends(get_db), current_vendor: Vendor = Depends(get_current_vendor)):
    success = chatbot_service.delete_chatbot(db, chatbot_id)
    if not success:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    return {"detail": "Chatbot deleted successfully"}

@router.post("/{chatbot_id}/ask", response_model=ChatResponse)
def chatbot_interaction_user_singleturn(
    chatbot_id: int,
    request: ChatRequest,
    db: Session = Depends(get_db),
):
    ai_reply = chatbot_service.handle_conversation_singleturn(
        db=db,
        question=request.question,
        chatbot_id=chatbot_id
    )
    return ChatResponse(
    answer=ai_reply.content if hasattr(ai_reply, "content") else str(ai_reply),
    session_id=None
    )

@router.post("/{chatbot_id}/chat", response_model=ChatResponse)
def chatbot_interaction_multiturn(
    chatbot_id: int,
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session_id = request.session_id or str(uuid4())

    ai_text = chatbot_service.handle_conversation_multiturn(
        db=db,
        question=request.question,
        chatbot_id=chatbot_id,
        session_id=session_id,
        user_id=current_user.id,
    )

    return ChatResponse(
        answer=ai_text,
        session_id=session_id
    )

#  GLOBAL PUBLIC ANALYTICS
@router.get("/global/top-chatbots")
def global_top_chatbots(
    db: Session = Depends(get_db)
):
    return chatbot_service.get_global_top_chatbots(db)

