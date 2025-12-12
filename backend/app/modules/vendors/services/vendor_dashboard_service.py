from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from sqlalchemy import func
import os
from datetime import datetime, timedelta
from modules.chatbots.models.chatbot_model import Chatbot
from modules.conversations.models.conversation_model import Conversation


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
            "chatbot_id": r.chatbot_id,
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
            "chatbot_id": r.chatbot_id,
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
            "chatbot_id": r.chatbot_id,
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
            "chatbot_id": r.chatbot_id,
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