from fastapi import HTTPException
from sqlalchemy.orm import Session
from langchain.chat_models import init_chat_model
from langchain_ollama import ChatOllama
from langchain.messages import HumanMessage, AIMessage, SystemMessage
import os
from typing import List
from uuid import uuid4
from modules.api_keys.api_model import APIKey
from modules.llms.llm_model import LLM
from modules.documents.document_model import Document
from modules.chatbots.chatbot_model import Chatbot
from modules.conversations.conversation_model import Conversation
from modules.embeddings.embedding_model import Embedding
from core.enums import SenderType
from modules.chatbots.chatbot_schema import ChatbotCreate, ChatbotUpdate
from modules.rag import rag_service
from langchain_ollama import OllamaEmbeddings

def create_chatbot(db: Session, chatbot_data: ChatbotCreate) -> Chatbot:
    new_chatbot = Chatbot(**chatbot_data.dict())
    db.add(new_chatbot)
    db.commit()
    db.refresh(new_chatbot)
    return new_chatbot

def get_chatbots(db: Session) -> List[Chatbot]:
    return db.query(Chatbot).all()

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

def handle_conversation_singleturn(db: Session, question: str, chatbot_id: int):
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

    system_msg = SystemMessage(content=chatbot.system_prompt or "You are a helpful assistant.")
    human_msg = HumanMessage(content=question)
    messages = [system_msg, human_msg]

    response = model.invoke(messages)
    return response

def handle_conversation_multiturn(
    db: Session,
    question: str,
    chatbot_id: int,
    session_id: str = None,
    user_id: int = None
):
    # 1️⃣ Fetch chatbot
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.is_active == True
    ).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found or inactive")

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
        chatbot_id=chatbot_id,
        token_count=len(ai_text.split())
    ))
    db.commit()

    return ai_text






  
