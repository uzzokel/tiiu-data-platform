from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime
from app.database import Base

class UniversalSubmissionDB(Base):
    __tablename__ = "universal_submissions"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(String, index=True)
    instance_id = Column(String, unique=True, index=True)
    data = Column(JSON)
    received_at = Column(DateTime, default=datetime.utcnow)