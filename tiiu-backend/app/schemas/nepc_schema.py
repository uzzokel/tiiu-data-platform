from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime

class NEPCExporterResponse(BaseModel):
    nepc_reg_number: str = Field(..., description="NEPC Exporter Registration Certificate Number (e.g., NEPC/00392/AB/2024)")
    enterprise_name: str
    registration_number: str = Field(..., description="CAC RC or BN Number")
    exporter_category: str = Field(..., description="MERCHANT_EXPORTER, MANUFACTURER_EXPORTER, or SERVICE_EXPORTER")
    export_products: List[str] = Field(..., description="Target export commodity list (e.g., Finished Leather Goods)")
    target_markets: List[str] = Field(..., description="Destination countries/regions (e.g., AfCFTA / EU / USA)")
    certificate_issue_date: date
    certificate_expiry_date: date
    status: str = Field(..., description="ACTIVE, EXPIRED, or REVOKED")
    head_office_address: str
    state_of_operation: str
    last_synced_at: datetime = Field(default_factory=datetime.utcnow)