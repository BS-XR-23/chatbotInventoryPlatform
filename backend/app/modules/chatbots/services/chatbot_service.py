from fastapi import UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain.messages import HumanMessage, AIMessage, SystemMessage
from typing import List, Optional
from uuid import uuid4
from core.enums import SenderType, ChatbotMode, VectorStoreType, DocumentStatus, UserRole
from modules.api_keys.models.api_model import APIKey
from modules.chatbots.models.chatbot_model import Chatbot
from modules.conversations.models.conversation_model import Conversation
from modules.embeddings.models.embedding_model import Embedding
from modules.vendors.models.vendor_model import Vendor
from modules.vector_dbs.models.vector_db_model import VectorDB
from modules.chatbots.schemas.chatbot_schema import ChatbotCreate, ChatbotUpdate, ChatbotRead
from modules.rag.services import rag_service
from modules.chatbots.services import chatbot_service
from modules.documents.services.document_service import create_documents_bulk, embed_document


def create_chatbot_with_documents(
    db,
    vendor_id: int,
    name: str,
    description: str,
    system_prompt: str,
    llm_id: int,
    llm_path: str,
    mode,
    vector_store_type: VectorStoreType,
    vector_store_config: dict | None = None,
    files: list[UploadFile] | None = None
):
    # 1️⃣ Create Chatbot
    chatbot = Chatbot(
        vendor_id=vendor_id,
        name=name,
        description=description,
        system_prompt=system_prompt,
        llm_id=llm_id,
        llm_path=llm_path,
        mode=mode,
        vector_store_type=vector_store_type,
        vector_store_config=vector_store_config,
        is_active=True
    )
    db.add(chatbot)
    db.commit()
    db.refresh(chatbot)

    saved_docs = []
    if files:
        saved_docs = create_documents_bulk(db, vendor_id, chatbot.id, files)

    if saved_docs:
        try:
            # embed only the first document, or loop if you want multiple
            embed_document(db, saved_docs[0].id)
        except Exception as e:
            for doc in saved_docs:
                doc.status = DocumentStatus.processing_failed  # use the correct enum member
            db.commit()
            raise e

    return chatbot


def get_chatbots(db: Session) -> List[Chatbot]:
    return db.query(Chatbot).all()

def get_role_based_stats(db: Session, chatbot_id: int):
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.is_active == True
    ).first()

    if not chatbot:
        return None
    else :
        return chatbot
    

def count_of_chatbots(db : Session) -> int:
    return db.query(func.count(Chatbot.id)).scalar()

def top_performing_chatbot_name(db: Session) -> str | None:
    result = (
        db.query(
            Chatbot.name
        )
        .join(Conversation, Conversation.chatbot_id == Chatbot.id)
        .group_by(Chatbot.id)
        .order_by(
            (
                func.count(Conversation.id) /
                func.count(func.distinct(Conversation.session_id))
            ).desc()
        )
        .first()
    )

    return result[0] if result else None

def get_vendor_chatbots(db: Session, vendor_id: int) -> List[Chatbot]:
    return db.query(Chatbot).filter(Chatbot.vendor_id == vendor_id).all()

def get_chatbot(db: Session, chatbot_id: int) -> Chatbot:
    return db.query(Chatbot).get(chatbot_id)

def update_chatbot_with_documents(
    db: Session,
    chatbot_id: int,
    chatbot_data: ChatbotUpdate,
    files: list[UploadFile] | None = None
) -> Chatbot:
    chatbot = db.query(Chatbot).get(chatbot_id)
    if not chatbot:
        return None

    # Update chatbot fields
    chatbot.name = chatbot_data.name or chatbot.name
    chatbot.vendor_id = chatbot_data.vendor_id or chatbot.vendor_id
    chatbot.description = chatbot_data.description or chatbot.description
    chatbot.system_prompt = chatbot_data.system_prompt or chatbot.system_prompt
    chatbot.llm_id = chatbot_data.llm_id or chatbot.llm_id
    chatbot.llm_path = chatbot_data.llm_path or chatbot.llm_path
    chatbot.mode = chatbot_data.mode or chatbot.mode
    chatbot.vector_store_type = chatbot_data.vector_store_type or chatbot.vector_store_type
    chatbot.vector_store_config = chatbot_data.vector_store_config or chatbot.vector_store_config
    chatbot.is_active = chatbot_data.is_active if chatbot_data.is_active is not None else chatbot.is_active

    db.add(chatbot)
    db.commit()
    db.refresh(chatbot)

    # Handle new documents only if provided
    if files:
        saved_docs = create_documents_bulk(db, chatbot.vendor_id, chatbot.id, files)
        if saved_docs:
            try:
                # embed first document (or loop if you want multiple)
                embed_document(db, saved_docs[0].id)
            except Exception as e:
                for doc in saved_docs:
                    doc.status = DocumentStatus.processing_failed
                db.commit()
                raise e

    return chatbot


def delete_chatbot(db: Session, chatbot_id: int) -> bool:
    chatbot = db.query(Chatbot).get(chatbot_id)
    if not chatbot:
        return False
    db.delete(chatbot)
    db.commit()
    return True

def get_latest_vector_db(chatbot: Chatbot) -> Optional[VectorDB]:
    active_vdbs = [vdb for vdb in chatbot.vector_dbs if vdb.is_active]
    if not active_vdbs:
        return None

    return max(
        active_vdbs,
        key=lambda v: (v.updated_at or v.created_at)
    )

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
    )

    vector_db_obj = chatbot_service.get_latest_vector_db(chatbot)
    # if not vector_db_obj:
    #     raise HTTPException(status_code=404, detail="No active VectorDB found for this chatbot")

    embedd_obj = db.query(Embedding).filter(
        Embedding.id == llm_obj.embedding_id
    ).first()

    if not embedd_obj:
        raise HTTPException(status_code=404, detail="Embedding not found for this LLM")

    embeddings = OllamaEmbeddings(model=embedd_obj.model_name)

    if vector_db_obj:
        vectordb = rag_service.load_vectorstore(
            vector_db_obj.db_path,
            embeddings
        )
        context, _ = rag_service.get_rag_context(question, vectordb)
    else:
        context = None
    system_msg = SystemMessage(
        content=chatbot.system_prompt or "You are a helpful assistant."
    )

    final_question = (
        f"Context:\n{context}\n\nQuestion:\n{question}"
        if context else question
    )

    human_msg = HumanMessage(content=final_question)
    response = model.invoke([system_msg, human_msg])
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
    )

    embedd_obj = db.query(Embedding).filter(
        Embedding.id == llm_obj.embedding_id
    ).first()
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

    messages = [
        SystemMessage(content=chatbot.system_prompt or "You are a helpful assistant.")
    ]

    for msg in history:
        if msg.sender_type == SenderType.external:
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))

    vector_db_obj = chatbot_service.get_latest_vector_db(chatbot)
    if not vector_db_obj:
        raise HTTPException(
            status_code=404,
            detail="No active VectorDB found for this chatbot"
        )

    embeddings = OllamaEmbeddings(model=embedd_obj.model_name)

    vectordb = rag_service.load_vectorstore(
        vector_db_obj.db_path,
        embeddings
    )

    context, _ = rag_service.get_rag_context(question, vectordb)

    final_question = (
        f"Context:\n{context}\n\nQuestion:\n{question}"
        if context else question
    )

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






  
