from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from app.schemas.cac_schema import CACCompanyResponse
from app.schemas.smedan_schema import SMEDANEnterpriseResponse
from app.schemas.boi_schema import BOIEnterpriseResponse
from app.schemas.son_schema import SONEnterpriseResponse
from app.schemas.nepc_schema import NEPCExporterResponse


class UnifiedEnterpriseProfile(BaseModel):
    rc_number: str
    cac_record: Optional[CACCompanyResponse] = None
    smedan_record: Optional[SMEDANEnterpriseResponse] = None
    boi_record: Optional[BOIEnterpriseResponse] = None
    son_record: Optional[SONEnterpriseResponse] = None
    nepc_record: Optional[NEPCExporterResponse] = None
    trade_compliance_score: int = Field(..., description="Calculated 360-degree compliance index (0-100)")
    last_aggregated_at: datetime = Field(default_factory=datetime.utcnow)