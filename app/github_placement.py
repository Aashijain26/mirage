"""One-shot, opt-in planting of a Mirage webhook decoy in a GitHub repository."""

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
from app.models import Honeytoken, PlantedDecoy

logger = logging.getLogger(__name__)
DEFAULT_REPOSITORY = "Aashijain26/mirage"
DEFAULT_PATH = "mirage-decoys/.env"
DEFAULT_INTERVAL_HOURS = 24
GITHUB_API = "https://api.github.com"
_STATUS_LOCK = threading.Lock()
_LAST_RESULT = {"status": "not_run"}


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
