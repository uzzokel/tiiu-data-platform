from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.database import Base

class DepartmentKPIDB(Base):
    __tablename__ = "department_kpis"

    id = Column(Integer, primary_key=True, index=True)
    department_name = Column(String, index=True)
    area_of_focus = Column(String)
    kpi_title = Column(String, index=True)
    target_value = Column(Float)
    achieved_value = Column(Float)
    quarter_period = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DepartmentReportDB(Base):
    __tablename__ = "department_reports"

    id = Column(Integer, primary_key=True, index=True)
    department_name = Column(String, index=True)
    file_name = Column(String)
    rows_count = Column(Integer)
    uploaded_at = Column(DateTime, default=datetime.utcnow)