"""Bearer-authenticated dashboard API."""

import hmac
import os
import re

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.intel.summarizer import summarize_incident
from app.honeytoken_service import generate_honeytoken, token_public_id
from app.models import Event, Honeytoken, Incident

router = APIRouter(prefix="/admin", tags=["admin"])
bearer = HTTPBearer(auto_error=False)


def require_admin(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    expected = os.getenv("ADMIN_TOKEN", "")
    if not expected:
        raise HTTPException(status_code=503, detail="Admin access is not configured")
    supplied = credentials.credentials if credentials else ""
    if not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin token")
    return True


class TokenCreate(BaseModel):
    type: str = "api_key"
    label: str = Field(min_length=1, max_length=60)
    context: str | None = Field(default=None, max_length=500)


class SummaryRequest(BaseModel):
    event_ids: list[int] = Field(default_factory=list, max_length=500)


def _dt(value):
    return value.isoformat() if value else None


def serialize_event(event):
    return {
        "id": event.id,
        "token_id": event.token_id,
        "honeytoken_id": event.honeytoken_id,
        "incident_id": event.incident_id,
        "event_type": event.event_type,
        "ip": event.ip,
        "geo": event.geo or {},
        "ua": event.ua or "",
        "user_agent": event.ua or "",
        "path": event.path,
        "method": event.method,
        "headers": event.headers or {},
        "ts": _dt(event.created_at),
        "created_at": _dt(event.created_at),
        "score": event.score,
        "severity": event.severity,
        "flags": event.flags or [],
    }


def serialize_incident(incident, events):
    relevant = [event for event in events if event.incident_id == incident.id]
    latest = relevant[-1] if relevant else None
    return {
        "id": incident.id,
        "ip": incident.ip,
        "status": incident.status,
        "score": incident.score,
        "severity": incident.severity,
        "flags": incident.flags or [],
        "geo": incident.geo or {},
        "event_count": incident.event_count,
        "first_seen": _dt(incident.first_seen),
        "last_seen": _dt(incident.last_seen),
        "token_id": latest.token_id if latest else "unknown-token",
        "token_label": None,
        "events": [serialize_event(event) for event in relevant],
    }


@router.post("/auth")
def verify_admin(_: bool = Depends(require_admin)):
    return {"authenticated": True}


@router.get("/events")
def get_events(
    limit: int = 500,
    before_id: int | None = None,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Event)
    if before_id is not None:
        query = query.filter(Event.id < before_id)
    return [serialize_event(event) for event in query.order_by(Event.id.desc()).limit(min(max(limit, 1), 500)).all()]


@router.get("/incidents")
def get_incidents(
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    incidents = db.query(Incident).order_by(Incident.last_seen.desc()).limit(500).all()
    events = db.query(Event).filter(Event.incident_id.in_([item.id for item in incidents])).order_by(Event.created_at.asc()).all() if incidents else []
    return [serialize_incident(item, events) for item in incidents]


@router.post("/incidents/summary")
def summarize_incident(
    body: SummaryRequest,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    events = db.query(Event).filter(Event.id.in_(body.event_ids)).order_by(Event.created_at.asc()).all() if body.event_ids else []
    if not events:
        raise HTTPException(status_code=404, detail="No matching events found")
    peak = max(events, key=lambda item: item.score)
    flags = sorted({flag for event in events for flag in (event.flags or [])})
    summary = summarize_incident({
        "id": peak.incident_id or peak.id,
        "ip": peak.ip,
        "score": peak.score,
        "severity": peak.severity,
        "flags": flags,
        "geo": peak.geo or {},
        "event_count": len(events),
    }, [serialize_event(event) for event in events])
    return {
        **summary,
        "severity": peak.severity,
        "likely_actor": "scripted" if summary.get("behavior") == "scripted_scan" else summary.get("behavior", "unclear"),
    }


@router.get("/tokens")
def get_tokens(
    request: Request,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    tokens = db.query(Honeytoken).order_by(Honeytoken.id.desc()).all()
    base_url = (os.getenv("PUBLIC_BASE_URL") or str(request.base_url)).rstrip("/")
    return [
        {
            "id": token_public_id(token),
            "type": token.token_type,
            "label": token.name,
            "value": {},
            "callback_url": f"{base_url}/t/{token_public_id(token)}/hook",
            "created_at": _dt(token.created_at),
            "revoked": not token.is_active,
        }
        for token in tokens
    ]


@router.post("/tokens")
def create_token(
    body: TokenCreate,
    request: Request,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if not body.label.strip():
        raise HTTPException(status_code=422, detail="Label must not be blank")
    try:
        callback_base_url = os.getenv("PUBLIC_BASE_URL") or str(request.base_url).rstrip("/")
        return generate_honeytoken(db, body.label.strip(), body.type, callback_base_url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.delete("/tokens/{token_id}")
def revoke_token(
    token_id: str,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    match = re.fullmatch(r"tok-[a-z0-9_-]+-(\d+)", token_id, re.IGNORECASE)
    if not match:
        raise HTTPException(status_code=404, detail="Honeytoken not found")
    token = db.query(Honeytoken).filter(Honeytoken.id == int(match.group(1))).first()
    if token is None:
        raise HTTPException(status_code=404, detail="Honeytoken not found")
    token.is_active = False
    db.commit()
    return {"id": token_id, "revoked": True}
