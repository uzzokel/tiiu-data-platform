from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# --- Layer 1: Aggregate KPIs ---
class ExecutiveKPIOverview(BaseModel):
    total_active_msmes: int = Field(..., description="Total active registered MSMEs")
    total_boi_disbursement_ngn: float = Field(..., description="Total Bank of Industry loan volume disbursed in NGN")
    total_nonoil_exports_usd: float = Field(..., description="Total non-oil export value in USD")
    active_field_audits: int
    reporting_period: str = "Q4 2026"
    last_pipeline_sync: str

# --- Layer 2: Vector Similarity Search (Tariff HS Code Matcher) ---
class MarketMatchRequest(BaseModel):
    product_description: str = Field(..., example="Processed organic sesame seeds and sesame oil")
    top_k: int = Field(default=5, ge=1, le=20)

class MarketMatchResult(BaseModel):
    hs_code: str
    product_heading: str
    concession_rate: str
    target_market: str
    similarity_score: float

class MarketMatchResponse(BaseModel):
    query: str
    matches: List[MarketMatchResult]

# --- Layer 2: Credit Risk & Default Scoring ---
class CreditRiskRequest(BaseModel):
    rc_number: str
    loan_amount_requested: float
    capacity_utilization_pct: float
    years_in_operation: int
    sector: str

class CreditRiskResponse(BaseModel):
    rc_number: str
    default_probability_pct: float
    risk_level: str  # Low, Medium, High
    contributing_factors: List[str]
    max_recommended_loan: float

# --- Layer 3: Econometric Policy Simulator (System GMM) ---
class GMMSimulationRequest(BaseModel):
    grant_amount_ngn: float = Field(..., example=5000000.0)
    target_sector: str = Field(..., example="Agro-Processing & Food")
    implementation_years: int = Field(default=3, ge=1, le=5)

class GMMSimulationResponse(BaseModel):
    grant_amount_ngn: float
    target_sector: str
    horizon_years: int
    predicted_net_jobs_created: int
    estimated_revenue_multiplier: float
    confidence_interval: Dict[str, int]