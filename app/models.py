
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class Honeytoken(Base):
    __tablename__ = "honeytokens"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    token_hash = Column(String, unique=True, nullable=False)
    token_type = Column(String, nullable=False)
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
