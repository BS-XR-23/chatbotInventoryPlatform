from fastapi import HTTPException
from sqlalchemy.orm import Session
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import Chroma, FAISS
import os
from pathlib import Path
import qdrant_client
import pinecone
import weaviate
from core.enums import DocumentStatus, VectorStoreType
from modules.chatbots.models.chatbot_model import Chatbot
from modules.embeddings.models.embedding_model import Embedding
from utils.convert_to_txt import convert_to_txt

def create_vector_store(store_type, chatbot_id, embeddings, chunks):
    """
    Create a vector store (Chroma or FAISS) for a chatbot and return the store.
    Returns: vectordb, persist_path
    """
    persist_path = f"uploads/vectorstore/{store_type.lower()}/chatbot_{chatbot_id}"
    os.makedirs(persist_path, exist_ok=True)

    if store_type.lower() == VectorStoreType.chroma:
        vectordb = Chroma(
            persist_directory=persist_path,
            embedding_function=embeddings
        )
        vectordb.add_documents(chunks)
        vectordb.persist()
        return vectordb, persist_path

    elif store_type.lower() == VectorStoreType.faiss:
        vectordb = FAISS.from_documents(chunks, embeddings)
        vectordb.save_local(persist_path)
        return vectordb, persist_path

    else:
        raise ValueError("Unsupported vector store. Only 'chroma' and 'faiss' are supported.")



def load_vectorstore(store_type, db_path, embeddings):
    """
    Load a vector store using the path stored in DB.
    db_path should be exactly the path saved in DB, e.g., 'uploads/vectorstore/chroma/chatbot_28'
    """
    if not os.path.isdir(db_path):
        raise ValueError(f"{store_type.capitalize()} vector store not found at {db_path}")

    if store_type.lower() == VectorStoreType.chroma:
        return Chroma(persist_directory=db_path, embedding_function=embeddings)
    elif store_type.lower() == VectorStoreType.faiss:
        return FAISS.load_local(db_path, embeddings)
    else:
        raise ValueError("Unsupported vector store. Only 'chroma' and 'faiss' are supported.")





def embedd_document(db, chatbot_id, embedd_obj, document_objs):
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.is_active
    ).first()
    if not chatbot:
        raise ValueError("Chatbot not found or inactive")

    embeddings = OllamaEmbeddings(model=embedd_obj.model_name)

    docs = [Document(page_content=convert_to_txt(Path(doc.file_path))) for doc in document_objs]

    splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=100)
    chunks = splitter.split_documents(docs)

    vectordb, persist_path = create_vector_store(
        chatbot.vector_store_type,
        chatbot.id,
        embeddings,
        chunks
    )

    # Save path to DB
    chatbot.db_path = persist_path
    db.commit()

    return vectordb


def get_rag_context(question: str, vectordb, k: int = 3):
    docs_found = vectordb.similarity_search(question, k=k)
    if not docs_found:
        return "", []

    context = "\n\n".join([d.page_content for d in docs_found])
    metadata_list = [d.metadata for d in docs_found]
    return context, metadata_list
