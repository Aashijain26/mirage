"""Add a small, repeatable incident set for the local dashboard demo."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from app.database import Base, SessionLocal, engine, init_db
from app.models import Event, Honeytoken, Incident
from app.honeytoken_service import token_public_id

init_db()

DEMO_TOKENS = [
    ("Demo decoy AWS", "aws"),
    ("Demo decoy API", "api_key"),
    ("Demo decoy database", "db"),
]


def seed_demo():
    db = SessionLocal()
    try:
        tokens = {}
        for name, token_type in DEMO_TOKENS:
            token = db.query(Honeytoken).filter(Honeytoken.name == name).first()
            if token is None:
                token = Honeytoken(
                    name=name,
                    token_type=token_type,
                    token_hash=hashlib.sha256(secrets.token_bytes(32)).hexdigest(),
                    is_active=False,
                )
                db.add(token)
                db.flush()
            tokens[token_type] = token

        if db.query(Event).filter(Event.event_type == "DEMO_SEEDED").first():
            print("Demo incidents already exist; no changes made.")
            return

        now = datetime.now(timezone.utc)
        scenarios = [
            {
                "ip": "198.51.100.41", "tokens": ["aws", "api_key"],
                "score": 100, "severity": "high",
                "flags": ["scripted_ua", "multi_token_probe", "rapid_fire"],
                "ua": "python-requests/2.31.0", "country": "Unknown", "minutes_ago": 4,
            },
            {
                "ip": "203.0.113.27", "tokens": ["db"],
                "score": 60, "severity": "medium", "flags": ["scripted_ua"],
                "ua": "curl/8.1.0", "country": "Unknown", "minutes_ago": 27,
            },
            {
                "ip": "192.0.2.88", "tokens": ["aws"],
                "score": 40, "severity": "low", "flags": [],
                "ua": "Mozilla/5.0 demo browser", "country": "Unknown", "minutes_ago": 63,
            },
        ]

        for scenario in scenarios:
            first_seen = now - timedelta(minutes=scenario["minutes_ago"])
            last_seen = first_seen + timedelta(seconds=max(0, len(scenario["tokens"]) - 1) * 12)
            incident = Incident(
                ip=scenario["ip"], status="open", score=scenario["score"],
                severity=scenario["severity"], flags=scenario["flags"],
                geo={"country": scenario["country"], "city": "", "isp": "", "as": "", "org": "", "proxy": False, "hosting": False},
                event_count=len(scenario["tokens"]), first_seen=first_seen, last_seen=last_seen,
            )
            db.add(incident)
            db.flush()
            for offset, token_type in enumerate(scenario["tokens"]):
                token = tokens[token_type]
                db.add(Event(
                    honeytoken_id=token.id,
                    incident_id=incident.id,
                    token_id=token_public_id(token),
                    event_type="DEMO_SEEDED",
                    ip=scenario["ip"],
                    ua=scenario["ua"],
                    path="/.env" if token_type == "aws" else "/api/health",
                    method="GET",
                    headers={"host": "demo.invalid", "user-agent": scenario["ua"]},
                    geo=incident.geo,
                    score=scenario["score"],
                    severity=scenario["severity"],
                    flags=scenario["flags"],
                    created_at=first_seen + timedelta(seconds=offset * 12),
                ))
        db.commit()
        print("Seeded 3 demo incidents and 4 demo events.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo()
