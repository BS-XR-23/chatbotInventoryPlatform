from sqlalchemy.orm import Session
from modules.admin.admin_model import Admin, SystemSettings
from modules.admin.admin_schema import AdminCreate, AdminUpdate, SystemSettingsUpdate
from utils.hashing import hash_password
from modules.vendors.vendors import Vendor  # Assuming existing Vendor model
from modules.chatbots.chatbots import Chatbot  # Assuming existing Chatbot model
from modules.llms.llms import LLM, Embedding  # Assuming existing models
from modules.documents.documents import Document  # Assuming existing model

# -------------------
# Admin / System Settings
# -------------------
def create_admin(db: Session, data: AdminCreate):
    hashed_pw = hash_password(data.password)
    admin = Admin(username=data.username, email=data.email, hashed_password=hashed_pw, is_superadmin=True)
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin

def update_admin(db: Session, admin_id: int, data: AdminUpdate):
    admin = db.query(Admin).get(admin_id)
    if not admin:
        return None
    if data.username:
        admin.username = data.username
    if data.email:
        admin.email = data.email
    if data.password:
        admin.hashed_password = hash_password(data.password)
    db.commit()
    db.refresh(admin)
    return admin

def get_admin(db: Session, admin_id: int):
    return db.query(Admin).get(admin_id)

def get_system_settings(db: Session):
    return db.query(SystemSettings).first()

def update_system_settings(db: Session, data: SystemSettingsUpdate):
    settings = db.query(SystemSettings).first()
    if not settings:
        settings = SystemSettings(**data.dict())
        db.add(settings)
    else:
        for key, value in data.dict(exclude_unset=True).items():
            setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings

# -------------------
# Analytics Overview
# -------------------
def get_analytics(db: Session):
    num_vendors = db.query(Vendor).count()
    num_chatbots = db.query(Chatbot).count()
    num_conversations = db.query("conversations").count()  # Replace with your Conversation model
    num_messages = db.query("messages").count()  # Replace with your Message model

    top_chatbots = db.query(Chatbot).order_by(Chatbot.total_interactions.desc()).limit(5).all()  # Assuming field exists

    return {
        "num_vendors": num_vendors,
        "num_chatbots": num_chatbots,
        "num_conversations": num_conversations,
        "num_messages": num_messages,
        "top_chatbots": top_chatbots
    }

# -------------------
# Vendor Management
# -------------------
def list_vendors(db: Session):
    return db.query(Vendor).all()

def create_vendor(db: Session, data: dict):
    vendor = Vendor(**data)
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor

def update_vendor(db: Session, vendor_id: int, data: dict):
    vendor = db.query(Vendor).get(vendor_id)
    if not vendor:
        return None
    for key, value in data.items():
        setattr(vendor, key, value)
    db.commit()
    db.refresh(vendor)
    return vendor

def delete_vendor(db: Session, vendor_id: int):
    vendor = db.query(Vendor).get(vendor_id)
    if not vendor:
        return None
    db.delete(vendor)
    db.commit()
    return {"detail": "Vendor deleted"}

# -------------------
# Chatbot Management
# -------------------
def list_chatbots(db: Session):
    return db.query(Chatbot).all()

def create_chatbot(db: Session, data: dict):
    chatbot = Chatbot(**data)
    db.add(chatbot)
    db.commit()
    db.refresh(chatbot)
    return chatbot

def update_chatbot(db: Session, chatbot_id: int, data: dict):
    chatbot = db.query(Chatbot).get(chatbot_id)
    if not chatbot:
        return None
    for key, value in data.items():
        setattr(chatbot, key, value)
    db.commit()
    db.refresh(chatbot)
    return chatbot

def delete_chatbot(db: Session, chatbot_id: int):
    chatbot = db.query(Chatbot).get(chatbot_id)
    if not chatbot:
        return None
    db.delete(chatbot)
    db.commit()
    return {"detail": "Chatbot deleted"}

def duplicate_chatbot(db: Session, chatbot_id: int):
    chatbot = db.query(Chatbot).get(chatbot_id)
    if not chatbot:
        return None
    data = {c.name: getattr(chatbot, c.name) for c in Chatbot.__table__.columns if c.name != "id"}
    new_chatbot = Chatbot(**data)
    db.add(new_chatbot)
    db.commit()
    db.refresh(new_chatbot)
    return new_chatbot

def toggle_chatbot_status(db: Session, chatbot_id: int):
    chatbot = db.query(Chatbot).get(chatbot_id)
    if not chatbot:
        return None
    chatbot.is_active = not chatbot.is_active
    db.commit()
    db.refresh(chatbot)
    return chatbot

# -------------------
# LLM Management
# -------------------
def list_llms(db: Session):
    return db.query(LLM).all()

def create_llm(db: Session, data: dict):
    llm = LLM(**data)
    db.add(llm)
    db.commit()
    db.refresh(llm)
    return llm

def update_llm(db: Session, llm_id: int, data: dict):
    llm = db.query(LLM).get(llm_id)
    if not llm:
        return None
    for key, value in data.items():
        setattr(llm, key, value)
    db.commit()
    db.refresh(llm)
    return llm

def delete_llm(db: Session, llm_id: int):
    llm = db.query(LLM).get(llm_id)
    if not llm:
        return None
    db.delete(llm)
    db.commit()
    return {"detail": "LLM deleted"}

# -------------------
# Embedding Management
# -------------------
def list_embeddings(db: Session):
    return db.query(Embedding).all()

def create_embedding(db: Session, data: dict):
    emb = Embedding(**data)
    db.add(emb)
    db.commit()
    db.refresh(emb)
    return emb

def update_embedding(db: Session, embedding_id: int, data: dict):
    emb = db.query(Embedding).get(embedding_id)
    if not emb:
        return None
    for key, value in data.items():
        setattr(emb, key, value)
    db.commit()
    db.refresh(emb)
    return emb

def delete_embedding(db: Session, embedding_id: int):
    emb = db.query(Embedding).get(embedding_id)
    if not emb:
        return None
    db.delete(emb)
    db.commit()
    return {"detail": "Embedding deleted"}

# -------------------
# Document Library
# -------------------
def list_documents(db: Session):
    return db.query(Document).all()

def delete_document(db: Session, document_id: int):
    doc = db.query(Document).get(document_id)
    if not doc:
        return None
    db.delete(doc)
    db.commit()
    return {"detail": "Document deleted"}

def reprocess_document(db: Session, document_id: int):
    doc = db.query(Document).get(document_id)
    if not doc:
        return None
    doc.status = "processing"
    db.commit()
    db.refresh(doc)
    # Trigger background ingestion task here if you have one
    return doc
