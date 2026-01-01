from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from core.config import settings
from db.database import engine, Base
from modules.vendors.routers import vendor_router
from modules.users.routers import user_router
from modules.api_keys.routers import api_router
from modules.chatbots.routers import chatbot_router
from modules.conversations.routers import conversation_router
from modules.documents.routers import document_router
from modules.llms.routers import llm_router
from modules.embeddings.routers import embedding_router
from modules.auth.routers import auth_router
from modules.admins.routers import admin_router
from modules.vector_dbs.routers import vector_db_router


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="chatbot-inventory-FastAPI",
    version = "0.1.0",
    docs_url="/docs",
)
origins = [
    "http://127.0.0.1:5500",  # your frontend
    "http://localhost:5500"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router.router, prefix="/users", tags=["Users"])
app.include_router(vendor_router.router, prefix="/vendors", tags=["Vendors"])
app.include_router(api_router.router, prefix="/api-keys", tags=["API Keys"])
app.include_router(chatbot_router.router, prefix="/chatbots", tags=["Chatbots"])
app.include_router(conversation_router.router, prefix="/conversations", tags=["Conversations"])
app.include_router(document_router.router, prefix="/documents", tags=["Documents"])
app.include_router(llm_router.router, prefix="/llms", tags=["LLMs"])
app.include_router(embedding_router.router, prefix="/embeddings", tags=["Embeddings"])
app.include_router(auth_router.router, prefix="/auth", tags=["auth"])
app.include_router(admin_router.router, prefix="/admins", tags=["Admins"])
app.include_router(vector_db_router.router, prefix="/vector_dbs", tags=["VectorDBs"])

# Serve static folder
app.mount("/static", StaticFiles(directory="static"), name="static")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="localhost", port=9000, reload=True)