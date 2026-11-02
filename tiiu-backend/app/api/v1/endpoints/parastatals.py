import io
import pandas as pd
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.parastatal import ParastatalEnterpriseDB

router = APIRouter(prefix="/api/v1/parastatals", tags=["FMITI Parastatals Registry"])

# ==========================================
# 1. COMPREHENSIVE PARASTATAL MANDATES
# ==========================================
PARASTATAL_MANDATES = {
    # 1. Investment & Enterprise Promotion
    "nipc": {
        "agency_name": "Nigerian Investment Promotion Commission (NIPC)",
        "category": "Investment & Enterprise Promotion",
        "description": "Encourages, promotes, and coordinates foreign and domestic investments in Nigeria.",
        "fields": ["ref_id", "enterprise_name", "sector", "state", "address", "loan_amount", "active_status"]
    },
    "smedan": {
        "agency_name": "Small and Medium Enterprises Development Agency of Nigeria (SMEDAN)",
        "category": "Investment & Enterprise Promotion",
        "description": "Facilitates the promotion and development of MSMEs, cluster participation, and grants.",
        "fields": ["ref_id", "enterprise_name", "employee_count", "state", "sector", "cert_or_license_status"]
    },
    "boi": {
        "agency_name": "Bank of Industry (BOI)",
        "category": "Investment & Enterprise Promotion",
        "description": "Provides long-term financial support, industrial loan approvals, and project funding.",
        "fields": ["ref_id", "enterprise_name", "loan_amount", "disbursement_status", "sector", "state", "active_status"]
    },

    # 2. Trade, Export & Free Zone Regulations
    "nepc": {
        "agency_name": "Nigerian Export Promotion Council (NEPC)",
        "category": "Trade, Export & Free Zone Regulations",
        "description": "Promotes and develops non-oil export trade to diversify the Nigerian economy.",
        "fields": ["ref_id", "enterprise_name", "commodity_or_product", "cert_or_license_status", "state", "sector"]
    },
    "nepza": {
        "agency_name": "Nigeria Export Processing Zones Authority (NEPZA)",
        "category": "Trade, Export & Free Zone Regulations",
        "description": "Establishes, regulates, and manages free trade zones to attract export manufacturing.",
        "fields": ["ref_id", "enterprise_name", "sector", "state", "cert_or_license_status", "active_status"]
    },
    "ogfza": {
        "agency_name": "Oil and Gas Free Zones Authority (OGFZA)",
        "category": "Trade, Export & Free Zone Regulations",
        "description": "Manages and regulates designated oil and gas free trade zones across Nigeria.",
        "fields": ["ref_id", "enterprise_name", "sector", "state", "cert_or_license_status", "active_status"]
    },
    "nce": {
        "agency_name": "Nigeria Commodities Exchange (NCE)",
        "category": "Trade, Export & Free Zone Regulations",
        "description": "Provides structured trading platforms for agricultural and solid mineral commodities.",
        "fields": ["ref_id", "enterprise_name", "commodity_or_product", "state", "sector", "active_status"]
    },

    # 3. Business Regulation, Standards & Compliance
    "cac": {
        "agency_name": "Corporate Affairs Commission (CAC)",
        "category": "Business Regulation, Standards & Compliance",
        "description": "Regulates company formation, business name registrations, and incorporated trustees.",
        "fields": ["ref_id", "enterprise_name", "legal_status", "share_capital", "state", "sector", "incorporation_date", "address"]
    },
    "son": {
        "agency_name": "Standards Organisation of Nigeria (SON)",
        "category": "Business Regulation, Standards & Compliance",
        "description": "Governs quality control, testing, MANCAP/NIS certification, and standardization.",
        "fields": ["ref_id", "enterprise_name", "commodity_or_product", "cert_or_license_status", "state", "sector"]
    },
    "frcn": {
        "agency_name": "Financial Reporting Council of Nigeria (FRCN)",
        "category": "Business Regulation, Standards & Compliance",
        "description": "Regulates accounting, auditing, corporate governance, and financial reporting standards.",
        "fields": ["ref_id", "enterprise_name", "legal_status", "state", "cert_or_license_status", "active_status"]
    },
    "cld": {
        "agency_name": "Commercial Law Department (Trademarks, Patents & Designs)",
        "category": "Business Regulation, Standards & Compliance",
        "description": "Registers and protects intellectual property rights including trademarks and patents.",
        "fields": ["ref_id", "enterprise_name", "commodity_or_product", "cert_or_license_status", "state"]
    },

    # 4. Industrial Training & Capacity Building
    "itf": {
        "agency_name": "Industrial Training Fund (ITF)",
        "category": "Industrial Training & Capacity Building",
        "description": "Stimulates human capital development and provides practical industrial skills training.",
        "fields": ["ref_id", "enterprise_name", "employee_count", "state", "sector", "cert_or_license_status"]
    },
    "nsdc": {
        "agency_name": "National Sugar Development Council (NSDC)",
        "category": "Industrial Training & Capacity Building",
        "description": "Accelerates local sugar production through the Backward Integration Programme.",
        "fields": ["ref_id", "enterprise_name", "commodity_or_product", "loan_amount", "state", "sector"]
    },
    "naddc": {
        "agency_name": "National Automotive Design and Development Council (NADDC)",
        "category": "Industrial Training & Capacity Building",
        "description": "Drives local automotive assembly, design, and component manufacturing.",
        "fields": ["ref_id", "enterprise_name", "sector", "state", "cert_or_license_status", "active_status"]
    },

    # 5. Infrastructure & Infrastructure Management
    "litfcmb": {
        "agency_name": "Lagos International Trade Fair Complex Management Board (LITFCMB)",
        "category": "Infrastructure & Infrastructure Management",
        "description": "Operates and maintains commercial infrastructure of the Lagos trade fair complex.",
        "fields": ["ref_id", "enterprise_name", "address", "state", "cert_or_license_status", "active_status"]
    },
    "tbsmb": {
        "agency_name": "Tafawa Balewa Square Management Board (TBSMB)",
        "category": "Infrastructure & Infrastructure Management",
        "description": "Directs commercial management of national square infrastructure in Lagos.",
        "fields": ["ref_id", "enterprise_name", "address", "state", "cert_or_license_status", "active_status"]
    }
}


# ==========================================
# 2. SCHEMAS
# ==========================================
class EnterpriseRecordCreate(BaseModel):
    parastatal_code: str
    ref_id: str
    enterprise_name: str
    state: str
    sector: Optional[str] = None
    address: Optional[str] = None
    
    # CAC Specific
    legal_status: Optional[str] = None
    share_capital: Optional[float] = 0.0
    incorporation_date: Optional[str] = None
    
    # BOI / Financial Specific
    loan_amount: Optional[float] = 0.0
    disbursement_status: Optional[str] = None
    active_status: Optional[str] = "Active"
    
    # NEPC / SON / SMEDAN / ITF Specific
    commodity_or_product: Optional[str] = None
    cert_or_license_status: Optional[str] = None
    employee_count: Optional[int] = 0
    extra_payload: Optional[Dict[str, Any]] = {}


# ==========================================
# 3. ENDPOINTS
# ==========================================
@router.get("/mandates")
def get_parastatal_mandates():
    """Returns the master list of all 16 supported FMITI agencies with field definitions."""
    return {"status": "success", "mandates": PARASTATAL_MANDATES}


@router.post("/enterprise-record")
def create_enterprise_record(payload: EnterpriseRecordCreate, db: Session = Depends(get_db)):
    """Creates a new enterprise registration entry under a specified parastatal."""
    new_rec = ParastatalEnterpriseDB(
        parastatal_code=payload.parastatal_code.lower(),
        ref_id=payload.ref_id,
        enterprise_name=payload.enterprise_name,
        state=payload.state,
        sector=payload.sector,
        address=payload.address,
        legal_status=payload.legal_status,
        share_capital=payload.share_capital,
        incorporation_date=payload.incorporation_date,
        loan_amount=payload.loan_amount,
        disbursement_status=payload.disbursement_status,
        active_status=payload.active_status,
        commodity_or_product=payload.commodity_or_product,
        cert_or_license_status=payload.cert_or_license_status,
        employee_count=payload.employee_count,
        extra_payload=payload.extra_payload
    )
    db.add(new_rec)
    db.commit()
    db.refresh(new_rec)
    return {"status": "success", "message": f"Enterprise record logged for {payload.parastatal_code.upper()}", "id": new_rec.id}


@router.get("/registry/metrics")
def get_parastatal_metrics(
    parastatal: str = Query("cac", description="Agency code: cac, boi, smedan, nepc, son, etc."),
    db: Session = Depends(get_db)
):
    """Calculates live aggregated metrics for the selected parastatal's analytics command center."""
    agency_code = parastatal.lower()
    records = db.query(ParastatalEnterpriseDB).filter(
        ParastatalEnterpriseDB.parastatal_code == agency_code
    ).all()

    total_count = len(records)
    
    # Calculate total capital or loan valuation dynamically
    total_valuation = sum(
        float(r.loan_amount or 0) if agency_code == "boi" else float(r.share_capital or 0) 
        for r in records
    )

    # Calculate unique states covered out of 37 (36 states + FCT)
    unique_states = len(set(r.state for r in records if r.state))
    state_coverage_percent = round((unique_states / 37) * 100, 1) if total_count > 0 else 0.0

    return {
        "status": "success",
        "parastatal": agency_code.upper(),
        "metrics": {
            "total_records": total_count,
            "total_valuation": total_valuation,
            "unique_states_count": unique_states,
            "state_coverage_percent": state_coverage_percent
        }
    }

@router.get("/registry")
def get_enterprise_registry(
    parastatal: str = Query("cac", description="Agency code: cac, boi, smedan, nepc, son, etc."),
    state: Optional[str] = Query(None, description="Filter by Nigerian State"),
    sector: Optional[str] = Query(None, description="Filter by Industrial Sector"),
    status: Optional[str] = Query(None, description="Filter by Active/Disbursement/License Status"),
    search: Optional[str] = Query(None, description="Search by Enterprise Name or Reference ID"),
    db: Session = Depends(get_db)
):
    """Retrieves enterprise records registered under a specific parastatal with advanced filtering."""
    agency_code = parastatal.lower()
    query = db.query(ParastatalEnterpriseDB).filter(
        ParastatalEnterpriseDB.parastatal_code == agency_code
    )
    
    if state and state != "ALL":
        query = query.filter(ParastatalEnterpriseDB.state.ilike(f"%{state}%"))
        
    if sector and sector != "ALL":
        query = query.filter(ParastatalEnterpriseDB.sector.ilike(f"%{sector}%"))
        
    if status and status != "ALL":
        query = query.filter(
            or_(
                ParastatalEnterpriseDB.active_status.ilike(f"%{status}%"),
                ParastatalEnterpriseDB.disbursement_status.ilike(f"%{status}%"),
                ParastatalEnterpriseDB.cert_or_license_status.ilike(f"%{status}%"),
                ParastatalEnterpriseDB.legal_status.ilike(f"%{status}%")
            )
        )
        
    if search and search.strip():
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                ParastatalEnterpriseDB.enterprise_name.ilike(search_fmt),
                ParastatalEnterpriseDB.ref_id.ilike(search_fmt)
            )
        )
        
    records = query.all()
    
    return {
        "status": "success", 
        "parastatal": agency_code.upper(), 
        "count": len(records), 
        "records": records
    }


@router.get("/export-registry-excel")
def export_parastatal_registry_excel(
    parastatal: str = Query("cac", description="Agency code: cac, boi, smedan, nepc, son, etc."),
    db: Session = Depends(get_db)
):
    """Generates a downloadable Excel spreadsheet (.xlsx) for any selected parastatal."""
    agency_code = parastatal.lower()
    records = db.query(ParastatalEnterpriseDB).filter(
        ParastatalEnterpriseDB.parastatal_code == agency_code
    ).all()

    data = []
    for r in records:
        data.append({
            "Reference ID": r.ref_id,
            "Enterprise Name": r.enterprise_name,
            "State": r.state,
            "Sector": r.sector or "",
            "Address": r.address or "",
            "Legal Status": r.legal_status or "",
            "Share Capital (NGN)": r.share_capital or 0.0,
            "Incorporation Date": r.incorporation_date or "",
            "Loan Amount (NGN)": r.loan_amount or 0.0,
            "Disbursement Status": r.disbursement_status or "",
            "Active Status": r.active_status or "",
            "Commodity / Product": r.commodity_or_product or "",
            "Cert / License Status": r.cert_or_license_status or "",
            "Employee Count": r.employee_count or 0
        })

    if not data:
        data = [{"Notice": f"No enterprise records currently registered for {agency_code.upper()}."}]

    df = pd.DataFrame(data)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name=f"{agency_code.upper()}_Registry")
    output.seek(0)

    filename = f"FMITI_{agency_code.upper()}_Enterprise_Registry.xlsx"
    headers = {'Content-Disposition': f'attachment; filename="{filename}"'}
    return StreamingResponse(
        output, 
        headers=headers, 
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )


@router.delete("/enterprise-record/{record_id}")
def delete_enterprise_record(record_id: int, db: Session = Depends(get_db)):
    """Deletes an enterprise record by ID."""
    record = db.query(ParastatalEnterpriseDB).filter(ParastatalEnterpriseDB.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Enterprise record not found")
    
    db.delete(record)
    db.commit()
    return {"status": "success", "message": f"Enterprise record {record_id} deleted successfully"}