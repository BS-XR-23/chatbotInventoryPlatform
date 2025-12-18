from sqlalchemy.orm import Session
from collections import defaultdict
from typing import List, Dict
from modules.conversations.models.conversation_model import Conversation
from modules.conversations.schemas.conversation_schema import ConversationRead



def get_conversations_with_chatbots(db: Session, user_id: int) -> Dict[str, List[ConversationRead]]:

    messages = (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .order_by(Conversation.timestamp)
        .all()
    )
    
    sessions = defaultdict(list)
    for msg in messages:
        sessions[msg.session_id].append(ConversationRead.from_orm(msg))
    
    return dict(sessions)

def get_conversations_with_a_chatbot(db: Session, user_id: int, chatbot_id: int) -> Dict[str, List[ConversationRead]]:
    messages = (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id, Conversation.chatbot_id == chatbot_id)
        .order_by(Conversation.timestamp)
        .all()
    )

    sessions = defaultdict(list)
    for msg in messages:
        sessions[msg.session_id].append(ConversationRead.from_orm(msg))

    return dict(sessions)


def delete_conversation(db: Session, conversation_id: int) -> bool:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        return False
    db.delete(conv)
    db.commit()
    return True

