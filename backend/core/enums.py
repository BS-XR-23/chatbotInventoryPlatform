import enum
from sqlalchemy import Enum as SQLEnum

class UserRole(str, enum.Enum):
    admin = "admin"
    vendor = "vendor"
    external = "external"

class UserType(str, enum.Enum):
    vendor = "vendor"
    external = "external"
    admin = "admin"

class SenderType(str, enum.Enum):
    vendor = "vendor"
    external = "external"
    chatbot = "chatbot"

class DocumentStatus(str, enum.Enum):
    processing = "processing"
    ready = "ready"
    failed = "failed"

class ChatbotMode(str, enum.Enum):
    private = "private"
    public = "public"

class APIKeyStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"

class LLMProvider(str, enum.Enum):
    openai = "openai"
    anthropic = "anthropic"
    cohere = "cohere"
    huggingface = "huggingface"
    google = "google"
    azure = "azure"
    local = "local"
    ollama="ollama"
