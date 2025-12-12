from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.database import get_db
from modules.vendors.models.vendor_model import Vendor
from modules.auth.vendors.auth_vendor import get_current_vendor
from modules.vendors.services import vendor_dashboard_service

router = APIRouter(tags=["Vendor Dashboard"])


# ------------------------------
# Top Chatbots (Vendor)
# ------------------------------

@router.get("/top-chatbots/messages")
def vendor_top_chatbots_by_messages(
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(get_current_vendor)
):
    return vendor_dashboard_service.get_vendor_top_chatbots_by_messages(db, current_vendor.id)


@router.get("/top-chatbots/users")
def vendor_top_chatbots_by_unique_users(
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(get_current_vendor)
):
    return vendor_dashboard_service.get_vendor_top_chatbots_by_users(db, current_vendor.id)


# ------------------------------
# Vendor 7-Day Charts
# ------------------------------

@router.get("/daily/messages")
def vendor_daily_messages(
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(get_current_vendor)
):
    return vendor_dashboard_service.get_vendor_daily_message_count(db, current_vendor.id)


@router.get("/daily/unique-users")
def vendor_daily_unique_users(
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(get_current_vendor)
):
    return vendor_dashboard_service.get_vendor_daily_unique_users(db, current_vendor.id)


# ------------------------------
# User-Specific Token Usage
# ------------------------------

@router.get("/user/{user_id}/tokens-last7")
def vendor_user_tokens_last7(
    user_id: int,
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(get_current_vendor)
):
    return {
        "user_id": user_id,
        "tokens_last_7_days": vendor_dashboard_service.get_user_tokens_last_7_days_for_vendor(
            db, current_vendor.id, user_id
        )
    }


@router.get("/user/{user_id}/tokens-total")
def vendor_user_tokens_total(
    user_id: int,
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(get_current_vendor)
):
    return {
        "user_id": user_id,
        "total_tokens": vendor_dashboard_service.get_user_total_tokens_for_vendor(
            db, current_vendor.id, user_id
        )
    }


@router.get("/user/{user_id}/chatbot/{chatbot_id}/messages-count")
def vendor_user_chatbot_message_count(
    user_id: int,
    chatbot_id: int,
    db: Session = Depends(get_db),
    current_vendor: Vendor = Depends(get_current_vendor)
):
    return {
        "user_id": user_id,
        "chatbot_id": chatbot_id,
        "message_count": vendor_dashboard_service.get_user_message_count_for_chatbot_and_vendor(
            db, current_vendor.id, user_id, chatbot_id
        )
    }