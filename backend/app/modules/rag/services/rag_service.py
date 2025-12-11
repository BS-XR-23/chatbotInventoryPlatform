from fastapi import HTTPException
from sqlalchemy.orm import Session
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import Chroma, Qdrant, Pinecone, Weaviate, PGVector
import os
from shutil import rmtree
from pathlib import Path
import qdrant_client
import pinecone
import weaviate
from modules.chatbots.models.chatbot_model import Chatbot
from modules.llms.models.llm_model import LLM
from modules.embeddings.models.embedding_model import Embedding
from utils.convert_to_txt import convert_to_txt


def embedd_document(db: Session, chatbot_id: int, embedd_obj: Embedding, document_obj: list, overwrite: bool = False):
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.is_active == True
    ).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found or inactive")

    embeddings = OllamaEmbeddings(model=embedd_obj.model_name)

    # Convert document objects to LangChain documents
    docs = []
    for doc_obj in document_obj:
        file_path = Path(doc_obj.file_path)
        if not file_path.exists():
            continue
        text = convert_to_txt(file_path)
        docs.append(Document(page_content=text, metadata={"source": str(file_path)}))

    if not docs:
        raise HTTPException(status_code=404, detail="No valid document files found for embedding")

    splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=100)
    chunks = splitter.split_documents(docs)

    vector_db = chatbot.vector_db.lower()

    # ------------------------- Chroma -------------------------
    if vector_db.startswith("chroma://") or os.path.isdir(vector_db):
        persist_dir = vector_db.replace("chroma://", "")
        os.makedirs(persist_dir, exist_ok=True)

        # Load existing vector store if it exists
        try:
            vectordb = Chroma(persist_directory=persist_dir, embedding_function=embeddings)
            if overwrite:
                # Clear existing entries
                vectordb.delete()
        except Exception:
            # If directory empty or invalid, create new
            vectordb = Chroma.from_documents(
                documents=chunks,
                embedding=embeddings,
                persist_directory=persist_dir
            )

        # Add new chunks
        vectordb.add_documents(chunks)
        vectordb.persist()
        return vectordb

    # ------------------------- Qdrant -------------------------
    elif vector_db.startswith("qdrant://"):
        url = vector_db.replace("qdrant://", "")
        client = qdrant_client.QdrantClient(url=url)
        vectordb = Qdrant.from_documents(
            documents=chunks,
            embedding=embeddings,
            url=url,
            collection_name=f"chatbot_{chatbot_id}"
        )
        return vectordb

    # ------------------------- Pinecone -------------------------
    elif vector_db.startswith("pinecone://"):
        index_name = vector_db.replace("pinecone://", "")
        pinecone.init(api_key=os.environ.get("PINECONE_API_KEY", ""))
        vectordb = Pinecone.from_documents(
            documents=chunks,
            embedding=embeddings,
            index_name=index_name
        )
        return vectordb

    # ------------------------- Weaviate -------------------------
    elif vector_db.startswith("weaviate://"):
        url = vector_db.replace("weaviate://", "")
        client = weaviate.Client(url)
        vectordb = Weaviate.from_documents(
            documents=chunks,
            embedding=embeddings,
            client=client,
            index_name=f"ChatbotIndex_{chatbot_id}"
        )
        return vectordb

    # ------------------------- PGVector -------------------------
    elif vector_db.startswith("pgvector://"):
        connection_string = vector_db.replace("pgvector://", "")
        vectordb = PGVector.from_documents(
            connection_string=connection_string,
            documents=chunks,
            embedding=embeddings,
            collection_name=f"chatbot_{chatbot_id}"
        )
        return vectordb

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported vector DB type: {chatbot.vector_db}"
        )


def load_vectorstore(vector_db: str, embeddings):

    vector_db = vector_db.lower()

    if vector_db.startswith("chroma://") or os.path.isdir(vector_db):
        persist_dir = vector_db.replace("chroma://", "")
        from langchain_community.vectorstores import Chroma
        return Chroma(persist_directory=persist_dir, embedding_function=embeddings)

    elif vector_db.startswith("pinecone://"):
        index_name = vector_db.replace("pinecone://", "")
        from langchain_community.vectorstores import Pinecone
        return Pinecone(index_name=index_name, embedding=embeddings)

    elif vector_db.startswith("qdrant://"):
        url = vector_db.replace("qdrant://", "")
        from langchain_community.vectorstores import Qdrant
        return Qdrant(url=url, embedding=embeddings)

    elif vector_db.startswith("weaviate://"):
        url = vector_db.replace("weaviate://", "")
        import weaviate
        from langchain_community.vectorstores import Weaviate
        client = weaviate.Client(url)
        return Weaviate(client=client, embedding=embeddings, index_name="ChatbotIndex")

    elif vector_db.startswith("pgvector://"):
        connection_string = vector_db.replace("pgvector://", "")
        from langchain_community.vectorstores import PGVector
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
