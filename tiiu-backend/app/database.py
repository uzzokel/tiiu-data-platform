import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get the directory where database.py is located (e.g., .../tiiu-backend/app)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Go up one level to tiiu-backend/ and store tiiu.db safely there
DB_PATH = os.path.abspath(os.path.join(BASE_DIR, "../tiiu.db"))
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

print(f"📂 ACTIVE DATABASE PATH: {DB_PATH}")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()