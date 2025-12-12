from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from db.database import engine, Base
from modules.api_keys.models import api_model
from modules.chatbots.models import chatbot_model
from modules.conversations.models import conversation_model
from modules.documents.models import document_model
from modules.embeddings.models import embedding_model
from modules.llms.models import llm_model
from modules.users.models import user_model
from modules.vendors.models import vendor_model
from modules.vendors.routers import vendor_router
from modules.users.routers import user_router
from modules.api_keys.routers import api_router
from modules.chatbots.routers import chatbot_router
from modules.conversations.routers import conversation_router
from modules.documents.routers import document_router
from modules.llms.routers import llm_router
from modules.embeddings.routers import embedding_router
from modules.auth.routers import auth_router
from modules.vendors.routers import vendor_dashboard_router


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="chatbot-inventory-FastAPI",
    version = "0.1.0",
    docs_url="/docs",
)

app.add_middleware(
    #Cross Origin Resource Sharing -> CORS
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
app.include_router(vendor_dashboard_router.router, prefix="/vendor-dashboard", tags=["Vendor Dashboard"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=9000, reload=True)