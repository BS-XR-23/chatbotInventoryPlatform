from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import uuid4
from backend.db.database import get_db
from backend.modules.chatbots.chatbot_schema import ChatbotCreate, ChatbotRead
from backend.modules.chatbots import chatbot_service
from backend.modules.chatbots.chatmodel import ChatRequest, ChatResponse

router = APIRouter(prefix="/chatbots", tags=["Chatbots"])

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
def update_chatbot(chatbot_id: int, chatbot_data: ChatbotCreate, db: Session = Depends(get_db)):
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
        answer=ai_reply,
        session_id=None 
    )

@router.post("/{chatbot_id}/chat", response_model=ChatResponse)
def chatbot_interaction_multiturn(
    chatbot_id: int,
    request: ChatRequest,
    db: Session = Depends(get_db),
):

    session_id = request.session_id or str(uuid4())

    user_id = request.user_id if hasattr(request, "user_id") else None

    ai_reply = chatbot_service.handle_conversation_multiturn(
        db=db,
        question=request.question,
        chatbot_id=chatbot_id,
        session_id=session_id,
        user_id=user_id,
    )

    return ChatResponse(
        answer=ai_reply,
        session_id=session_id
    )


@router.post("/{chatbot_id}/knowledge-base")
def create_knowledgebase(chatbot_id: int, db: Session = Depends(get_db)):

    try:
        vectordb = chatbot_service.create_knowledgebase(db, chatbot_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create knowledge base: {str(e)}")

    return {
        "chatbot_id": chatbot_id,
        "vector_db_type": vectordb.__class__.__name__, 
        "message": "Knowledge base created successfully"
    }