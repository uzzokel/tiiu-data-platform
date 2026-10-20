from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from datetime import datetime
from app.database import Base

class UniversalSubmissionDB(Base):
    __tablename__ = "form_submissions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    form_id = Column(String(255), index=True, nullable=True)  # e.g., "FMITI_CLUSTER_AUDIT_V1"
    instance_id = Column(String(255), unique=True, index=True, nullable=True)
    
    # Dynamic JSON payload that stores ALL key-value pairs from any ODK form or Excel row
    form_data = Column(JSON, nullable=True)
    
    raw_xml = Column(Text, nullable=True)
    received_at = Column(DateTime, default=datetime.utcnow)