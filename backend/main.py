from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from db.database import engine, Base
from modules.vendors import (vendor_model, vendor_router)
from modules.users import (user_model, user_router)
from modules.api_keys import (api_model, api_router)
from modules.chatbots import (chatbot_model, chatbot_router)
from modules.conversations import (conversation_model, conversation_router)
from modules.documents import (document_model, document_router)
from modules.llms import (llm_model, llm_router)
from modules.embeddings import (embedding_model, embedding_router)
from modules.auth import (auth_router)


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
app.include_router(auth_router.router, prefix="/auth", tags=["Auth"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=9000, reload=True)