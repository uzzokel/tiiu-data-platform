from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime

class BOILoanFacility(BaseModel):
    facility_id: str = Field(..., description="Unique BOI Loan or Intervention ID")
    scheme_name: str = Field(..., description="e.g., FG/BOI MSME Intervention Fund, GEM Scheme")
    approved_amount: float
    disbursed_amount: float
    outstanding_balance: float
    interest_rate: float = Field(..., description="Annual interest rate percentage")
    disbursement_status: str = Field(..., description="FULLY_DISBURSED, PARTIALLY_DISBURSED, or PENDING")
    repayment_status: str = Field(..., description="PERFORMING, NON_PERFORMING, or COMPLETED")
    approval_date: date
    maturity_date: date

class BOIEnterpriseResponse(BaseModel):
    boi_customer_id: str = Field(..., description="BOI Unique Customer Identifier")
    business_name: str = Field(..., description="Registered Business or Company Name")
    entity_type: str = Field(..., description="LIMITED_LIABILITY, BUSINESS_NAME, or COOPERATIVE")
    registration_number: str = Field(..., description="CAC RC or BN Number")
    business_address: str
    state_of_operation: str
    lga: str
    industrial_sector: str = Field(..., description="e.g., MANUFACTURING, AGRO-PROCESSING, TEXTILE & LEATHER")
    sub_sector: str = Field(..., description="e.g., Footwear & Leather Products Manufacturing")
    promoter_name: str = Field(..., description="Lead Promoter or Managing Director")
    regional_office: str = Field(..., description="Managing BOI State/Zonal Office")
    active_facilities: List[BOILoanFacility] = []
    total_credit_exposure: float
    compliance_rating: str = Field(..., description="HIGH, MEDIUM, or LOW risk classification")
    last_synced_at: datetime = Field(default_factory=datetime.utcnow)