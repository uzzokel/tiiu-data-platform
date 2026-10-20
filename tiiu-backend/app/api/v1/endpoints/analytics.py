import io
import pandas as pd
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit import UniversalSubmissionDB

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])

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
    parastatal: str = Query("cac"),
    year: int = Query(None),
    search_query: str = Query("")
):
    """
    Returns a filterable list of registered enterprises by year.
    """
    mock_registry = [
        {"id": "RC987654", "name": "ABA FOOTWEAR & LEATHER CLUSTER LTD", "sector": "MANUFACTURING", "year": 2018, "state": "Abia", "status": "ACTIVE"},
        {"id": "RC123456", "name": "NIGERIA AGRO ALLIED VENTURES", "sector": "AGRICULTURE", "year": 2020, "state": "Kano", "status": "ACTIVE"},
        {"id": "RC554433", "name": "LAGOS TECH SOLUTIONS LTD", "sector": "ICT", "year": 2021, "state": "Lagos", "status": "ACTIVE"},
        {"id": "RC778899", "name": "PORT HARCOURT LOGISTICS HUB", "sector": "LOGISTICS", "year": 2018, "state": "Rivers", "status": "ACTIVE"},
    ]

    filtered = mock_registry
    if year:
        filtered = [item for item in filtered if item["year"] == year]
    if search_query:
        q = search_query.lower()
        filtered = [item for item in filtered if q in item["id"].lower() or q in item["name"].lower()]

    return {"status": "success", "count": len(filtered), "results": filtered}


@router.get("/export-registry-excel")
def export_registry_excel(year: int = Query(2018)):
    """
    Generates an downloadable Excel spreadsheet (.xlsx) for any selected year.
    """
    mock_registry = [
        {"id": "RC987654", "name": "ABA FOOTWEAR & LEATHER CLUSTER LTD", "sector": "MANUFACTURING", "year": 2018, "state": "Abia", "status": "ACTIVE"},
        {"id": "RC123456", "name": "NIGERIA AGRO ALLIED VENTURES", "sector": "AGRICULTURE", "year": 2020, "state": "Kano", "status": "ACTIVE"},
        {"id": "RC554433", "name": "LAGOS TECH SOLUTIONS LTD", "sector": "ICT", "year": 2021, "state": "Lagos", "status": "ACTIVE"},
        {"id": "RC778899", "name": "PORT HARCOURT LOGISTICS HUB", "sector": "LOGISTICS", "year": 2018, "state": "Rivers", "status": "ACTIVE"},
    ]

    filtered = [item for item in mock_registry if item["year"] == year]
    df = pd.DataFrame(filtered)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name=f"Registry_{year}")
    output.seek(0)

    headers = {'Content-Disposition': f'attachment; filename="FMITI_Registry_Report_{year}.xlsx"'}
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')