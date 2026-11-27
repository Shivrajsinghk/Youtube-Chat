import json
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path
from threading import Lock
from urllib.parse import parse_qs, urlparse
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from langchain_classic.prompts import PromptTemplate
from langchain_classic.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound,
    IpBlocked,
    RequestBlocked,
    VideoUnavailable,
)


BASE_DIR = Path(__file__).resolve().parent
CACHE_DIR = BASE_DIR / "CACHE_TRANSCRIPTS"
CACHE_DIR.mkdir(exist_ok=True)

load_dotenv(BASE_DIR.parent / ".env")

VIDEO_ID_CHARS = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-")
YOUTUBE_HOSTS = ("youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com")
NOISE_TAGS = ("[Music]", "[Applause]", "[Laughter]", "♪")

RATE_LIMIT = 20
RATE_WINDOW_SECONDS = 60

embedding_model = None
vector_stores = {}
rate_limit_state = {}
rate_limit_lock = Lock()
build_lock = Lock()

PROMPT = PromptTemplate(
    template="""You are a helpful AI assistant.
    Answer only from the provided transcript context.
    If the context doesn't directly answer the question, say what the context does cover that is closest, and cite its timestamp. Only reply exactly "I don't know" if nothing in the context is related.
    When referring to a moment in the video, write the timestamp as [MM:SS] (or [H:MM:SS] for videos over an hour), using only timestamps present in the context.
    Context:
    {context}
    Question:
    {question}
    """,
    input_variables=["context", "question"],
)


class ApiError(Exception):
    def __init__(self, status_code, code, message):
        self.status_code = status_code
        self.code = code
        self.message = message


def format_time(seconds):
    total_seconds = int(seconds)
    hours, remainder = divmod(total_seconds, 3600)
    minutes, secs = divmod(remainder, 60)
    if total_seconds >= 3600:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def format_doc(docs):
    return "\n\n".join(
        f"Timestamp: {format_time(doc.metadata['start'])}\nContent: {doc.page_content}"
        for doc in docs
    )


def clean_text(text):
    for tag in NOISE_TAGS:
        text = text.replace(tag, " ")
    return " ".join(text.split())


def extract_video_id(url):
    if not isinstance(url, str) or not url.strip():
        return None
    try:
        parsed = urlparse(url.strip())
    except ValueError:
        return None

    host = (parsed.hostname or "").lower()
    video_id = None
    if host == "youtu.be":
        parts = parsed.path.strip("/").split("/")
        video_id = parts[0] if parts and parts[0] else None
    elif host in YOUTUBE_HOSTS:
        parts = [part for part in parsed.path.split("/") if part]
        if parsed.path.rstrip("/") == "/watch":
            values = parse_qs(parsed.query).get("v", [])
            video_id = values[0] if values else None
        elif len(parts) >= 2 and parts[0] in ("shorts", "embed", "live"):
            video_id = parts[1]

    # YouTube video IDs are eleven ASCII letters, digits, underscores, or hyphens.
    if not video_id or len(video_id) != 11:
        return None
    if any(char not in VIDEO_ID_CHARS for char in video_id):
        return None
    return video_id


def fetch_transcript(video_id):
    cache_path = CACHE_DIR / f"transcript_{video_id}.json"
    if cache_path.exists():
        try:
            with cache_path.open("r", encoding="utf-8") as cache_file:
                return json.load(cache_file)
        except (json.JSONDecodeError, OSError):
            cache_path.unlink(missing_ok=True)  # corrupted cache, refetch

    try:
        transcript = YouTubeTranscriptApi().fetch(
            video_id=video_id,
            languages=["en", "en-US", "en-IN"],
        )
        entries = [
            {"text": item.text, "start": item.start, "duration": item.duration}
            for item in transcript
        ]
    except (TranscriptsDisabled, NoTranscriptFound) as exc:
        raise ApiError(404, "no_transcript", "No transcript is available for this video.") from exc
    except VideoUnavailable as exc:
        raise ApiError(404, "video_unavailable", "The video is unavailable.") from exc
    except (IpBlocked, RequestBlocked) as exc:
        raise ApiError(503, "youtube_blocked", "YouTube blocked the transcript request.") from exc
    except Exception as exc:
        raise ApiError(502, "transcript_error", "Could not fetch the transcript.") from exc

    tmp_path = cache_path.with_suffix(".tmp")
    with tmp_path.open("w", encoding="utf-8") as cache_file:
        json.dump(entries, cache_file, ensure_ascii=False, indent=2)
    tmp_path.replace(cache_path)
    return entries


def build_index(video_id):
    transcript = fetch_transcript(video_id)

    cleaned = []
    for item in transcript:
        text = clean_text(item["text"])
        if text:
            cleaned.append({**item, "text": text})

    groups = {}
    for item in cleaned:
        window = int(item["start"] // 60)
        groups.setdefault(window, []).append(item)

    documents = []
    for items in groups.values():
        documents.append(
            Document(
                page_content=" ".join(item["text"] for item in items),
                metadata={
                    "start": items[0]["start"],
                    "end": items[-1]["start"] + items[-1]["duration"],
                    "video_id": video_id,
                },
            )
        )

    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
    chunks = splitter.split_documents(documents)
    if not chunks:
        raise ApiError(404, "no_transcript", "No usable transcript text for this video.")

    store = FAISS.from_documents(documents=chunks, embedding=embedding_model)
    vector_stores[video_id] = store
    return len(chunks)


@asynccontextmanager
async def lifespan(app):
    global embedding_model
    groq_model = os.getenv("GROQ_MODEL", "").strip().strip("\"'")
    groq_api_key = os.getenv("GROQ_API_KEY", "").strip().strip("\"'")
    if not groq_model or not groq_api_key:
        raise RuntimeError(
            "Missing required environment variable(s): set GROQ_MODEL and GROQ_API_KEY before starting the API."
        )
    embedding_model = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    llm = ChatGroq(model=groq_model, api_key=groq_api_key, temperature=0)
    app.state.chain = PROMPT | llm | StrOutputParser()
    yield


app = FastAPI(title="YouTube RAG API", lifespan=lifespan)
allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ApiError)
async def api_error_handler(request: Request, exc: ApiError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )


def enforce_rate_limit(request):
    ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    with rate_limit_lock:
        recent = [s for s in rate_limit_state.get(ip, []) if now - s < RATE_WINDOW_SECONDS]
        if len(recent) >= RATE_LIMIT:
            rate_limit_state[ip] = recent
            raise ApiError(429, "rate_limited", "Request limit exceeded. Try again shortly.")
        recent.append(now)
        rate_limit_state[ip] = recent


@app.post("/api/videos")
def index_video(request: Request, body: dict):
    enforce_rate_limit(request)
    video_id = extract_video_id(body.get("url"))
    if video_id is None:
        raise ApiError(400, "invalid_url", "Provide a supported YouTube video URL.")

    with build_lock:
        if video_id in vector_stores:
            count = len(vector_stores[video_id].index_to_docstore_id)
        else:
            count = build_index(video_id)
    return {"video_id": video_id, "chunk_count": count}


@app.post("/api/chat")
def chat(request: Request, body: dict):
    enforce_rate_limit(request)
    video_id = body.get("video_id")
    question = body.get("question")
    if not isinstance(video_id, str) or video_id not in vector_stores:
        raise ApiError(404, "video_not_indexed", "Call /api/videos to index this video first.")
    if not isinstance(question, str) or not question.strip():
        raise ApiError(400, "invalid_question", "Provide a non-empty question.")

    retriever = vector_stores[video_id].as_retriever(
        search_type="mmr",
        search_kwargs={"k": 5, "lambda_mult": 0.7},
    )
    docs = retriever.invoke(question)

    try:
        answer = request.app.state.chain.invoke(
            {"context": format_doc(docs), "question": question}
        )
    except Exception as exc:
        raise ApiError(502, "llm_error", "The language model request failed.") from exc

    normalized = answer.strip().lower().replace("’", "'")
    answered = not normalized.startswith("i don't know")

    sources_by_start = {}
    for doc in docs:
        start = doc.metadata["start"]
        if start not in sources_by_start:
            sources_by_start[start] = {
                "start": start,
                "end": doc.metadata["end"],
                "timestamp": format_time(start),
                "text": doc.page_content[:200],
            }
    sources = [sources_by_start[s] for s in sorted(sources_by_start)]
    return {"answer": answer, "answered": answered, "sources": sources}
