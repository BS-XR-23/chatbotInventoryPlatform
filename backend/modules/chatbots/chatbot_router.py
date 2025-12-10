from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import uuid4
from db.database import get_db
from modules.chatbots.chatbot_schema import ChatbotCreate, ChatbotRead, ChatbotUpdate
from modules.chatbots import chatbot_service
from modules.chatbots.chatmodel import ChatRequest, ChatResponse

router = APIRouter(tags=["Chatbots"])

@router.post("/", response_model=ChatbotRead)
def create_chatbot(chatbot: ChatbotCreate, db: Session = Depends(get_db)):
    return chatbot_service.create_chatbot(db, chatbot)

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
def update_chatbot(chatbot_id: int, chatbot_data: ChatbotUpdate, db: Session = Depends(get_db)):
    chatbot = chatbot_service.update_chatbot(db, chatbot_id, chatbot_data)
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    return chatbot

@router.delete("/{chatbot_id}")
def delete_chatbot(chatbot_id: int, db: Session = Depends(get_db)):
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
):
    session_id = request.session_id or str(uuid4())

    user_id = request.user_id if request.user_id else None

    ai_text = chatbot_service.handle_conversation_multiturn(
        db=db,
        question=request.question,
        chatbot_id=chatbot_id,
        session_id=session_id,
        user_id=user_id,
    )

    # RETURN THE SAME session_id BACK
    return ChatResponse(
        answer=ai_text,
        session_id=session_id
    )


