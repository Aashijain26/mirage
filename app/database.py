
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
    """Create tables and apply safe, one-time compatibility migrations.

    Existing installations predate Honeytoken.context. CREATE TABLE IF NOT EXISTS
    does not add columns, so keep the small compatibility migration here until a
    formal migration runner is introduced.
    """
    Base.metadata.create_all(bind=engine)
    columns = {column["name"] for column in inspect(engine).get_columns("honeytokens")}
    if "context" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE honeytokens ADD COLUMN context VARCHAR(500)"))

    # Previous builds automatically listed every Tokens-page item as planted.
    # Remove only those generated inventory links once, retaining the tokens.
    migration = "remove_unplanted_token_inventory_links_v1"
    with engine.begin() as connection:
        connection.execute(text(
            "CREATE TABLE IF NOT EXISTS mirage_migrations "
            "(name VARCHAR(120) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
        ))
        already_applied = connection.execute(
            text("SELECT name FROM mirage_migrations WHERE name = :name"),
            {"name": migration},
        ).first()

    if not already_applied:
        from app.models import Honeytoken, PlantedDecoy

        session = SessionLocal()
        try:
            type_map = {"aws": "aws", "api_key": "api", "webhook": "webhook", "db": "db"}
            linked = session.query(PlantedDecoy, Honeytoken).join(
                Honeytoken, Honeytoken.id == PlantedDecoy.honeytoken_id
            ).all()
            for decoy, token in linked:
                location = (token.context or "").strip()
                expected_host = location[:255] or "tokens-page"
                expected_path = location[:500] or "/"
                if (
                    decoy.label == token.name
                    and decoy.host == expected_host
                    and decoy.path == expected_path
                    and decoy.decoy_type == type_map.get(token.token_type, "api")
                ):
                    session.delete(decoy)
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
        with engine.begin() as connection:
            connection.execute(
                text("INSERT INTO mirage_migrations (name) VALUES (:name)"),
                {"name": migration},
            )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
