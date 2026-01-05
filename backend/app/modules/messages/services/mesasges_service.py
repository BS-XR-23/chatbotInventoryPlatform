from langchain.messages import HumanMessage, AIMessage, SystemMessage
from core.enums import SenderType, UserRole
from modules.users.models.user_model import User

def map_sender_to_llm_message(sender_type: SenderType, content: str):
    """
    Maps platform sender roles to LLM roles.
    """

    if sender_type in (
        SenderType.external,
        SenderType.vendor,
        SenderType.admin,
    ):
        return HumanMessage(content=content)

    if sender_type == SenderType.chatbot:
        return AIMessage(content=content)

    return None

def get_sender_type_from_user(user: User | None) -> SenderType:

    if not user:
        return SenderType.external

    if user.role == UserRole.external:
        return SenderType.external
    elif user.role == UserRole.vendor:
        return SenderType.vendor
    elif user.role == UserRole.admin:
        return SenderType.admin

    return SenderType.external
