from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class ODGLaborBreakdown(BaseModel):
    permanent_male: int = Field(default=0, description="Permanent male employees")
    permanent_female: int = Field(default=0, description="Permanent female employees")
    casual_male: int = Field(default=0, description="Casual/contract male employees")
    casual_female: int = Field(default=0, description="Casual/contract female employees")

class ODGFieldSurveyCreate(BaseModel):
    form_id: str = Field(..., description="ODK Form ID, e.g., FMITI_CLUSTER_AUDIT_V2")
    survey_instance_id: str = Field(..., description="Unique ODK Collect instance UUID")
    rc_number: Optional[str] = Field(None, description="Linked CAC RC Number if verified on-site")
    cluster_name: str = Field(..., description="Industrial cluster name, e.g., Aba Leather Cluster")
    enumerator_id: str = Field(..., description="ID of the FMITI field officer conducting the audit")
    submission_timestamp: datetime
    latitude: float = Field(..., description="GPS Latitude captured on-site")
    longitude: float = Field(..., description="GPS Longitude captured on-site")
    operational_status: str = Field(..., description="ACTIVE, DORMANT, or UNDER_RENOVATION")
    machinery_type: str = Field(..., description="MANUAL, SEMI_AUTOMATED, or FULLY_AUTOMATED")
    power_source: str = Field(..., description="GRID, DIESEL_GENERATOR, SOLAR, or HYBRID")
    health_safety_rating: str = Field(..., description="HIGH, MODERATE, or NON_COMPLIANT")
    labor_stats: ODGLaborBreakdown
    raw_survey_payload: Dict[str, Any] = Field(default={}, description="Full XML/JSON payload from ODK form")

class ODGFieldSurveyResponse(ODGFieldSurveyCreate):
    id: int
    ingested_at: datetime = Field(default_factory=datetime.utcnow)