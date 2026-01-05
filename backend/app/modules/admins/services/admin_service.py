from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy import func
from modules.vendors.models.vendor_model import Vendor
from modules.vendors.schemas.vendor_schema import VendorStatusUpdate
from modules.auth.admins import auth_admin
from modules.admins.models.admin_model import Admin
from modules.admins.schemas.admin_schema import AdminCreate, AdminUpdate
from modules.users.models.user_model import User
from modules.messages.models.messages_model import Message
from modules.chatbots.models.chatbot_model import Chatbot
from modules.conversations.models.conversation_model import Conversation
  
def create_admin(db: Session, admin_data: AdminCreate) -> Admin:
 
    db_admin = db.query(Admin).filter(Admin.email == admin_data.email).first()
    if db_admin:
        return None  

    hashed_password = auth_admin.get_password_hash(admin_data.password)

    new_admin = Admin(
        **admin_data.dict(exclude={"password"}),
        hashed_password=hashed_password
    )

    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin

def update_admin(db: Session, admin_id: int, admin_data: AdminUpdate) -> Admin:
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        return None
    for key, value in admin_data.dict().items():
        setattr(admin, key, value)
    db.commit()
    db.refresh(admin)
    return admin

def change_admin_password(
    db: Session,
    admin_id: int,
    old_password: str,
    new_password: str
):
    admin = db.query(Admin).filter(Admin.id == admin_id).first()

    if not admin:
        return None, "Admin not found"

    if not auth_admin.verify_password(old_password, admin.hashed_password):
        return None, "Incorrect old password"

    admin.hashed_password = auth_admin.get_password_hash(new_password)
    db.commit()
    db.refresh(admin)
    
    return admin, None

def get_admin(db: Session, admin_id: int) -> Admin:
    return db.query(Admin).filter(Admin.id == admin_id).first()

def update_vendor_status(db: Session, vendor_id: int, vendor_data: VendorStatusUpdate) -> Vendor:
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        return None
    for key, value in vendor_data.dict().items():
        setattr(vendor, key, value)
    db.commit()
    db.refresh(vendor)
    return vendor

# def toggle_chatbot_status(db: Session, chatbot_id: int):
#     chatbot = db.query(Chatbot).get(chatbot_id)
#     if not chatbot:
#         return None
#     chatbot.is_active = not chatbot.is_active
#     db.commit()
#     db.refresh(chatbot)
#     return chatbot

def get_vendor_with_most_users(db: Session):
    result = db.query(User.vendor_id, func.count(User.id).label("user_count")) \
               .group_by(User.vendor_id) \
               .order_by(func.count(User.id).desc()) \
               .first()
    if not result:
        raise HTTPException(status_code=404, detail="No users found")
    vendor = db.query(Vendor).filter(Vendor.id == result.vendor_id).first()
    return {"vendor": vendor, "user_count": result.user_count}

def get_vendor_with_most_chatbots(db: Session):
    result = db.query(Chatbot.vendor_id, func.count(Chatbot.id).label("chatbot_count")) \
               .group_by(Chatbot.vendor_id) \
               .order_by(func.count(Chatbot.id).desc()) \
               .first()
    if not result:
        raise HTTPException(status_code=404, detail="No chatbots found")
    vendor = db.query(Vendor).filter(Vendor.id == result.vendor_id).first()
    return {"vendor": vendor, "chatbot_count": result.chatbot_count}

def get_most_used_chatbot(db: Session):
    result = db.query(Conversation.chatbot_id, func.count(Conversation.id).label("usage_count")) \
               .group_by(Conversation.chatbot_id) \
               .order_by(func.count(Conversation.id).desc()) \
               .first()
    if not result:
        raise HTTPException(status_code=404, detail="No chatbot usage found")
    chatbot = db.query(Chatbot).filter(Chatbot.id == result.chatbot_id).first()
    vendor = db.query(Vendor).filter(Vendor.id == chatbot.vendor_id).first()
    return {"chatbot": chatbot, "vendor": vendor, "usage_count": result.usage_count}

def get_total_tokens_by_vendor(db: Session, vendor_id: int):
    total_tokens = (
        db.query(func.sum(Message.token_count))
        .join(Conversation, Conversation.id == Message.conversation_id)  
        .join(Chatbot, Chatbot.id == Conversation.chatbot_id)        
        .filter(Chatbot.vendor_id == vendor_id)
        .scalar()
    )

    if total_tokens is None:
        raise HTTPException(status_code=404, detail="No tokens found for this vendor")
    
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {"vendor": vendor, "total_tokens": total_tokens}
