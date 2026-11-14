"""Bearer-authenticated dashboard API."""

import hmac
import os
import re

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.github_placement import get_last_automation_result, github_automation_config, run_auto_plant_once
from app.intel.summarizer import summarize_incident as run_summarize_incident
from app.intel.decoys import generate_decoys as run_generate_decoys
from app.honeytoken_service import generate_honeytoken, token_public_id
from app.models import Event, Honeytoken, Incident, PlantedDecoy

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


class DecoyRequest(BaseModel):
    type: str = Field(min_length=1, max_length=30)
    label: str = Field(min_length=1, max_length=120)
    host: str = Field(default="web-server-01", max_length=255)
    path: str = Field(min_length=1, max_length=500)


class DecoySuggestionsRequest(BaseModel):
    stack: str = Field(default="", max_length=500)
    token_types: list[str] = Field(default_factory=lambda: ["aws", "api_key"], max_length=10)


def _dt(value):
    return value.isoformat() if value else None


def serialize_event(event, token_map=None):
    token = (token_map or {}).get(event.honeytoken_id)
    return {
        "id": event.id,
        "token_id": event.token_id,
        "token_label": token.name if token else None,
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


def serialize_incident(incident, events, token_map=None):
    relevant = [event for event in events if event.incident_id == incident.id]
    latest = relevant[-1] if relevant else None
    token_id = latest.token_id if latest else "unknown-token"
    # Resolve human-readable label from the honeytoken table
    token_label = None
    if token_map and latest:
        ht = token_map.get(latest.honeytoken_id)
        if ht:
            token_label = ht.name
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
        "token_id": token_id,
        "token_label": token_label,
        "events": [serialize_event(event, token_map) for event in relevant],
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
    rows = query.order_by(Event.id.desc()).limit(min(max(limit, 1), 500)).all()
    token_ids = {event.honeytoken_id for event in rows}
    token_map = {token.id: token for token in db.query(Honeytoken).filter(Honeytoken.id.in_(token_ids)).all()} if token_ids else {}
    return [serialize_event(event, token_map) for event in rows]


@router.get("/incidents")
def get_incidents(
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    incidents = db.query(Incident).order_by(Incident.last_seen.desc()).limit(500).all()
    events = db.query(Event).filter(Event.incident_id.in_([item.id for item in incidents])).order_by(Event.created_at.asc()).all() if incidents else []
    # Build a map of honeytoken_id -> Honeytoken for label resolution
    ht_ids = {e.honeytoken_id for e in events}
    token_map = {}
    if ht_ids:
        tokens = db.query(Honeytoken).filter(Honeytoken.id.in_(ht_ids)).all()
        token_map = {t.id: t for t in tokens}
    return [serialize_incident(item, events, token_map) for item in incidents]


@router.post("/incidents/summary")
def get_incident_summary(
    body: SummaryRequest,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    events = db.query(Event).filter(Event.id.in_(body.event_ids)).order_by(Event.created_at.asc()).all() if body.event_ids else []
    if not events:
        raise HTTPException(status_code=404, detail="No matching events found")
    peak = max(events, key=lambda item: item.score)
    flags = sorted({flag for event in events for flag in (event.flags or [])})
    summary = run_summarize_incident({
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
            "context": token.context,
            "hits": db.query(Event).filter(Event.honeytoken_id == token.id).count(),
            "last_hit": _dt(db.query(Event.created_at).filter(Event.honeytoken_id == token.id).order_by(Event.created_at.desc()).limit(1).scalar()),
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
        return generate_honeytoken(db, body.label.strip(), body.type, callback_base_url, body.context)
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


@router.get("/decoys")
def list_decoys(
    request: Request,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    rows = db.query(PlantedDecoy).order_by(PlantedDecoy.id.desc()).limit(500).all()
    result = []
    for row in rows:
        token = db.query(Honeytoken).filter(Honeytoken.id == row.honeytoken_id).first()
        if token is None:
            continue
        hits = db.query(Event).filter(Event.honeytoken_id == token.id).count()
        last_hit = db.query(Event.created_at).filter(Event.honeytoken_id == token.id).order_by(Event.created_at.desc()).limit(1).scalar()
        base_url = (os.getenv("PUBLIC_BASE_URL") or str(request.base_url)).rstrip("/")
        effectively_active = row.is_active and token.is_active
        result.append({"id": row.id, "honeytoken_id": token_public_id(token), "type": row.decoy_type,
                       "badge": row.decoy_type.upper(), "label": row.label, "host": row.host,
                       "path": row.path, "status": "Triggered" if hits else ("Untouched" if effectively_active else "Revoked"),
                       "hits": hits, "last_hit": _dt(last_hit), "active": effectively_active,
                       "callback_url": f"{base_url}/t/{token_public_id(token)}/hook"})
    return result


@router.post("/decoys")
def create_decoy(
    body: DecoyRequest,
    request: Request,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    decoy_type = body.type.strip().lower()
    if decoy_type not in {"ssh", "env", "db", "backup"}:
        raise HTTPException(status_code=422, detail="Unsupported decoy type")
    label = body.label.strip()
    host = body.host.strip()
    path = body.path.strip()
    if not label or not host or not path:
        raise HTTPException(status_code=422, detail="Label, host, and path must not be blank")
    token_type = {"ssh": "api_key", "env": "api_key", "db": "db", "backup": "webhook"}[decoy_type]
    try:
        base_url = os.getenv("PUBLIC_BASE_URL") or str(request.base_url).rstrip("/")
        secret = generate_honeytoken(db, label, token_type, base_url, f"{host}:{path}")
        row = PlantedDecoy(honeytoken_id=int(secret["id"].rsplit("-", 1)[1]), decoy_type=decoy_type,
                           label=label, host=host, path=path)
        db.add(row)
        db.commit()
        db.refresh(row)
        return {"id": row.id, "type": row.decoy_type, "label": row.label, "host": row.host,
                "path": row.path, "honeytoken_id": secret["id"], "callback_url": secret["callback_url"],
                "value": secret["value"], "message": "Plant this decoy content; the credential is shown only once."}
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.delete("/decoys/{decoy_id}")
def revoke_decoy(
    decoy_id: int,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    row = db.query(PlantedDecoy).filter(PlantedDecoy.id == decoy_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Decoy not found")
    row.is_active = False
    token = db.query(Honeytoken).filter(Honeytoken.id == row.honeytoken_id).first()
    if token:
        token.is_active = False
    db.commit()
    return {"id": decoy_id, "active": False}


@router.post("/decoys/suggestions")
def get_decoy_suggestions(
    body: DecoySuggestionsRequest,
    _: bool = Depends(require_admin),
):
    return run_generate_decoys(body.stack, body.token_types)


@router.get("/automation/status")
def automation_status(
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    config = github_automation_config()
    planted = None
    if config["configured"]:
        planted = db.query(PlantedDecoy).filter(
            PlantedDecoy.host == f"github:{config['repository']}",
            PlantedDecoy.path == config["path"],
            PlantedDecoy.is_active.is_(True),
        ).first()
    if not config["enabled"]:
        status_text = "disabled"
    elif not config["configured"]:
        status_text = "needs_configuration"
    elif not os.getenv("PUBLIC_BASE_URL", "").startswith("https://"):
        status_text = "needs_public_https_url"
    else:
        status_text = "planted" if planted else "waiting_to_plant"
    last_run = get_last_automation_result()
    if not planted and last_run.get("status") not in {"not_run", "disabled", "already_planted"}:
        status_text = last_run["status"]
    return {
        "provider": "github",
        "status": status_text,
        "enabled": config["enabled"],
        "configured": config["configured"],
        "repository": config["repository"],
        "path": config["path"],
        "interval_hours": config["interval_hours"],
        "last_run": last_run.get("checked_at"),
    }


@router.post("/automation/run")
def run_automation_now(
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Run a single placement attempt for setup and diagnostics."""
    return run_auto_plant_once(db)
