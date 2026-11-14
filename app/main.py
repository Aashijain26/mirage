"""FastAPI application for the Snare honeytoken demo."""

import os
import re

# Load .env before modules read settings during import.
from dotenv import load_dotenv

load_dotenv()

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from app import models
from app.database import Base, engine, get_db
from app.detection import detect_honeytoken_usage, token_database_id
from app.honeytoken_service import generate_honeytoken
from app.routes.admin import require_admin, router as admin_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Honeytokens as a Service",
    description="A deceptive credential generation and detection platform",
    version="2.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(admin_router)


class TokenUsageRequest(BaseModel):
    token: str


class HoneytokenRequest(BaseModel):
    name: str
    token_type: str = "api_key"


@app.get("/")
def home():
    return {"message": "Honeytokens backend is running!", "contract": "v2"}


@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Database unavailable") from exc
    return {"status": "healthy", "database": "connected"}


@app.post("/simulate-use")
def simulate_token_usage(
    request_data: TokenUsageRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    return detect_honeytoken_usage(
        db=db,
        raw_token=request_data.token,
        source_ip=request.client.host if request.client else "Unknown",
        user_agent=request.headers.get("user-agent"),
        path=str(request.url.path),
        method=request.method,
        headers=request.headers,
    )


def _s3_response():
    return Response(
        content=("<?xml version=\"1.0\" encoding=\"UTF-8\"?><ListAllMyBucketsResult "
                 "xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\"><Owner><ID>snare-decoy</ID>"
                 "<DisplayName>Snare Decoy</DisplayName></Owner><Buckets /></ListAllMyBucketsResult>"),
        media_type="application/xml",
    )


async def _trap(token_ref: str, request: Request, db: Session, path_suffix: str = ""):
    token_pk = token_database_id(token_ref)
    if token_pk is None:
        raise HTTPException(status_code=404, detail="Unknown honeytoken trap")

    token = db.query(models.Honeytoken).filter(models.Honeytoken.id == token_pk).first()
    if token is None or not token.is_active:
        raise HTTPException(status_code=404, detail="Unknown or revoked honeytoken trap")
    if request.url.path.startswith("/aws/") and token.token_type != "aws":
        raise HTTPException(status_code=404, detail="Unknown AWS honeytoken trap")

    # The AWS access key in a signed request also embeds the token record id.
    authorization = request.headers.get("authorization", "")
    key_match = re.search(r"Credential=(AKIA[0-9A-Z]{16})/", authorization)
    if key_match and token_database_id(key_match.group(1)) != token_pk:
        raise HTTPException(status_code=403, detail="Credential does not match this trap")

    result = detect_honeytoken_usage(
        db=db,
        token_id=token_ref,
        source_ip=request.client.host if request.client else "Unknown",
        user_agent=request.headers.get("user-agent"),
        path=f"/{path_suffix}" if path_suffix else request.url.path,
        method=request.method,
        headers=request.headers,
    )
    if not result.get("detected"):
        raise HTTPException(status_code=404, detail="Unknown or revoked honeytoken trap")
    if request.method == "HEAD":
        return Response(status_code=200)
    if "/aws/" in request.url.path and request.method == "GET":
        return _s3_response()
    return {"ok": True, "request_id": result["alert_id"]}


@app.api_route("/t/{token_ref}/hook", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"])
async def token_hook(token_ref: str, request: Request, db: Session = Depends(get_db)):
    return await _trap(token_ref, request, db)


@app.api_route("/t/{token_ref}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"])
async def token_callback(token_ref: str, request: Request, db: Session = Depends(get_db)):
    return await _trap(token_ref, request, db)


@app.api_route("/aws/{token_ref}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"])
async def aws_root(token_ref: str, request: Request, db: Session = Depends(get_db)):
    return await _trap(token_ref, request, db)


@app.api_route("/aws/{token_ref}/{path_suffix:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"])
async def aws_operation(token_ref: str, path_suffix: str, request: Request, db: Session = Depends(get_db)):
    return await _trap(token_ref, request, db, path_suffix)


@app.get("/honeytokens", dependencies=[Depends(require_admin)])
def legacy_honeytokens(request: Request, db: Session = Depends(get_db)):
    rows = db.query(models.Honeytoken).order_by(models.Honeytoken.id.desc()).limit(500).all()
    base = str(request.base_url).rstrip("/")
    return [
        {"id": f"tok-{row.token_type}-{row.id}", "name": row.name,
         "token_type": row.token_type, "is_active": row.is_active,
         "callback_url": f"{base}/t/tok-{row.token_type}-{row.id}/hook",
         "created_at": row.created_at.isoformat() if row.created_at else None}
        for row in rows
    ]


@app.post("/honeytokens", dependencies=[Depends(require_admin)])
def legacy_create_honeytoken(
    body: HoneytokenRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    if not body.name.strip():
        raise HTTPException(status_code=422, detail="Name must not be blank")
    try:
        base_url = os.getenv("PUBLIC_BASE_URL") or str(request.base_url).rstrip("/")
        return generate_honeytoken(db, body.name.strip(), body.token_type, base_url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.get("/alerts", dependencies=[Depends(require_admin)])
def legacy_alerts(db: Session = Depends(get_db)):
    rows = db.query(models.Alert).order_by(models.Alert.id.desc()).limit(500).all()
    return [
        {"id": row.id, "honeytoken_id": row.honeytoken_id, "event_type": row.event_type,
         "source_ip": row.source_ip, "created_at": row.created_at.isoformat() if row.created_at else None}
        for row in rows
    ]
