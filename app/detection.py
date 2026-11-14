"""
Honeytoken Detection & Incident Correlation Engine for the Snare platform.

HARD CONTRACT RULES:
1. Event is persisted to database BEFORE optional operations (enrichment, alerting, LLM).
   External service failures NEVER prevent recording the security event.
2. Group events by source IP into rolling 10-minute incidents.
   - Reuse open incident if last_seen is within 10 minutes; otherwise create a new incident.
   - Update event_count, last_seen, flags, and incident score.
   - Incident score = max(incident.score, event.score).
   - Multi-token probing detected across 10-minute history; +25 bonus applied exactly once.
   - Incident severity rank must never decrease automatically.
3. Alerting decision via should_alert(prev, new):
   - Triggers Telegram alert on new incident or severity escalation.
4. Preserves historical events when honeytokens are revoked; never deletes records.
5. Thread-safe incident correlation with graceful handling of pending database schema migrations.
"""

import hashlib
import logging
import re
import threading
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from app.models import Honeytoken, Alert, Event
import app.models as models
from app.intel.enrichment import enrich
from app.intel.scoring import score
from app.intel.alerting import should_alert
from app.alerts import send_alert
from app.intel.sanitize import sanitize_untrusted_text, redact_secrets, sanitize_headers

logger = logging.getLogger(__name__)

# Severity hierarchy for rank comparison
SEVERITY_RANKS = {"low": 1, "medium": 2, "high": 3}

# In-memory incident store fallback when database table is not yet migrated
# Key: source_ip -> Incident Dictionary
_INCIDENT_LOCK = threading.Lock()
_ACTIVE_INCIDENTS: Dict[str, Dict[str, Any]] = {}
_INCIDENT_COUNTER: int = 1000


def _parse_dt(val: Any) -> datetime:
    """Parse datetime or ISO string to timezone-aware UTC datetime."""
    if isinstance(val, datetime):
        return val if val.tzinfo else val.replace(tzinfo=timezone.utc)
    if isinstance(val, str) and val.strip():
        try:
            cleaned = val.strip().replace("Z", "+00:00")
            dt = datetime.fromisoformat(cleaned)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    return datetime.now(timezone.utc)


def token_database_id(token_ref: str) -> Optional[int]:
    """Resolve a public token identifier or AKIA access key to its record id."""
    value = str(token_ref or "")
    if value.startswith("AKIA") and len(value) == 20 and re.fullmatch(r"[0-9A-Z]{16}", value[4:]):
        return int(value[4:], 36)
    match = re.fullmatch(r"(?:tok-[a-z0-9_-]+-|)(\d+)", value, re.IGNORECASE)
    return int(match.group(1)) if match else None


def detect_honeytoken_usage(
    db,
    raw_token: Optional[str] = None,
    source_ip: Optional[str] = None,
    user_agent: Optional[str] = None,
    path: Optional[str] = None,
    method: str = "GET",
    headers: Optional[Dict[str, Any]] = None,
    token_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Detect honeytoken access, record forensic telemetry, correlate incidents, and alert.

    Args:
        db: SQLAlchemy database session.
        raw_token: The plaintext honeytoken string or key ID tested by the adversary.
        source_ip: Remote attacker IP address.
        user_agent: Attacker User-Agent string.
        path: Target request path (e.g. /s3/list-buckets).
        method: HTTP method.
        headers: Optional dictionary of request headers.

    Returns:
        Dict containing detection status, alert ID, incident summary, and score.
    """
    global _INCIDENT_COUNTER

    if token_id:
        token_pk = token_database_id(token_id)
        honeytoken = db.query(Honeytoken).filter(
            Honeytoken.id == token_pk,
            Honeytoken.is_active.is_(True),
        ).first() if token_pk is not None else None
    elif not raw_token or not isinstance(raw_token, str):
        return {
            "detected": False,
            "message": "Empty or invalid token parameter"
        }
    else:
        # Hash the submitted token for lookup
        submitted_hash = hashlib.sha256(raw_token.strip().encode()).hexdigest()

        # Find matching active honeytoken in database
        honeytoken = db.query(Honeytoken).filter(
            Honeytoken.token_hash == submitted_hash,
            Honeytoken.is_active.is_(True)
        ).first()

    # No matching active token found
    if not honeytoken:
        return {
            "detected": False,
            "message": "No matching honeytoken found"
        }

    # 1. Sanitize untrusted attacker inputs
    clean_ip = sanitize_untrusted_text(source_ip or "Unknown", max_length=64)
    clean_ua = sanitize_untrusted_text(user_agent or "", max_length=500)
    clean_path = sanitize_untrusted_text(path or "/", max_length=255)
    clean_method = sanitize_untrusted_text(method or "GET", max_length=10).upper()
    clean_headers = sanitize_headers(headers)

    now_utc = datetime.now(timezone.utc)

    # 2. STEP 3: PERSIST FORENSIC EVENT FIRST
    # Guarantees that the event is committed to the database before any external operations
    alert = Alert(
        honeytoken_id=honeytoken.id,
        event_type="HONEYTOKEN_TRIGGERED",
        source_ip=clean_ip,
        user_agent=clean_ua
    )

    # If the extended schema columns exist on Alert model, populate them
    if hasattr(Alert, "token_id"):
        setattr(alert, "token_id", getattr(honeytoken, "token_id", f"tok-{honeytoken.id}"))
    if hasattr(Alert, "path"):
        setattr(alert, "path", clean_path)
    if hasattr(Alert, "method"):
        setattr(alert, "method", clean_method)
    if hasattr(Alert, "headers"):
        setattr(alert, "headers", clean_headers)

    db.add(alert)
    db.commit()
    db.refresh(alert)

    # Persist a dashboard event in the same first-write stage as the alert.
    public_token_id = f"tok-{honeytoken.token_type}-{honeytoken.id}"
    event_record = Event(
        honeytoken_id=honeytoken.id,
        token_id=public_token_id,
        event_type="HONEYTOKEN_TRIGGERED",
        ip=clean_ip,
        ua=clean_ua,
        path=clean_path,
        method=clean_method,
        headers=clean_headers,
        geo={},
        score=40,
        severity="low",
        flags=[],
        created_at=now_utc,
    )
    db.add(event_record)
    db.commit()
    db.refresh(event_record)

    # 3. STEP 4: ENRICH IP (Failure fallback; never crashes or blocks persistence)
    geo_data: Dict[str, Any] = {}
    try:
        geo_data = enrich(clean_ip)
    except Exception as exc:
        logger.warning("Enrichment failed in detection pipeline for %s: %s", clean_ip, exc)
        geo_data = {"country": "Unknown", "city": "Unknown", "proxy": False, "hosting": False}

    # 4. STEP 5: MULTI-TOKEN PROBING & EVENT SCORING
    # Query past 10 minutes of alerts from this source IP to check multi-token probe and burst history
    cutoff_time = now_utc - timedelta(minutes=10)
    history_records: List[Dict[str, Any]] = []

    try:
        past_alerts = db.query(Alert).filter(
            Alert.source_ip == clean_ip,
            Alert.created_at >= cutoff_time,
            Alert.id != alert.id,
        ).all()

        # Include this request's token once; history contains only prior requests.
        distinct_token_ids = {honeytoken.id}
        for pa in past_alerts:
            distinct_token_ids.add(pa.honeytoken_id)
            history_records.append({
                "id": pa.id,
                "token_id": pa.honeytoken_id,
                "ip": pa.source_ip,
                "ua": pa.user_agent,
                "ts": pa.created_at.isoformat() if pa.created_at else now_utc.isoformat()
            })

        is_multi_token = len(distinct_token_ids) >= 2
    except Exception as exc:
        logger.warning("Could not query alert history for IP %s: %s", clean_ip, exc)
        is_multi_token = False

    event_payload = {
        "id": event_record.id,
        "token_id": public_token_id,
        "honeytoken_id": honeytoken.id,
        "ip": clean_ip,
        "ua": clean_ua,
        "path": clean_path,
        "method": clean_method,
        "headers": clean_headers,
        "geo": geo_data,
        "ts": alert.created_at.isoformat() if alert.created_at else now_utc.isoformat(),
    }

    # Deterministic event scoring
    scored_event = score(event_payload, history=history_records, is_multi_token=is_multi_token)
    event_score = scored_event["score"]
    event_severity = scored_event["severity"]
    event_flags = scored_event["flags"]

    event_payload["score"] = event_score
    event_payload["severity"] = event_severity
    event_payload["flags"] = event_flags
    event_record.geo = geo_data
    event_record.score = event_score
    event_record.severity = event_severity
    event_record.flags = event_flags
    db.commit()

    # 5. STEP 6: CORRELATE OR CREATE INCIDENT (Rolling 10-Minute Window by IP)
    prev_incident_data: Optional[Dict[str, Any]] = None
    updated_incident_data: Dict[str, Any] = {}

    with _INCIDENT_LOCK:
        # Check if database has an Incident model
        IncidentModel = getattr(models, "Incident", None)

        if IncidentModel is not None:
            try:
                # Query open incident for this IP
                db_incident = db.query(IncidentModel).filter(
                    IncidentModel.ip == clean_ip,
                    IncidentModel.status == "open"
                ).order_by(IncidentModel.id.desc()).first()

                if db_incident:
                    inc_last_seen = _parse_dt(db_incident.last_seen)
                    if (now_utc - inc_last_seen).total_seconds() <= 600:
                        # Existing rolling incident found
                        prev_incident_data = {
                            "id": db_incident.id,
                            "ip": db_incident.ip,
                            "score": db_incident.score,
                            "severity": db_incident.severity,
                            "flags": list(db_incident.flags or []),
                            "event_count": db_incident.event_count,
                        }

                        # Update incident attributes
                        db_incident.event_count += 1
                        db_incident.last_seen = now_utc
                        db_incident.geo = geo_data
                        db_incident.score = max(db_incident.score, event_score)

                        # Merge and deduplicate flags
                        merged_flags = sorted(list(set(db_incident.flags or []) | set(event_flags)))
                        db_incident.flags = merged_flags

                        # Ensure severity rank never decreases
                        if SEVERITY_RANKS.get(event_severity, 1) > SEVERITY_RANKS.get(db_incident.severity, 1):
                            db_incident.severity = event_severity

                        # Link alert to persistent incident if schema allows
                        if hasattr(Alert, "incident_id"):
                            setattr(alert, "incident_id", db_incident.id)
                        if hasattr(Alert, "score"):
                            setattr(alert, "score", event_score)
                        if hasattr(Alert, "severity"):
                            setattr(alert, "severity", event_severity)
                        if hasattr(Alert, "flags"):
                            setattr(alert, "flags", event_flags)
                        if hasattr(Alert, "geo"):
                            setattr(alert, "geo", geo_data)

                        db.commit()
                        db.refresh(db_incident)
                        event_record.incident_id = db_incident.id
                        db.commit()

                        updated_incident_data = {
                            "id": db_incident.id,
                            "ip": db_incident.ip,
                            "status": db_incident.status,
                            "score": db_incident.score,
                            "severity": db_incident.severity,
                            "flags": db_incident.flags,
                            "event_count": db_incident.event_count,
                            "geo": geo_data,
                            "first_seen": db_incident.first_seen.isoformat() if db_incident.first_seen else now_utc.isoformat(),
                            "last_seen": db_incident.last_seen.isoformat() if db_incident.last_seen else now_utc.isoformat(),
                        }
                    else:
                        db_incident = None

                if not db_incident:
                    # Create new DB incident
                    new_inc = IncidentModel(
                        ip=clean_ip,
                        status="open",
                        score=event_score,
                        severity=event_severity,
                        flags=event_flags,
                        geo=geo_data,
                        event_count=1,
                        first_seen=now_utc,
                        last_seen=now_utc
                    )
                    db.add(new_inc)
                    db.commit()
                    db.refresh(new_inc)
                    event_record.incident_id = new_inc.id
                    db.commit()

                    # Link alert to persistent incident if schema allows
                    if hasattr(Alert, "incident_id"):
                        setattr(alert, "incident_id", new_inc.id)
                    if hasattr(Alert, "score"):
                        setattr(alert, "score", event_score)
                    if hasattr(Alert, "severity"):
                        setattr(alert, "severity", event_severity)
                    if hasattr(Alert, "flags"):
                        setattr(alert, "flags", event_flags)
                    if hasattr(Alert, "geo"):
                        setattr(alert, "geo", geo_data)
                    db.commit()

                    prev_incident_data = None
                    updated_incident_data = {
                        "id": new_inc.id,
                        "ip": new_inc.ip,
                        "status": new_inc.status,
                        "score": new_inc.score,
                        "severity": new_inc.severity,
                        "flags": new_inc.flags,
                        "event_count": new_inc.event_count,
                        "geo": geo_data,
                        "first_seen": new_inc.first_seen.isoformat(),
                        "last_seen": new_inc.last_seen.isoformat(),
                    }

            except Exception:
                db.rollback()
                logger.exception("Persistent incident correlation failed")
                raise

        if IncidentModel is None:
            # In-memory Incident Tracker
            existing_inc = _ACTIVE_INCIDENTS.get(clean_ip)
            if existing_inc:
                inc_last_seen = _parse_dt(existing_inc["last_seen"])
                if (now_utc - inc_last_seen).total_seconds() <= 600:
                    prev_incident_data = dict(existing_inc)
                    existing_inc["event_count"] += 1
                    existing_inc["last_seen"] = now_utc.isoformat()
                    existing_inc["score"] = max(existing_inc["score"], event_score)
                    existing_inc["flags"] = sorted(list(set(existing_inc["flags"]) | set(event_flags)))

                    # Severity rank must never decrease
                    if SEVERITY_RANKS.get(event_severity, 1) > SEVERITY_RANKS.get(existing_inc["severity"], 1):
                        existing_inc["severity"] = event_severity

                    updated_incident_data = dict(existing_inc)
                else:
                    existing_inc = None

            if not existing_inc:
                _INCIDENT_COUNTER += 1
                new_inc_dict = {
                    "id": _INCIDENT_COUNTER,
                    "ip": clean_ip,
                    "status": "open",
                    "score": event_score,
                    "severity": event_severity,
                    "flags": sorted(list(set(event_flags))),
                    "event_count": 1,
                    "geo": geo_data,
                    "first_seen": now_utc.isoformat(),
                    "last_seen": now_utc.isoformat(),
                }
                _ACTIVE_INCIDENTS[clean_ip] = new_inc_dict
                prev_incident_data = None
                updated_incident_data = dict(new_inc_dict)

    # Attach token label for notifications
    updated_incident_data["token_label"] = honeytoken.name
    updated_incident_data["token_id"] = public_token_id

    # 6. STEP 7: EVALUATE should_alert
    # Trigger only if new incident (prev is None) or severity escalated
    should_dispatch = False
    try:
        should_dispatch = should_alert(prev_incident_data, updated_incident_data)
    except Exception as exc:
        logger.error("Error evaluating should_alert: %s", exc)
        should_dispatch = (prev_incident_data is None)

    # 7. STEP 8: TELEGRAM NOTIFICATION (Failure never disrupts the response)
    if should_dispatch:
        try:
            send_alert(updated_incident_data)
        except Exception as exc:
            logger.error("Failed to send Telegram notification in detection pipeline: %s", exc)

    return {
        "detected": True,
        "message": "Honeytoken usage detected!",
        "alert_id": alert.id,
        "event_id": event_record.id,
        "honeytoken_id": honeytoken.id,
        "score": event_score,
        "severity": event_severity,
        "flags": event_flags,
        "incident": updated_incident_data,
        "event": event_payload
    }


def clear_active_incidents() -> None:
    """Clear in-memory active incidents (for testing purposes)."""
    with _INCIDENT_LOCK:
        _ACTIVE_INCIDENTS.clear()
