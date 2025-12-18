from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
from db.database import get_db
from modules.conversations.schemas.conversation_schema import ConversationCreate, ConversationRead
from modules.conversations.services import conversation_service
from modules.users.models.user_model import User
from modules.auth.users.auth_user import get_current_user

router = APIRouter(tags=["Conversations"])

@router.get("/", response_model=Dict[str, List[ConversationRead]])
def get_user_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return conversation_service.get_conversations_with_chatbots(db, current_user.id)


@router.get("/{chatbot_id}", response_model=Dict[str, List[ConversationRead]])
def get_user_conversations_with_chatbot(chatbot_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conversations = conversation_service.get_conversations_with_a_chatbot(db, current_user.id, chatbot_id)
    if not conversations:
        raise HTTPException(status_code=404, detail="No conversations found with this chatbot")
    return conversations


@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    success = conversation_service.delete_conversation(db, conversation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"detail": "Conversation deleted successfully"}




