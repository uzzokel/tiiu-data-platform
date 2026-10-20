from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class SMEDANEnterpriseResponse(BaseModel):
    smedan_suin: str = Field(..., description="SMEDAN Unique Identification Number (SUIN)")
    enterprise_name: str
    msme_classification: str = Field(..., description="MICRO, SMALL, or MEDIUM based on assets and staff")
    sector: str = Field(..., description="e.g., MANUFACTURING, AGRO-ALLIED, ICT, SERVICES")
    cluster_membership: Optional[str] = Field(None, description="e.g., Aba Footwear and Leather Cluster")
    employee_count: int
    asset_valuation_tier: str = Field(..., description="Asset bracket classification")
    bds_programs_attended: List[str] = Field(default=[], description="Business Development Services & training history")
    intervention_loan_eligibility: bool = Field(..., description="Qualified for Federal MSME intervention funds")
    cooperative_affiliation: Optional[str] = None
    registration_status: str = Field(..., description="ACTIVE, PENDING, or SUSPENDED")
    state_of_operation: str
    lga: str
    last_synced_at: datetime = Field(default_factory=datetime.utcnow)