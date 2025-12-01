from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from backend.db.database import engine, Base

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=9000, reload=True)