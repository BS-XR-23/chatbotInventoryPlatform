from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from modules.vendors.models.vendor_model import Vendor
from modules.vendors.schemas.vendor_schema import VendorCreate, VendorUpdate, VendorWithStats
from modules.auth.vendors import auth_vendor
from datetime import datetime, timedelta
from modules.chatbots.models.chatbot_model import Chatbot
from modules.conversations.models.conversation_model import Conversation
from modules.users.models.user_model import User

def create_vendor(db: Session, vendor_data: VendorCreate) -> Vendor:
    db_vendor = db.query(Vendor).filter(Vendor.email == vendor_data.email).first()
    if db_vendor:
        return None

    hashed_password = auth_vendor.get_password_hash(vendor_data.password)

    new_vendor = Vendor(
        **vendor_data.dict(exclude={"password"}),
        hashed_password=hashed_password 
    )

    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return new_vendor

def change_vendor_password(
    db: Session,
    vendor_id: int,
    current_password: str,
    new_password: str
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()

    if not vendor:
        return None, "Vendor not found"

    if not auth_vendor.verify_password(current_password, vendor.hashed_password):
        return None, "Incorrect old password"

    vendor.hashed_password = auth_vendor.get_password_hash(new_password)
    db.commit()
    db.refresh(vendor)
    
    return vendor, None


def list_vendors(db: Session) -> List[Vendor]:
    return db.query(Vendor).all()

def list_vendors_with_stats(db: Session) -> List[VendorWithStats]:
    vendors = db.query(Vendor).all()
    result = []

    for v in vendors:
        user_count = db.query(User).filter(User.vendor_id == v.id).count()
        chatbot_count = db.query(Chatbot).filter(Chatbot.vendor_id == v.id).count()

        result.append(VendorWithStats(
            id=v.id,
            name=v.name,
            user_count=user_count,
            chatbot_count=chatbot_count
        ))

    return result

def count_of_vendors(db: Session) -> int:
    return db.query(func.count(Vendor.id)).scalar()

def get_vendor(db: Session, vendor_id: int) -> Vendor:
    return db.query(Vendor).filter(Vendor.id == vendor_id).first()


def update_vendor(db: Session, vendor_id: int, vendor_data: VendorUpdate) -> Vendor:
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        return None
    for key, value in vendor_data.dict().items():
        setattr(vendor, key, value)
    db.commit()
    db.refresh(vendor)
    return vendor

def delete_vendor(db: Session, vendor_id: int) -> bool:
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        return False
    db.delete(vendor)
    db.commit()
    return True



#  VENDOR: TOP CHATBOTS BY MESSAGE COUNT
def get_vendor_top_chatbots_by_messages(db: Session, vendor_id: int, limit: int = 3):
    rows = (
        db.query(
            Chatbot.id.label("chatbot_id"),
            Chatbot.name.label("chatbot_name"),
            func.count(Conversation.id).label("message_count")
        )
        .join(Conversation, Conversation.chatbot_id == Chatbot.id)
        .filter(Chatbot.vendor_id == vendor_id)
        .group_by(Chatbot.id)
        .order_by(func.count(Conversation.id).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "chatbot_name": r.chatbot_name,
            "message_count": r.message_count
        }
        for r in rows
    ]

#  VENDOR: TOP CHATBOTS BY UNIQUE USERS

def get_vendor_top_chatbots_by_users(db: Session, vendor_id: int, limit: int = 3):
    rows = (
        db.query(
            Chatbot.id.label("chatbot_id"),
            Chatbot.name.label("chatbot_name"),
            func.count(func.distinct(Conversation.user_id)).label("unique_users")
        )
        .join(Conversation, Conversation.chatbot_id == Chatbot.id)
        .filter(Chatbot.vendor_id == vendor_id)
        .group_by(Chatbot.id)
        .order_by(func.count(func.distinct(Conversation.user_id)).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "chatbot_name": r.chatbot_name,
            "unique_users": r.unique_users
        }
        for r in rows
    ]

#  VENDOR: DAILY MESSAGE COUNT (7-day dashboard chart)
def get_vendor_daily_message_count(db: Session, vendor_id: int):
    rows = (
        db.query(
            Chatbot.id.label("chatbot_id"),
            Chatbot.name.label("chatbot_name"),
            func.date(Conversation.timestamp).label("day"),
            func.count(Conversation.id).label("messages")
        )
        .join(Conversation, Conversation.chatbot_id == Chatbot.id)
        .filter(Chatbot.vendor_id == vendor_id)
        .group_by(Chatbot.id, func.date(Conversation.timestamp))
        .order_by("day")
        .all()
    )

    return [
        {
            "chatbot_name": r.chatbot_name,
            "day": str(r.day),
            "messages": r.messages
        }
        for r in rows
    ]

#  VENDOR: DAILY UNIQUE USERS (7-day dashboard chart)
def get_vendor_daily_unique_users(db: Session, vendor_id: int):
    rows = (
        db.query(
            Chatbot.id.label("chatbot_id"),
            Chatbot.name.label("chatbot_name"),
            func.date(Conversation.timestamp).label("day"),
            func.count(func.distinct(Conversation.user_id)).label("unique_users")
        )
        .join(Conversation, Conversation.chatbot_id == Chatbot.id)
        .filter(Chatbot.vendor_id == vendor_id)
        .group_by(Chatbot.id, func.date(Conversation.timestamp))
        .order_by("day")
        .all()
    )

    return [
        {
            "chatbot_name": r.chatbot_name,
            "day": str(r.day),
            "unique_users": r.unique_users
        }
        for r in rows
    ]


#  USER: TOKENS LAST 7 DAYS (Vendor-Scoped)
def get_user_tokens_last_7_days_for_vendor(db: Session, vendor_id: int, user_id: int):
    last_7_days = datetime.utcnow() - timedelta(days=7)

    total = (
        db.query(func.coalesce(func.sum(Conversation.token_count), 0))
        .join(Chatbot, Conversation.chatbot_id == Chatbot.id)
        .filter(
            Chatbot.vendor_id == vendor_id,
            Conversation.user_id == user_id,
            Conversation.timestamp >= last_7_days
        )
        .scalar()
    )

    return int(total or 0)


#  USER: LIFETIME TOKENS (Vendor-Scoped)
def get_user_total_tokens_for_vendor(db: Session, vendor_id: int, user_id: int):
    total = (
        db.query(func.coalesce(func.sum(Conversation.token_count), 0))
        .join(Chatbot, Conversation.chatbot_id == Chatbot.id)
        .filter(
            Chatbot.vendor_id == vendor_id,
            Conversation.user_id == user_id
        )
        .scalar()
    )

    return int(total or 0)

#  USER + CHATBOT: MESSAGE COUNT (Vendor-Scoped)
def get_user_message_count_for_chatbot_and_vendor(db: Session, vendor_id: int, user_id: int, chatbot_id: int):
    return (
        db.query(func.count(Conversation.id))
        .join(Chatbot, Conversation.chatbot_id == Chatbot.id)
        .filter(
            Chatbot.vendor_id == vendor_id,
            Conversation.user_id == user_id,
            Conversation.chatbot_id == chatbot_id
        )
        .scalar()
    )
