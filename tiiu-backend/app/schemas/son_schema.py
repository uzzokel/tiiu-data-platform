from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class SONEnterpriseResponse(BaseModel):
    son_certificate_id: str = Field(..., description="SON Conformity or MANCAP Certificate Number")
    enterprise_name: str
    registration_number: str = Field(..., description="CAC RC or BN Number")
    product_name: str = Field(..., description="Certified product or product line")
    certification_type: str = Field(..., description="MANCAP (Local) or SONCAP (Import)")
    nis_standard_ref: str = Field(..., description="Nigerian Industrial Standard reference, e.g., NIS 532:2008")
    issue_date: date
    expiry_date: date
    compliance_status: str = Field(..., description="ACTIVE, EXPIRED, or SUSPENDED")
    factory_address: str
    state_of_operation: str
    last_synced_at: datetime = Field(default_factory=datetime.utcnow)