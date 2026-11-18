import os
import hmac
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from contextlib import asynccontextmanager

from db import init_db
from ingest import ingest_document
from rag import generate_rag_response

INTERNAL_SECRET = os.getenv("FASTAPI_INTERNAL_SECRET", "")
IS_PROD = os.getenv("ENV", os.getenv("NODE_ENV", "development")) == "production"

def verify_internal_caller(x_internal_secret: Optional[str] = Header(default=None)):
    if IS_PROD and not INTERNAL_SECRET:
        raise HTTPException(status_code=503, detail="FASTAPI_INTERNAL_SECRET must be configured in production.")
    if INTERNAL_SECRET:
        if not x_internal_secret or not hmac.compare_digest(x_internal_secret, INTERNAL_SECRET):
            raise HTTPException(status_code=401, detail="Unauthorized internal request.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema on startup
    init_db()
    yield

app = FastAPI(
    title="AI Sales Bot - RAG API",
    description="FastAPI Backend for Ollama + pgvector Sales Executive Agent",
    version="1.0.0",
    lifespan=lifespan
)

class IngestRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1, max_length=200000)

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1, max_length=4000)

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    history: Optional[List[ChatMessage]] = Field(default_factory=list, max_length=16)

@app.get("/")
def serve_home():
    return FileResponse("index.html")

@app.post("/api/ingest", dependencies=[Depends(verify_internal_caller)])
async def ingest_endpoint(payload: IngestRequest):
    try:
        res = await ingest_document(payload.title, payload.category, payload.content)
        return res
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal ingestion error" if IS_PROD else str(e))

@app.post("/api/chat", dependencies=[Depends(verify_internal_caller)])
async def chat_endpoint(payload: ChatRequest):
    try:
        res = await generate_rag_response(payload.message, [h.model_dump() for h in (payload.history or [])])
        return res
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal inference error" if IS_PROD else str(e))
