from FastAPI import HTTPException
from sqlalchemy.orm import Session
from langchain.chat_models import init_chat_model
from langchain_ollama import ChatOllama
from langchain.messages import HumanMessage, AIMessage, SystemMessage
import os
from typing import List
from backend.modules.api_keys.api_model import APIKey
from backend.modules.llms.llm_model import LLM
from backend.modules.documents.document_model import Document
from backend.modules.chatbots.chatbot_model import Chatbot
from backend.modules.conversations.conversation_model import Conversation
from backend.modules.embeddings.embedding_model import Embedding
from backend.core.enums import SenderType
from backend.modules.chatbots.chatbot_schema import ChatbotCreate
from backend.modules.rag import rag_service
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

def update_chatbot(db: Session, chatbot_id: int, chatbot_data: ChatbotCreate) -> Chatbot:
    chatbot = db.query(Chatbot).get(chatbot_id)
    if not chatbot:
        return None
    for key, value in chatbot_data.dict().items():
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
        Chatbot.id == chatbot_id, Chatbot.is_active == True
    ).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found or inactive")

    llm_obj = db.query(LLM).filter(LLM.id == chatbot.llm_id).first()
    if not llm_obj:
        raise HTTPException(status_code=404, detail="LLM not found for this chatbot")

    model_name = llm_obj.name
    model = ChatOllama(model_name)  

    system_msg = SystemMessage(content=chatbot.system_prompt or "You are a helpful assistant.")
    human_msg = HumanMessage(content=question)
    messages = [system_msg, human_msg]

    response = model.invoke(messages)
    return response


def handle_conversation_multiturn(
    db: Session, 
    question: str, 
    chatbot_id: int, 
    session_id: str, 
    user_id: int = None
):
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id, 
        Chatbot.is_active == True
    ).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found or inactive")

    llm_obj = db.query(LLM).filter(LLM.id == chatbot.llm_id).first()
    if not llm_obj:
        raise HTTPException(status_code=404, detail="LLM not found for this chatbot")

    embedd_obj = db.query(Embedding).filter(Embedding.id == llm_obj.embedding_id).first()
    if not embedd_obj:
        raise HTTPException(status_code=404, detail="Embedding not found for this LLM")

    model_name = llm_obj.name
    model = ChatOllama(
        model_name,
        temperature=0.7,   
        max_tokens=chatbot.token_limit,
    )

    history = (
        db.query(Conversation)
        .filter(Conversation.session_id == session_id,
                Conversation.chatbot_id == chatbot_id)
        .order_by(Conversation.timestamp.asc())
        .all()
    )
    
    messages = []
    messages.append(SystemMessage(content=chatbot.system_prompt or "You are a helpful assistant."))

    for msg in history:
        if msg.sender_type == SenderType.external:
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))


    embeddings = OllamaEmbeddings(model=embedd_obj.model_name)        

    vectordb = rag_service.load_vectorstore(chatbot.vector_db, embeddings)
    
    context, metadata_list = rag_service.get_rag_context(question, vectordb)

    if context:
        final_question = f"Context:\n{context}\n\nQuestion:\n{question}"
    else:
        final_question = question

    user_msg = HumanMessage(content=final_question)
    messages.append(user_msg)

    response = model.invoke(messages)
    ai_text = response.content

    user_conv = Conversation(
        session_id=session_id,
        sender_type=SenderType.external,
        content=question,
        user_id=user_id,
        chatbot_id=chatbot_id,
        token_count=len(question.split())
    )
    db.add(user_conv)

    ai_conv = Conversation(
        session_id=session_id,
        sender_type=SenderType.chatbot,
        content=ai_text,
        chatbot_id=chatbot_id,
        token_count=len(ai_text.split())
    )
    db.add(ai_conv)

    db.commit()

    return ai_text



def create_knowledgebase(db: Session, chatbot_id: int):
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id, 
        Chatbot.is_active == True
    ).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found or inactive")
    
    llm_obj = db.query(LLM).filter(LLM.id == chatbot.llm_id).first()
    if not llm_obj:
        raise HTTPException(status_code=404, detail="LLM not found for this chatbot")

    embedd_obj = db.query(Embedding).filter(Embedding.id == llm_obj.embedding_id).first()
    if not embedd_obj:
        raise HTTPException(status_code=404, detail="Embedding not found for this LLM")
    
    document_obj = db.query(Document).filter(Document.chatbot_id == chatbot_id).all()
    if not document_obj:
        raise HTTPException(status_code=404, detail="No documents found for this chatbot")
    
    embedded_knowledgebase = rag_service.embedd_document(db, chatbot_id, embedd_obj, document_obj)
    
    return embedded_knowledgebase


  
