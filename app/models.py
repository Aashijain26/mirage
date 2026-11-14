
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.database import Base


class Honeytoken(Base):
    __tablename__ = "honeytokens"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    token_hash = Column(String, unique=True, nullable=False)
    token_type = Column(String, nullable=False)
    context = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    honeytoken_id = Column(Integer, ForeignKey("honeytokens.id"))
    event_type = Column(String, nullable=False)
    source_ip = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, default="open", index=True)
    score = Column(Integer, nullable=False, default=40)
    severity = Column(String, nullable=False, default="low")
    flags = Column(JSON, nullable=False, default=list)
    geo = Column(JSON, nullable=False, default=dict)
    event_count = Column(Integer, nullable=False, default=0)
    first_seen = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_seen = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    honeytoken_id = Column(Integer, ForeignKey("honeytokens.id"), nullable=False, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True, index=True)
    token_id = Column(String, nullable=False, index=True)
    event_type = Column(String, nullable=False)
    ip = Column(String, nullable=False, index=True)
    ua = Column(Text, nullable=True)
    path = Column(String, nullable=False, default="/")
    method = Column(String, nullable=False, default="GET")
    headers = Column(JSON, nullable=False, default=dict)
    geo = Column(JSON, nullable=False, default=dict)
    score = Column(Integer, nullable=False, default=40)
    severity = Column(String, nullable=False, default="low")
    flags = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)


class PlantedDecoy(Base):
    """A managed placement record linked to the active honeytoken that detects it."""
    __tablename__ = "planted_decoys"

    id = Column(Integer, primary_key=True, index=True)
    honeytoken_id = Column(Integer, ForeignKey("honeytokens.id"), nullable=False, unique=True, index=True)
    decoy_type = Column(String, nullable=False)
    label = Column(String(120), nullable=False)
    host = Column(String(255), nullable=False)
    path = Column(String(500), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class GitHubSecretAlert(Base):
    """One repository alert maps to at most one planted decoy."""
    __tablename__ = "github_secret_alerts"
    __table_args__ = (UniqueConstraint("repository", "alert_number", name="uq_github_secret_alert"),)

    id = Column(Integer, primary_key=True, index=True)
    repository = Column(String(255), nullable=False)
    alert_number = Column(String(100), nullable=False)
    secret_type = Column(String(120), nullable=False)
    source_path = Column(String(500), nullable=True)
    source_line = Column(Integer, nullable=True)
    alert_url = Column(String(1000), nullable=True)
    honeytoken_id = Column(Integer, ForeignKey("honeytokens.id"), nullable=False, unique=True)
    decoy_path = Column(String(500), nullable=False)
    status = Column(String(32), nullable=False, default="pending")
    is_demo = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
