from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List
from modules.conversations.models.conversation_model import Conversation
from modules.conversations.schemas.conversation_schema import ConversationCreate


def get_conversations_with_chatbots(db: Session, user_id: int) -> List[Conversation]:
    return db.query(Conversation).filter(Conversation.user_id==user_id).all()

def get_conversations_with_a_chatbot(db: Session, user_id: int, chatbot_id: int) -> List[Conversation]:
    return db.query(Conversation).filter(Conversation.chatbot_id == chatbot_id, Conversation.user_id==user_id).all()


def delete_conversation(db: Session, conversation_id: int) -> bool:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        return False
    db.delete(conv)
    db.commit()
    return True

