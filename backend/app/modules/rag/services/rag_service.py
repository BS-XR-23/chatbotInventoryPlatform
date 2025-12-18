from fastapi import HTTPException
from sqlalchemy.orm import Session
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import Chroma, Qdrant, Pinecone, Weaviate, PGVector
import os
from pathlib import Path
import qdrant_client
import pinecone
import weaviate
from core.enums import DocumentStatus
from modules.chatbots.models.chatbot_model import Chatbot
from modules.embeddings.models.embedding_model import Embedding
from utils.convert_to_txt import convert_to_txt


def create_vector_store(store_type, chatbot_id, embeddings, chunks, config):
    if store_type == "chroma":
        persist_dir = config.get(
            "persist_dir",
            f"uploads/vectorstore/chatbot_{chatbot_id}"
        )
        os.makedirs(persist_dir, exist_ok=True)

        vectordb = Chroma(
            persist_directory=persist_dir,
            embedding_function=embeddings
        )
        vectordb.add_documents(chunks)
        vectordb.persist()
        return vectordb, persist_dir

    elif store_type == "qdrant":
        url = config["url"]
        collection = f"chatbot_{chatbot_id}"
        vectordb = Qdrant.from_documents(
            chunks, embeddings, url=url, collection_name=collection
        )
        return vectordb, f"qdrant://{url}/{collection}"

    elif store_type == "pinecone":
        index = config["index_name"]
        vectordb = Pinecone.from_documents(chunks, embeddings, index_name=index)
        return vectordb, f"pinecone://{index}"

    elif store_type == "weaviate":
        url = config["url"]
        client = weaviate.Client(url)
        index = f"ChatbotIndex_{chatbot_id}"
        vectordb = Weaviate.from_documents(
            chunks, embeddings, client=client, index_name=index
        )
        return vectordb, f"weaviate://{url}/{index}"

    elif store_type == "pgvector":
        conn = config["connection_string"]
        collection = f"chatbot_{chatbot_id}"
        vectordb = PGVector.from_documents(
            connection_string=conn,
            documents=chunks,
            embedding=embeddings,
            collection_name=collection
        )
        return vectordb, f"pgvector://{conn}/{collection}"

    else:
        raise ValueError("Unsupported vector store")




def embedd_document(db, chatbot_id, embedd_obj, document_obj):
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.is_active
    ).first()

    if not chatbot:
        raise ValueError("Chatbot not found or inactive")

    embeddings = OllamaEmbeddings(model=embedd_obj.model_name)
    docs = []
    for doc in document_obj:
        text = convert_to_txt(Path(doc.file_path))
        docs.append(Document(page_content=text))

    splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=100)
    chunks = splitter.split_documents(docs)

    vectordb, persist_path = create_vector_store(
        chatbot.vector_store_type,
        chatbot.id,
        embeddings,
        chunks,
        chatbot.vector_store_config or {}
    )

    vectordb.persist_path = persist_path
    return vectordb


def load_vectorstore(vector_db: str, embeddings):

    vector_db = vector_db.lower()

    if vector_db.startswith("chroma://") or os.path.isdir(vector_db):
        
        persist_dir = vector_db.replace("chroma://", "")
        return Chroma(persist_directory=persist_dir, embedding_function=embeddings)

    elif vector_db.startswith("pinecone://"):
        
        index_name = vector_db.replace("pinecone://", "")
        return Pinecone(index_name=index_name, embedding=embeddings)

    elif vector_db.startswith("qdrant://"):
        
        url = vector_db.replace("qdrant://", "")
        return Qdrant(url=url, embedding=embeddings)

    elif vector_db.startswith("weaviate://"):
        
        url = vector_db.replace("weaviate://", "")
        client = weaviate.Client(url)
        return Weaviate(client=client, embedding=embeddings, index_name="ChatbotIndex")

    elif vector_db.startswith("pgvector://"):
        
        connection_string = vector_db.replace("pgvector://", "")
        return PGVector(connection_string=connection_string, embedding=embeddings)

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported vector DB type: {vector_db}")


def get_rag_context(question: str, vectordb, k: int = 3):
    docs_found = vectordb.similarity_search(question, k=k)
    if not docs_found:
        return "", []

    context = "\n\n".join([d.page_content for d in docs_found])
    metadata_list = [d.metadata for d in docs_found]
    return context, metadata_list
