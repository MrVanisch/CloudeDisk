from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import settings

# Usually, we'd use postgresql://user:password@host/dbname
# In Settings, if SQLALCHEMY_DATABASE_URI is provided, we use it. Otherwise, we can construct it.
def get_db_url():
    if settings.SQLALCHEMY_DATABASE_URI:
        return settings.SQLALCHEMY_DATABASE_URI
    return f"postgresql+psycopg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}/{settings.POSTGRES_DB}"

engine = create_engine(get_db_url(), pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
