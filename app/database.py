
import os

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./honeytokens.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def init_db():
    """Create tables, apply additive upgrades, and link existing tokens to decoys.

    Existing installations predate Honeytoken.context. CREATE TABLE IF NOT EXISTS
    does not add columns, so keep the small compatibility migration here until a
    formal migration runner is introduced.
    """
    Base.metadata.create_all(bind=engine)
    columns = {column["name"] for column in inspect(engine).get_columns("honeytokens")}
    if "context" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE honeytokens ADD COLUMN context VARCHAR(500)"))

    # Older Tokens-page records have a Honeytoken row but no PlantedDecoy row.
    # Create the missing inventory link without generating a new credential.
    from app.models import Honeytoken, PlantedDecoy

    session = SessionLocal()
    try:
        linked_ids = {
            row[0] for row in session.query(PlantedDecoy.honeytoken_id).all()
        }
        token_types = {"aws": "aws", "api_key": "api", "webhook": "webhook", "db": "db"}
        for token in session.query(Honeytoken).all():
            if token.id in linked_ids:
                continue
            location = (token.context or "").strip()
            session.add(PlantedDecoy(
                honeytoken_id=token.id,
                decoy_type=token_types.get(token.token_type, "api"),
                label=token.name,
                host=location[:255] or "tokens-page",
                path=location[:500] or "/",
                is_active=token.is_active,
            ))
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
