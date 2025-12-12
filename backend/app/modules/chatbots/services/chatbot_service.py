from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain.messages import HumanMessage, AIMessage, SystemMessage
from sqlalchemy import func
from sqlalchemy import func
from typing import List
from uuid import uuid4
from core.enums import SenderType, ChatbotMode
from modules.api_keys.models.api_model import APIKey
from modules.chatbots.models.chatbot_model import Chatbot
from modules.conversations.models.conversation_model import Conversation
from modules.embeddings.models.embedding_model import Embedding
from modules.vendors.models.vendor_model import Vendor
from modules.chatbots.schemas.chatbot_schema import ChatbotCreate, ChatbotUpdate
from modules.rag.services import rag_service


def create_chatbot(db: Session, chatbot_data: ChatbotCreate) -> Chatbot:
    new_chatbot = Chatbot(**chatbot_data.dict())
    db.add(new_chatbot)
    db.commit()
    db.refresh(new_chatbot)
    return new_chatbot

def get_chatbots(db: Session) -> List[Chatbot]:
    return db.query(Chatbot).all()

def get_vendor_chatbots(db: Session, vendor_id: int) -> List[Chatbot]:
    return db.query(Chatbot).filter(Chatbot.vendor_id == vendor_id).all()

def get_chatbot(db: Session, chatbot_id: int) -> Chatbot:
    return db.query(Chatbot).get(chatbot_id)

def update_chatbot(db: Session, chatbot_id: int, chatbot_data: ChatbotUpdate) -> Chatbot:
    chatbot = db.query(Chatbot).get(chatbot_id)
    if not chatbot:
        return None

    update_data = chatbot_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(chatbot, key, value)

    db.add(chatbot)
    db.commit()
    db.refresh(chatbot)
    return chatbot


def delete_chatbot(db: Session, chatbot_id: int) -> bool:
    chatbot = db.query(Chatbot).get(chatbot_id)
    if not chatbot:
        return False
    db.delete(chatbot)
    db.commit()
    return True

def handle_conversation_singleturn(
    db: Session,
    question: str,
    chatbot_id: int
):

    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.is_active == True
    ).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found or inactive")

    llm_obj = chatbot.llm
    if not llm_obj:
        raise HTTPException(status_code=404, detail="LLM not found for this chatbot")

    if not chatbot.llm_path:
        raise HTTPException(status_code=400, detail="Chatbot does not have an LLM path configured")

    model = ChatOllama(
        model=chatbot.llm_path,
        temperature=0.7,
        max_tokens=chatbot.token_limit
    )

    embedd_obj = db.query(Embedding).filter(Embedding.id == llm_obj.embedding_id).first()
    if not embedd_obj:
        raise HTTPException(status_code=404, detail="Embedding not found for this LLM")

    embeddings = OllamaEmbeddings(model=embedd_obj.model_name)
    vectordb = rag_service.load_vectorstore(chatbot.vector_db, embeddings)

    context, _ = rag_service.get_rag_context(question, vectordb)

    system_msg = SystemMessage(content=chatbot.system_prompt or "You are a helpful assistant.")
    final_question = f"Context:\n{context}\n\nQuestion:\n{question}" if context else question
    human_msg = HumanMessage(content=final_question)
    messages = [system_msg, human_msg]

    response = model.invoke(messages)
    return response.content


def handle_conversation_multiturn(
    db: Session,
    question: str,
    chatbot_id: int,
    session_id: str = None,
    user_id: int = None
):
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.is_active == True
    ).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found or inactive")
    
    vendor_obj = chatbot.vendor

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Multiturn conversations require a registered user"
        )

    if chatbot.mode == ChatbotMode.private:
        api_key = db.query(APIKey).filter(
            APIKey.user_id == user_id,
            APIKey.chatbot_id == chatbot_id,
            APIKey.vendor_id == vendor_obj.id,
            APIKey.status == "active"
        ).first()
        if not api_key:
            raise HTTPException(
                status_code=403,
                detail="User does not have an active API key for this private chatbot"
            )

    session_id = session_id or str(uuid4())

    llm_obj = chatbot.llm
    if not llm_obj:
        raise HTTPException(status_code=404, detail="LLM not found for this chatbot")

    if not chatbot.llm_path:
        raise HTTPException(status_code=400, detail="Chatbot does not have an LLM path configured")

    model = ChatOllama(
        model=chatbot.llm_path,
        temperature=0.7,
        max_tokens=chatbot.token_limit
    )

    embedd_obj = db.query(Embedding).filter(Embedding.id == llm_obj.embedding_id).first()
    if not embedd_obj:
        raise HTTPException(status_code=404, detail="Embedding not found for this LLM")

    history = (
        db.query(Conversation)
        .filter(
            Conversation.session_id == session_id,
            Conversation.chatbot_id == chatbot_id
        )
        .order_by(Conversation.timestamp.asc())
        .all()
    )

    messages = [SystemMessage(content=chatbot.system_prompt or "You are a helpful assistant.")]
    for msg in history:
        if msg.sender_type == SenderType.external:
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))

    embeddings = OllamaEmbeddings(model=embedd_obj.model_name)
    vectordb = rag_service.load_vectorstore(chatbot.vector_db, embeddings)
    context, _ = rag_service.get_rag_context(question, vectordb)

    final_question = f"Context:\n{context}\n\nQuestion:\n{question}" if context else question
    messages.append(HumanMessage(content=final_question))

    response = model.invoke(messages)
    ai_text = response.content

    db.add(Conversation(
        session_id=session_id,
        sender_type=SenderType.external,
        content=question,
        user_id=user_id,
        chatbot_id=chatbot_id,
        token_count=len(question.split())
    ))
    db.add(Conversation(
        session_id=session_id,
        sender_type=SenderType.chatbot,
        content=ai_text,
        user_id=user_id,                
        chatbot_id=chatbot_id,
        token_count=len(ai_text.split())
    ))
    db.commit()

    return ai_text

#  GLOBAL TOP CHATBOTS (Public Analytics)
def get_global_top_chatbots(db: Session, limit: int = 3):

    rows = (
        db.query(
            Chatbot.id.label("chatbot_id"),
            Chatbot.name.label("chatbot_name"),
            Vendor.id.label("vendor_id"),
            Vendor.name.label("vendor_name"),
            func.count(Conversation.id).label("message_count")
        )
        .join(Vendor, Vendor.id == Chatbot.vendor_id)
        .join(Conversation, Conversation.chatbot_id == Chatbot.id)
        .group_by(Chatbot.id, Vendor.id)
        .order_by(func.count(Conversation.id).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "chatbot_id": r.chatbot_id,
            "chatbot_name": r.chatbot_name,
            "vendor_id": r.vendor_id,
            "vendor_name": r.vendor_name
        }
        for r in rows
    ]






  
