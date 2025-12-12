from fastapi import HTTPException
from sqlalchemy.orm import Session
from langchain_ollama import ChatOllama
from langchain.messages import HumanMessage, SystemMessage
from modules.chatbots.models.chatbot_model import Chatbot
from utils.convert_to_txt import convert_to_txt


def summarize_documents_generate_tags(db: Session, chatbot_id: int, file_path) -> tuple[str, str]:

    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.is_active == True
    ).first()

    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found or inactive")

    if not chatbot.llm_path:
        raise HTTPException(status_code=400, detail="Chatbot does not have an LLM path configured")
    
    text = convert_to_txt(file_path)

    system_prompt = (
        """
        You are a professional document summarizer and meta tag generator. Your task is to read the given document
    and produce two outputs:

    1. **Summary:** A clear, concise, and informative summary of the document.
    2. **Meta Tags:** 3-7 concise hashtags suitable for social media (e.g., Twitter), capturing the main topics.

    Follow these rules:

    **Summary Rules:**
    - Summarize the main points and key ideas.
    - Keep it concise: 3-5 sentences or 5-7 bullet points.
    - Use simple, clear language suitable for a general audience.
    - Do not add opinions or information not present in the document.
    - Highlight important facts, names, dates, or statistics if present.
    - Maintain the logical flow of the original document.
    - If the document has multiple sections, provide a short summary for each.

    **Meta Tags Rules:**
    - Generate 3-7 hashtags that represent the key topics.
    - Each tag must start with `#`.
    - Tags should be short, clear, and relevant.
    - Avoid generic or vague tags.
    - Return tags as a comma-separated list, without extra text.

    **Output Format:**
    - First, the summary (paragraph or bullet points).
    - Then, a line labeled `Tags:` followed by the comma-separated hashtags.
    """)

    # 3️⃣ Initialize ChatOllama
    model = ChatOllama(
        model=chatbot.llm_path,
        temperature=0.0,
        max_tokens=chatbot.token_limit
    )

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Document:\n\n{text}")
    ]

    result = model.invoke(messages)

    content = result.content

    if "Tags:" in content:
        summary_text, tags_line = content.split("Tags:", 1)
        summary_text = summary_text.strip()
        tags_line = tags_line.strip()
    else:
        summary_text = content.strip()
        tags_line = ""
    
    return summary_text, tags_line
