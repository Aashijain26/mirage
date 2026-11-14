
import secrets
import hashlib

from app.models import Honeytoken


def generate_honeytoken(db, name, token_type):

    # Generate a unique random fake credential
    raw_token = "honey_" + secrets.token_urlsafe(32)

    # Hash the token before storing it
    token_hash = hashlib.sha256(
        raw_token.encode()
    ).hexdigest()

    new_token = Honeytoken(
        name=name,
        token_hash=token_hash,
        token_type=token_type
    )

    db.add(new_token)
    db.commit()
    db.refresh(new_token)

    # Return the original token only once
    return {
        "id": new_token.id,
        "name": new_token.name,
        "token_type": new_token.token_type,
        "token": raw_token,
        "message": "Honeytoken generated successfully"
    }
