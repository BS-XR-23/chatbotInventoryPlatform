from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from chatbot.chatbotInventoryPlatform.app.config.database import engine, Base

from app.models import ()


from app.routers import ()



Base.metadata.create_all(bind=engine)

api = FastAPI(title="chatbot-inventory-FastAPI")
