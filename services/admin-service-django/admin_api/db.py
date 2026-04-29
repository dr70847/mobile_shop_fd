import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def _database_url() -> str:
    # Uses same env conventions as Node services.
    host = os.getenv("DB_HOST", "localhost")
    port = int(os.getenv("DB_PORT", "3306"))
    user = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASSWORD", "")
    name = os.getenv("DB_NAME", "mobile_shop")
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}"


ENGINE = create_engine(_database_url(), pool_pre_ping=True)
SessionLocal = sessionmaker(bind=ENGINE, autoflush=False, autocommit=False)


def get_session():
    return SessionLocal()

