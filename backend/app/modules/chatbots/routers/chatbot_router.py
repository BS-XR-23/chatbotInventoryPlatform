from fastapi import APIRouter, Depends, HTTPException,UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import uuid4
from db.database import get_db
from modules.chatbots.schemas.chatbot_schema import ChatbotCreate, ChatbotRead, ChatbotUpdate, ChatbotVendorRead
from modules.chatbots.services import chatbot_service
from modules.chatbots.models.chatmodel import ChatRequest, ChatResponse
from modules.vendors.models.vendor_model import Vendor
from modules.admins.models.admin_model import Admin
from modules.users.models.user_model import User
from core.enums import VectorStoreType, UserRole
from modules.auth.vendors.auth_vendor import get_current_vendor
from modules.auth.admins.auth_admin import get_current_admin
from modules.auth.users.auth_user import get_current_user, get_current_user_optional


router = APIRouter(tags=["Chatbots"])

@router.post("/create", response_model=ChatbotRead)
def create_chatbot_endpoint(
    name: str = Form(...),
    vendor_id: int = Form(...),
    description: Optional[str] = Form(None),
    system_prompt: Optional[str] = Form(None),
    llm_id: int = Form(...),
    llm_path: str = Form(...),
    vector_store_type: VectorStoreType = Form(VectorStoreType.chroma),  
    is_active: bool = Form(True), 
    files: List[UploadFile] = File([]),  
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    chatbot = chatbot_service.create_chatbot_with_documents(
        db=db,
        vendor_id=vendor_id,
        name=name,
        description=description or "",
        system_prompt=system_prompt or "",
        llm_id=llm_id,
        llm_path=llm_path,
        vector_store_type=vector_store_type,
        is_active=is_active,
        files=files
    )
    return chatbot

@router.get("/", response_model=List[ChatbotRead])
def get_vendor_chatbots(db: Session = Depends(get_db),  current_vendor: Vendor = Depends(get_current_vendor)):
    return chatbot_service.get_vendor_chatbots(db, current_vendor.id)

@router.get("/vendor_chatbots_for_user/{vendor_id}", response_model=List[ChatbotRead])
def get_vendor_chatbots_for_users(vendor_id: int, db: Session = Depends(get_db)):
    return chatbot_service.get_vendor_chatbots(db, vendor_id)


@router.get("/", response_model=List[ChatbotRead])
def get_chatbots(db: Session = Depends(get_db)):
    return chatbot_service.get_chatbots(db)

@router.get("/{chatbot_id}", response_model=ChatbotRead)
def get_chatbot(chatbot_id: int, db: Session = Depends(get_db)):
    chatbot = chatbot_service.get_chatbot(db, chatbot_id)
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    return chatbot

@router.get("/role-based-stats/{chatbot_id}/{user_role}")
def role_based_stats(chatbot_id: int, user_role: UserRole, db: Session = Depends(get_db)):
    chatbot = chatbot_service.get_role_based_stats(db, chatbot_id)

    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    if user_role == UserRole.admin:
        return ChatbotRead.from_orm(chatbot)
    elif user_role == UserRole.vendor:
        return ChatbotVendorRead.from_orm(chatbot)
    else:
        raise HTTPException(status_code=403, detail="User role not allowed")

@router.put("/{chatbot_id}", response_model=ChatbotRead)
async def update_chatbot_endpoint(
    chatbot_id: int,
    vendor_id: int = Form(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    system_prompt: Optional[str] = Form(None),
    llm_id: int = Form(...),
    llm_path: str = Form(...),
    vector_store_type: VectorStoreType = Form(VectorStoreType.chroma),  
    is_active: bool = Form(True), 
    files: List[UploadFile] = File([]),  
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    chatbot_data = ChatbotUpdate(
        name=name,
        vendor_id=vendor_id,
        description=description or "",
        system_prompt=system_prompt or "",
        llm_id=llm_id,
        llm_path=llm_path,
        vector_store_type=vector_store_type,
        is_active=is_active
    )

    chatbot = chatbot_service.update_chatbot_with_documents(
        db=db,
        chatbot_id=chatbot_id,
        chatbot_data=chatbot_data,
        files=files if files else None
    )

    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    return chatbot

@router.delete("/{chatbot_id}")
def delete_chatbot(chatbot_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    success = chatbot_service.delete_chatbot(db, chatbot_id)
    if not success:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    return {"detail": "Chatbot deleted successfully"}

@router.post("/{chatbot_id}/{token}/ask", response_model=ChatResponse)
def chatbot_interaction_user_singleturn(
    chatbot_id: int,
    token: str,
    request: ChatRequest,
    db: Session = Depends(get_db),
):
    ai_reply = chatbot_service.handle_conversation_singleturn(
        db=db,
        question=request.question,
        chatbot_id=chatbot_id,
        token=token
    )
    return ChatResponse(
    answer=ai_reply.content if hasattr(ai_reply, "content") else str(ai_reply),
    session_id=None
    )

@router.post("/{chatbot_id}/test_chatbot", response_model=ChatResponse)
def chatbot_interaction_user_singleturn(
    chatbot_id: int,
    request: ChatRequest,
    db: Session = Depends(get_db),
):
    ai_reply = chatbot_service.handle_conversation_singleturn_test(
        db=db,
        question=request.question,
        chatbot_id=chatbot_id,
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
    current_user: User | None = Depends(get_current_user_optional), 
):
    session_id = request.session_id or str(uuid4())

    ai_text = chatbot_service.handle_conversation_multiturn(
        db=db,
        question=request.question,
        chatbot_id=chatbot_id,
        session_id=session_id,
        user=current_user,  
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

