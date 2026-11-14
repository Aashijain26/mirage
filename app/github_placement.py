"""GitHub decoy planting and opt-in secret-scanning alert response."""

import base64
import logging
import os
import re
import threading
from datetime import datetime, timezone
from urllib.parse import quote

import requests
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.honeytoken_service import generate_honeytoken
from app.models import GitHubSecretAlert, Honeytoken, PlantedDecoy

logger = logging.getLogger(__name__)
DEFAULT_REPOSITORY = "Aashijain26/mirage"
DEFAULT_PATH = "mirage-decoys/.env"
DEFAULT_INTERVAL_HOURS = 24
GITHUB_API = "https://api.github.com"
_STATUS_LOCK = threading.Lock()
_LAST_RESULT = {"status": "not_run"}
_LEAK_STATUS_LOCK = threading.Lock()
_LEAK_SCAN_LOCK = threading.Lock()
_LAST_LEAK_RESULT = {"status": "not_run"}


def github_automation_config():
    repository = os.getenv("GITHUB_REPOSITORY", DEFAULT_REPOSITORY).strip()
    path = os.getenv("GITHUB_DECOY_PATH", DEFAULT_PATH).strip().strip("/")
    token = os.getenv("GITHUB_TOKEN", "").strip()
    enabled = os.getenv("AUTO_PLANT_ENABLED", "false").strip().lower() in {"1", "true", "yes", "on"}
    interval = os.getenv("AUTO_PLANT_INTERVAL_HOURS", str(DEFAULT_INTERVAL_HOURS)).strip()
    try:
        interval_hours = max(1, min(int(interval), 168))
    except ValueError:
        interval_hours = DEFAULT_INTERVAL_HOURS
    valid_repo = bool(re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repository))
    valid_path = bool(path) and ".." not in path.split("/") and not path.startswith(".")
    return {
        "enabled": enabled,
        "configured": bool(token and valid_repo and valid_path),
        "repository": repository if valid_repo else "",
        "path": path if valid_path else "",
        "token": token,
        "interval_hours": interval_hours,
    }


def _request_headers(token):
    return {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Mirage-Honeytoken-Monitor",
    }


def _disable_token(db: Session, token_id: int):
    token = db.query(Honeytoken).filter(Honeytoken.id == token_id).first()
    if token:
        token.is_active = False
        db.commit()


def _run_auto_plant_once(db: Session | None = None):
    """Plant one decoy if enabled; safe to call repeatedly and on app restarts."""
    config = github_automation_config()
    if not config["enabled"]:
        return {"status": "disabled"}
    if not config["configured"]:
        return {"status": "needs_configuration"}

    own_session = db is None
    session = db or SessionLocal()
    token_record = None
    try:
        existing = session.query(PlantedDecoy).filter(
            PlantedDecoy.host == f"github:{config['repository']}",
            PlantedDecoy.path == config["path"],
            PlantedDecoy.is_active.is_(True),
        ).first()
        if existing:
            return {"status": "already_planted", "decoy_id": existing.id,
                    "repository": config["repository"], "path": config["path"]}

        contents_url = (
            f"{GITHUB_API}/repos/{quote(config['repository'], safe='/')}/contents/"
            f"{quote(config['path'], safe='/')}"
        )
        headers = _request_headers(config["token"])
        check = requests.get(contents_url, headers=headers, timeout=15)
        if check.status_code == 200:
            return {"status": "path_exists", "repository": config["repository"], "path": config["path"]}
        if check.status_code != 404:
            raise RuntimeError(f"GitHub could not check the decoy path (HTTP {check.status_code})")

        base_url = os.getenv("PUBLIC_BASE_URL", "").strip().rstrip("/")
        if not base_url.startswith("https://"):
            return {"status": "needs_public_https_url"}

        created = generate_honeytoken(
            session,
            name=f"Auto planted GitHub decoy ({config['repository']})",
            token_type="webhook",
            callback_base_url=base_url,
            context=f"Automatically planted in {config['repository']}:{config['path']}",
        )
        token_id = int(created["id"].rsplit("-", 1)[1])
        token_record = session.query(Honeytoken).filter(Honeytoken.id == token_id).first()
        if token_record is None:
            raise RuntimeError("Generated token record could not be reloaded")

        content = (
            "# Staging deployment integration settings. Rotate after the migration.\n"
            f"PARTNER_API_KEY={created['value']}\n"
            f"DEPLOYMENT_WEBHOOK_URL={created['callback_url']}\n"
        )
        response = requests.put(
            contents_url,
            headers=headers,
            json={
                "message": "Add automated Mirage decoy credential",
                "content": base64.b64encode(content.encode("utf-8")).decode("ascii"),
            },
            timeout=15,
        )
        if response.status_code != 201:
            _disable_token(session, token_id)
            result_status = "path_exists" if response.status_code == 422 else "github_write_failed"
            logger.error("GitHub decoy write failed (HTTP %s)", response.status_code)
            return {"status": result_status, "repository": config["repository"], "path": config["path"]}

        decoy = PlantedDecoy(
            honeytoken_id=token_id,
            decoy_type="env",
            label="Automated GitHub webhook decoy",
            host=f"github:{config['repository']}",
            path=config["path"],
        )
        session.add(decoy)
        session.commit()
        logger.info("Automatically planted Mirage decoy in %s:%s", config["repository"], config["path"])
        return {"status": "planted", "decoy_id": decoy.id,
                "repository": config["repository"], "path": config["path"]}
    except requests.RequestException:
        if token_record:
            _disable_token(session, token_record.id)
        logger.exception("GitHub automation request failed")
        return {"status": "github_unavailable"}
    except Exception:
        if token_record:
            _disable_token(session, token_record.id)
        logger.exception("GitHub decoy automation failed")
        return {"status": "failed"}
    finally:
        if own_session:
            session.close()


def get_last_automation_result():
    with _STATUS_LOCK:
        return dict(_LAST_RESULT)


def run_auto_plant_once(db: Session | None = None):
    global _LAST_RESULT
    result = _run_auto_plant_once(db)
    with _STATUS_LOCK:
        _LAST_RESULT = {**result, "checked_at": datetime.now(timezone.utc).isoformat()}
    return result


def github_leak_response_config():
    """Configuration for scanning one explicitly selected repository."""
    repository = os.getenv("GITHUB_REPOSITORY", DEFAULT_REPOSITORY).strip()
    token = os.getenv("GITHUB_TOKEN", "").strip()
    enabled = os.getenv("GITHUB_LEAK_RESPONSE_ENABLED", "false").strip().lower() in {"1", "true", "yes", "on"}
    interval = os.getenv("GITHUB_ALERT_POLL_INTERVAL_SECONDS", "60").strip()
    try:
        poll_interval = min(max(int(interval), 30), 3600)
    except ValueError:
        poll_interval = 60
    valid_repo = bool(re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repository))
    return {
        "enabled": enabled,
        "configured": bool(token and valid_repo),
        "repository": repository if valid_repo else "",
        "token": token,
        "poll_interval_seconds": poll_interval,
    }


def get_last_leak_scan_result():
    with _LEAK_STATUS_LOCK:
        return dict(_LAST_LEAK_RESULT)


def _alert_type_slug(secret_type):
    return re.sub(r"[^a-z0-9-]+", "-", (secret_type or "generic").lower()).strip("-")[:64] or "generic"


def _alert_decoy_type(secret_type):
    normalized = (secret_type or "").lower()
    if "aws" in normalized:
        return "aws", "aws"
    if any(part in normalized for part in ("database", "postgres", "mysql", "mongodb")):
        return "database", "db"
    if "github" in normalized:
        return "github", "api_key"
    if "webhook" in normalized:
        return "webhook", "webhook"
    return "generic", "api_key"


def _write_alert_decoy(session: Session, config, alert, source_path=None, source_line=None, is_demo=False, notify=True):
    """Create exactly one decoy for a source alert, then plant it in GitHub."""
    repository = config["repository"]
    alert_number = str(alert.get("number") or "").strip()
    secret_type = str(alert.get("secret_type") or "generic").strip()[:120]
    if not alert_number:
        return {"status": "invalid_alert"}

    existing = session.query(GitHubSecretAlert).filter_by(
        repository=repository, alert_number=alert_number
    ).first()
    if existing:
        return {"status": "duplicate_alert", "alert_number": alert_number,
                "decoy_id": existing.id, "decoy_path": existing.decoy_path,
                "placement_status": existing.status}

    base_url = os.getenv("PUBLIC_BASE_URL", "").strip().rstrip("/")
    if not base_url.startswith("https://"):
        return {"status": "needs_public_https_url"}

    decoy_type, token_type = _alert_decoy_type(secret_type)
    slug = _alert_type_slug(secret_type)
    safe_number = re.sub(r"[^A-Za-z0-9_-]+", "-", alert_number)[:80]
    decoy_path = f"mirage-decoys/leak-alerts/{safe_number}-{slug}.env"
    content_url = f"{GITHUB_API}/repos/{quote(repository, safe='/')}/contents/{quote(decoy_path, safe='/')}"
    headers = _request_headers(config["token"])

    # A deterministic path ensures a retry cannot silently create a second file.
    check = requests.get(content_url, headers=headers, timeout=15)
    if check.status_code == 200:
        return {"status": "path_exists", "alert_number": alert_number, "decoy_path": decoy_path}
    if check.status_code != 404:
        return {"status": "github_read_failed", "http_status": check.status_code}

    source_path = str(source_path or "unknown")[:500].replace("\r", " ").replace("\n", " ")
    try:
        secret = generate_honeytoken(
            session,
            name=f"GitHub {secret_type} decoy for alert {alert_number}",
            token_type=token_type,
            callback_base_url=base_url,
            context=f"GitHub alert {alert_number} in {repository}:{source_path}",
            commit=False,
        )
        token_id = int(secret["id"].rsplit("-", 1)[1])
        decoy = PlantedDecoy(
            honeytoken_id=token_id,
            decoy_type=decoy_type,
            label=f"GitHub leak response: {secret_type}",
            host=f"github:{repository}",
            path=decoy_path,
        )
        alert_row = GitHubSecretAlert(
            repository=repository,
            alert_number=alert_number,
            secret_type=secret_type,
            source_path=source_path,
            source_line=source_line if isinstance(source_line, int) else None,
            alert_url=str(alert.get("html_url") or "")[:1000] or None,
            honeytoken_id=token_id,
            decoy_path=decoy_path,
            status="pending",
            is_demo=is_demo,
        )
        session.add(decoy)
        session.add(alert_row)
        session.commit()
    except Exception:
        session.rollback()
        # Another worker may have won the unique repository/alert-number race.
        duplicate = session.query(GitHubSecretAlert).filter_by(
            repository=repository, alert_number=alert_number
        ).first()
        if duplicate:
            return {"status": "duplicate_alert", "alert_number": alert_number,
                    "decoy_path": duplicate.decoy_path, "placement_status": duplicate.status}
        logger.exception("Could not save GitHub secret-alert mapping")
        return {"status": "database_write_failed", "alert_number": alert_number}

    # Do not put the detected source secret into the decoy file, database, or logs.
    lines = [
        "# Mirage generated a controlled decoy for security monitoring.",
        f"# Source repository: {repository}",
        f"# Source alert: {alert_number}",
        f"# Detected type: {secret_type}",
        f"# Source file: {source_path}",
    ]
    if source_line:
        lines.append(f"# Source line: {source_line}")
    if isinstance(secret["value"], dict):
        lines.extend(f"{key}={value}" for key, value in secret["value"].items())
    else:
        key_name = "GITHUB_TOKEN" if decoy_type == "github" else "PARTNER_API_KEY"
        lines.append(f"{key_name}={secret['value']}")
        lines.append(f"DEPLOYMENT_WEBHOOK_URL={secret['callback_url']}")
    try:
        response = requests.put(
            content_url,
            headers=headers,
            json={
                "message": f"Plant Mirage decoy for GitHub alert {alert_number}",
                "content": base64.b64encode(("\n".join(lines) + "\n").encode("utf-8")).decode("ascii"),
            },
            timeout=20,
        )
        write_succeeded = response.status_code == 201
        if not write_succeeded:
            logger.warning("GitHub decoy write failed for alert %s (HTTP %s)", alert_number, response.status_code)
    except requests.RequestException:
        write_succeeded = False
        logger.exception("GitHub decoy write request failed for alert %s", alert_number)

    alert_row.status = "planted" if write_succeeded else "failed"
    if alert_row.status != "planted":
        decoy.is_active = False
        token = session.query(Honeytoken).filter_by(id=token_id).first()
        if token:
            token.is_active = False
    session.commit()

    if alert_row.status == "planted" and notify:
        try:
            from app.alerts import send_leak_alerts
            send_leak_alerts([{
                "repository": repository,
                "alert_number": alert_number,
                "secret_type": secret_type,
                "source_path": source_path,
                "source_line": source_line,
                "alert_url": alert_row.alert_url,
                "decoy_path": decoy_path,
                "is_demo": is_demo,
            }])
        except Exception:
            logger.exception("Failed to send GitHub leak alert notification")
    return {"status": alert_row.status, "alert_number": alert_number,
            "repository": repository, "secret_type": secret_type,
            "source_path": source_path, "source_line": source_line,
            "decoy_id": decoy.id, "decoy_path": decoy_path,
            "callback_url": secret["callback_url"], "is_demo": is_demo}


def _location_for_alert(config, alert_number):
    url = f"{GITHUB_API}/repos/{quote(config['repository'], safe='/')}/secret-scanning/alerts/{quote(str(alert_number), safe='')}/locations"
    response = requests.get(url, headers=_request_headers(config["token"]), params={"per_page": 1}, timeout=15)
    if response.status_code != 200:
        return None, None
    locations = response.json()
    if not isinstance(locations, list) or not locations:
        return None, None
    location = locations[0]
    return location.get("path"), location.get("start_line")


def _poll_secret_alerts(db):
    config = github_leak_response_config()
    if not config["enabled"]:
        return {"status": "disabled", "processed": 0}
    if not config["configured"]:
        return {"status": "needs_configuration", "processed": 0}
    url = f"{GITHUB_API}/repos/{quote(config['repository'], safe='/')}/secret-scanning/alerts"
    response = requests.get(
        url,
        headers=_request_headers(config["token"]),
        params={"state": "open", "per_page": 100, "hide_secret": "true"},
        timeout=20,
    )
    if response.status_code != 200:
        logger.warning("GitHub secret-alert polling failed (HTTP %s)", response.status_code)
        return {"status": "github_api_error", "http_status": response.status_code, "processed": 0}
    alerts = response.json()
    if not isinstance(alerts, list):
        return {"status": "invalid_github_response", "processed": 0}

    results = []
    for alert in alerts:
        if not isinstance(alert, dict) or not alert.get("number"):
            continue
        existing = db.query(GitHubSecretAlert).filter_by(
            repository=config["repository"], alert_number=str(alert["number"])
        ).first()
        if existing:
            continue
        try:
            source_path, source_line = _location_for_alert(config, alert["number"])
            # Do not recursively respond to credentials Mirage itself planted.
            if source_path and source_path.strip("/").startswith("mirage-decoys/"):
                results.append({"status": "ignored_mirage_decoy", "alert_number": str(alert["number"])})
                continue
            results.append(_write_alert_decoy(db, config, alert, source_path, source_line, notify=False))
        except requests.RequestException:
            logger.exception("GitHub alert details request failed for alert %s", alert.get("number"))
            results.append({"status": "github_unavailable", "alert_number": str(alert["number"])})
    planted = [item for item in results if item.get("status") == "planted"]
    if planted:
        from app.alerts import send_leak_alerts
        send_leak_alerts(planted)
    return {"status": "checked", "repository": config["repository"],
            "processed": len(results), "results": results}


def poll_github_secret_alerts_once(db: Session | None = None):
    """Poll only the configured owned repository; duplicate alert IDs are ignored."""
    global _LAST_LEAK_RESULT
    config = github_leak_response_config()
    if not _LEAK_SCAN_LOCK.acquire(blocking=False):
        return {"status": "already_running", "processed": 0}
    own_session = db is None
    session = db or SessionLocal()
    try:
        result = _poll_secret_alerts(session)
    except requests.RequestException:
        logger.exception("GitHub secret-alert polling request failed")
        result = {"status": "github_unavailable", "processed": 0}
    except Exception:
        logger.exception("GitHub secret-alert polling failed")
        result = {"status": "failed", "processed": 0}
    finally:
        if own_session:
            session.close()
        _LEAK_SCAN_LOCK.release()
    with _LEAK_STATUS_LOCK:
        _LAST_LEAK_RESULT = {**result, "checked_at": datetime.now(timezone.utc).isoformat()}
    return result
