
import secrets
import hashlib
import os
import string

from app.models import Honeytoken


def _base36(value):
    alphabet = string.digits + string.ascii_uppercase
    output = "0"
    if value:
        parts = []
        while value:
            value, remainder = divmod(value, 36)
            parts.append(alphabet[remainder])
        output = "".join(reversed(parts))
    if len(output) > 16:
        raise ValueError("Honeytoken ID exceeds the supported AWS key format")
    return output.zfill(16)


def token_public_id(token):
    return f"tok-{token.token_type}-{token.id}"


def generate_honeytoken(db, name, token_type, callback_base_url=None):
    token_type = (token_type or "api_key").lower()
    if token_type not in {"aws", "api_key", "db", "webhook"}:
        raise ValueError("Unsupported honeytoken type")

    record = Honeytoken(name=name, token_hash="pending", token_type=token_type)
    db.add(record)
    db.flush()
    public_id = token_public_id(record)
    if token_type == "aws":
        access_key = "AKIA" + _base36(record.id)
        secret_key = secrets.token_urlsafe(30)[:40]
        raw_token = access_key
        value = {"AWS_ACCESS_KEY_ID": access_key, "AWS_SECRET_ACCESS_KEY": secret_key}
    else:
        raw_token = "snare_" + secrets.token_urlsafe(32)
        value = raw_token

    record.token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    db.commit()
    db.refresh(record)
    base_url = (callback_base_url or os.getenv("PUBLIC_BASE_URL") or "http://localhost:8000").rstrip("/")
    callback_url = f"{base_url}/t/{public_id}/hook"
    if token_type == "aws":
        value["AWS_ENDPOINT_URL"] = f"{base_url}/aws/{public_id}"
    return {
        "id": public_id,
        "type": token_type,
        "label": record.name,
        "value": value,
        "callback_url": callback_url,
        "created_at": record.created_at.isoformat() if record.created_at else None,
        "revoked": False,
        "message": "Honeytoken generated successfully",
    }
