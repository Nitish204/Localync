"""
Database engine + session management.

Uses SQLite for local/dev simplicity. Swap SQLALCHEMY_DATABASE_URL for a
Postgres DSN in production, e.g.:
    postgresql+psycopg2://user:password@localhost:5432/localync
Nothing else in the app needs to change — all queries go through the ORM.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite:///./localync.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},  # needed only for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
