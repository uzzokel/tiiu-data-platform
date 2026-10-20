from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime

class DirectorSchema(BaseModel):
    name: str
    role: str

class CACCompanyResponse(BaseModel):
    rc_number: str = Field(..., description="Corporate Affairs Commission Registration Number")
    company_name: str
    company_type: str
    status: str
    registration_date: date
    share_capital: Optional[float] = None
    registered_address: str
    directors: List[DirectorSchema] = []
    last_synced_at: datetime = Field(default_factory=datetime.utcnow)