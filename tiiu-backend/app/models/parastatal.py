from sqlalchemy import Column, Integer, String, Float, Text, JSON
from app.database import Base

class ParastatalEnterpriseDB(Base):
    __tablename__ = "enterprise_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    parastatal_code = Column(String, index=True)
    ref_id = Column(String, index=True)
    enterprise_name = Column(String, index=True)
    state = Column(String, index=True)
    sector = Column(String, index=True)
    address = Column(String, nullable=True)
    legal_status = Column(String, nullable=True)
    share_capital = Column(Float, default=0.0)
    incorporation_date = Column(String, nullable=True)
    loan_amount = Column(Float, default=0.0)
    disbursement_status = Column(String, nullable=True)
    active_status = Column(String, default="Active")
    commodity_or_product = Column(String, nullable=True)
    cert_or_license_status = Column(String, nullable=True)
    employee_count = Column(Integer, default=0)
    extra_payload = Column(JSON, nullable=True)