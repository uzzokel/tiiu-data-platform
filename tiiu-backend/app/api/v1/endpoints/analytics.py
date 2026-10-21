import io
import pandas as pd
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit import UniversalSubmissionDB

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])

# Master dictionary containing datasets across all parastatals
AGENCY_DATASETS = {
    "cac": [
        {"id": "RC987654", "name": "ABA FOOTWEAR & LEATHER CLUSTER LTD", "sector": "MANUFACTURING", "year": 2018, "state": "Abia", "status": "ACTIVE"},
        {"id": "RC123456", "name": "NIGERIA AGRO ALLIED VENTURES", "sector": "AGRICULTURE", "year": 2020, "state": "Kano", "status": "ACTIVE"},
        {"id": "RC554433", "name": "LAGOS TECH SOLUTIONS LTD", "sector": "ICT", "year": 2021, "state": "Lagos", "status": "ACTIVE"},
        {"id": "RC778899", "name": "PORT HARCOURT LOGISTICS HUB", "sector": "LOGISTICS", "year": 2018, "state": "Rivers", "status": "ACTIVE"},
    ],
    "smedan": [
        {"id": "SMN-2018-091", "name": "ABA CRAFTS & STITCHING CO.", "sector": "MSME / FASHION", "year": 2018, "state": "Abia", "status": "REGISTERED"},
        {"id": "SMN-2020-442", "name": "KANO GRAINS PROCESSING CO-OP", "sector": "AGRICULTURE", "year": 2020, "state": "Kano", "status": "REGISTERED"},
        {"id": "SMN-2021-881", "name": "IBADAN AGRO PACKAGING LTD", "sector": "PROCESSING", "year": 2021, "state": "Oyo", "status": "REGISTERED"},
    ],
    "boi": [
        {"id": "BOI-LOAN-8832", "name": "ABA FOOTWEAR & LEATHER CLUSTER LTD", "sector": "MANUFACTURING", "year": 2018, "state": "Abia", "status": "DISBURSED"},
        {"id": "BOI-LOAN-9910", "name": "ENUGU STEEL FABRICATION LTD", "sector": "HEAVY INDUSTRY", "year": 2020, "state": "Enugu", "status": "DISBURSED"},
        {"id": "BOI-LOAN-1022", "name": "KANO TEXTILE MILLS CO", "sector": "MANUFACTURING", "year": 2021, "state": "Kano", "status": "APPROVED"},
    ],
    "son": [
        {"id": "SON-CAP-1102", "name": "ABA FOOTWEAR & LEATHER CLUSTER LTD", "sector": "MANUFACTURING", "year": 2018, "state": "Abia", "status": "CERTIFIED"},
        {"id": "SON-CAP-3341", "name": "ONITSHA ALUMINUM PROFILES", "sector": "MANUFACTURING", "year": 2021, "state": "Anambra", "status": "CERTIFIED"},
        {"id": "SON-CAP-5590", "name": "LAGOS PHARMA PRODUCTS LTD", "sector": "HEALTHCARE", "year": 2020, "state": "Lagos", "status": "CERTIFIED"},
    ],
    "nepc": [
        {"id": "NEPC-EXP-551", "name": "NIGERIA AGRO ALLIED VENTURES", "sector": "EXPORT / AGRO", "year": 2020, "state": "Kano", "status": "ACTIVE_LICENSE"},
        {"id": "NEPC-EXP-889", "name": "LAGOS LEATHER EXPORTERS LTD", "sector": "EXPORT", "year": 2018, "state": "Lagos", "status": "ACTIVE_LICENSE"},
        {"id": "NEPC-EXP-992", "name": "CALABAR COCOA EXPORT HUB", "sector": "AGRICULTURE", "year": 2021, "state": "Cross River", "status": "ACTIVE_LICENSE"},
    ]
}


@router.get("/enumerator-summary")
def get_enumerator_aggregation(db: Session = Depends(get_db)):
    """
    Aggregates ODK submissions by Enumerator ID and Location.
    """
    records = db.query(UniversalSubmissionDB).all()
    summary = {}

    for rec in records:
        data = rec.form_data or {}
        enum_id = data.get("enumerator_id") or data.get("enumeratorId") or "ENUM_001"
        location = data.get("lga") or data.get("state") or data.get("location") or "Abuja / FCT"
        
        key = f"{enum_id}|{location}"
        if key not in summary:
            summary[key] = {"enumerator_id": enum_id, "location": location, "total_submissions": 0}
        
        summary[key]["total_submissions"] += 1

    return {"status": "success", "aggregations": list(summary.values())}


@router.get("/parastatal/registry-search")
def search_parastatal_registry(
    parastatal: str = Query("cac", description="cac, smedan, boi, son, nepc"),
    year: int = Query(None, description="Filter by year"),
    search_query: str = Query("", description="Filter by company name or ID")
):
    """
    Returns a filterable list of registered enterprises by parastatal, year, and search query.
    """
    agency_key = parastatal.lower()
    dataset = AGENCY_DATASETS.get(agency_key, AGENCY_DATASETS["cac"])

    filtered = dataset
    if year:
        filtered = [item for item in filtered if item["year"] == year]
    if search_query:
        q = search_query.lower()
        filtered = [item for item in filtered if q in item["id"].lower() or q in item["name"].lower()]

    return {
        "status": "success", 
        "parastatal": agency_key.upper(), 
        "count": len(filtered), 
        "results": filtered
    }


@router.get("/export-registry-excel")
def export_registry_excel(
    parastatal: str = Query("cac", description="cac, smedan, boi, son, nepc"),
    year: int = Query(2018, description="Year to export")
):
    """
    Generates an downloadable Excel spreadsheet (.xlsx) for any selected parastatal and year.
    """
    agency_key = parastatal.lower()
    dataset = AGENCY_DATASETS.get(agency_key, AGENCY_DATASETS["cac"])

    filtered = [item for item in dataset if item["year"] == year]
    if not filtered:
        # Fallback to full parastatal list if selected year has no specific records
        filtered = dataset

    df = pd.DataFrame(filtered)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name=f"{agency_key.upper()}_{year}")
    output.seek(0)

    headers = {'Content-Disposition': f'attachment; filename="FMITI_{agency_key.upper()}_Registry_{year}.xlsx"'}
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')