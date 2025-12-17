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
from modules.chatbots.models.chatbot_model import Chatbot
from modules.embeddings.models.embedding_model import Embedding
from utils.convert_to_txt import convert_to_txt



def embedd_document(
    db: Session,
    chatbot_id: int,
    embedd_obj: Embedding,
    document_obj: list,
    overwrite: bool = False
):
    """
    Embed documents for a chatbot and return the vector store object.
    The caller should create the VectorDB row using vectordb.persist_path
    """
    # ------------------------- Fetch Chatbot -------------------------
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.is_active == True
    ).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found or inactive")

    # ------------------------- Prepare embeddings -------------------------
    embeddings = OllamaEmbeddings(model=embedd_obj.model_name)

    # Convert documents to LangChain format
    docs = []
    for doc_obj in document_obj:
        file_path = Path(doc_obj.file_path)
        if not file_path.exists():
            continue
        text = convert_to_txt(file_path)
        docs.append(Document(page_content=text, metadata={"source": str(file_path)}))

    if not docs:
        raise HTTPException(status_code=404, detail="No valid document files found for embedding")

    # ------------------------- Split into chunks -------------------------
    splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=100)
    chunks = splitter.split_documents(docs)

    # ------------------------- Determine vector DB path -------------------------
    vector_db_str = getattr(chatbot, "vector_db", None)
    if not vector_db_str:
        # default to local chroma path
        vector_db_str = f"chroma://uploads/vectorstore/chatbot_{chatbot_id}"
    vector_db_str = vector_db_str.lower()

    # ------------------------- Chroma -------------------------
    if vector_db_str.startswith("chroma://") or os.path.isdir(vector_db_str):
        persist_dir = vector_db_str.replace("chroma://", "")
        os.makedirs(persist_dir, exist_ok=True)
        try:
            vectordb = Chroma(persist_directory=persist_dir, embedding_function=embeddings)
            if overwrite:
                vectordb.delete()
        except Exception:
            vectordb = Chroma.from_documents(
                documents=chunks,
                embedding=embeddings,
                persist_directory=persist_dir
            )
        vectordb.add_documents(chunks)
        vectordb.persist()
        persist_path = persist_dir

    # ------------------------- Qdrant -------------------------
    elif vector_db_str.startswith("qdrant://"):
        url = vector_db_str.replace("qdrant://", "")
        client = qdrant_client.QdrantClient(url=url)
        collection_name = f"chatbot_{chatbot_id}"
        vectordb = Qdrant.from_documents(
            documents=chunks,
            embedding=embeddings,
            url=url,
            collection_name=collection_name
        )
        persist_path = f"qdrant://{url}/{collection_name}"

    # ------------------------- Pinecone -------------------------
    elif vector_db_str.startswith("pinecone://"):
        index_name = vector_db_str.replace("pinecone://", "")
        pinecone.init(api_key=os.environ.get("PINECONE_API_KEY", ""))
        vectordb = Pinecone.from_documents(
            documents=chunks,
            embedding=embeddings,
            index_name=index_name
        )
        persist_path = f"pinecone://{index_name}"

    # ------------------------- Weaviate -------------------------
    elif vector_db_str.startswith("weaviate://"):
        url = vector_db_str.replace("weaviate://", "")
        client = weaviate.Client(url)
        index_name = f"ChatbotIndex_{chatbot_id}"
        vectordb = Weaviate.from_documents(
            documents=chunks,
            embedding=embeddings,
            client=client,
            index_name=index_name
        )
        persist_path = f"weaviate://{url}/{index_name}"

    # ------------------------- PGVector -------------------------
    elif vector_db_str.startswith("pgvector://"):
        connection_string = vector_db_str.replace("pgvector://", "")
        collection_name = f"chatbot_{chatbot_id}"
        vectordb = PGVector.from_documents(
            connection_string=connection_string,
            documents=chunks,
            embedding=embeddings,
            collection_name=collection_name
        )
        persist_path = f"pgvector://{connection_string}/{collection_name}"

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported vector DB type: {vector_db_str}")

    # ------------------------- Update document status -------------------------
    for doc in document_obj:
        doc.status = "embedded"
    db.commit()

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
