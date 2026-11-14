
import hashlib

from app.models import Honeytoken, Alert


def detect_honeytoken_usage(
    db,
    raw_token,
    source_ip=None,
    user_agent=None
):
    # Hash the submitted token
    submitted_hash = hashlib.sha256(
        raw_token.encode()
    ).hexdigest()

    # Find matching honeytoken in database
    honeytoken = db.query(Honeytoken).filter(
        Honeytoken.token_hash == submitted_hash,
        Honeytoken.is_active == True
    ).first()

    # No matching token found
    if not honeytoken:
        return {
            "detected": False,
            "message": "No matching honeytoken found"
        }

    # Record suspicious activity
    alert = Alert(
        honeytoken_id=honeytoken.id,
        event_type="HONEYTOKEN_TRIGGERED",
        source_ip=source_ip,
        user_agent=user_agent
    )

    db.add(alert)
    db.commit()

    return {
        "detected": True,
        "message": "Honeytoken usage detected!",
        "alert_id": alert.id,
        "honeytoken_id": honeytoken.id
    }
