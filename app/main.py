
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import engine, Base, get_db
from app import models
from app.honeytoken_service import generate_honeytoken


# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Honeytokens as a Service",
    description="A deceptive credential generation and detection platform",
    version="1.0.0"
)


class HoneytokenRequest(BaseModel):
    name: str
    token_type: str


@app.get("/")
def home():
    return {
        "message": "Honeytokens backend is running!"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/honeytokens")
def create_token(
    request: HoneytokenRequest,
    db: Session = Depends(get_db)
):
    return generate_honeytoken(
        db,
        request.name,
        request.token_type
    )
from fastapi import Request
from app.detection import detect_honeytoken_usage
from app.models import Alert

