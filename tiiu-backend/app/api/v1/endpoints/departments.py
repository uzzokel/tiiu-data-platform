import io
import pandas as pd
from typing import Optional, List, Dict
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.department import DepartmentKPIDB, DepartmentReportDB

router = APIRouter(prefix="/api/v1/departments", tags=["FMITI Departments & KPIs"])

# ----------------------------------------------------
# PRE-POPULATED DEPARTMENTAL KRA & OBJECTIVES CATALOG
# ----------------------------------------------------
FMITI_DEPARTMENT_STRUCTURE: Dict[str, Dict[str, List[str]]] = {
    "Industrial Development Department": {
        "Industrial Policy & Strategic Development": [
            "Implementation of Nigeria’s Industrial Policy, the Industrial Revolution Plan (NIRP), and sector-specific policies (cement, leather, CTG, tomato, sugar, furniture, paper, machinery, energy, etc.).",
            "Revitalization of moribund industries and establishment of new clusters, including textile/garment parks and agro-processing zones in all 109 senatorial districts."
        ],
        "Industrial Upgrading & Backward Integration": [
            "Promotion of local production through the Backward Integration Programme (BIP).",
            "Facilitation of Executive Order 003 / Buy-Made-in-Nigeria campaigns and processing of Import Duty Exemption Certificates (IDEC)."
        ],
        "Special Industrial Initiatives": [
            "Establishment of the Health Industry Corporation of Nigeria (HICON).",
            "Promotion of made-in-Nigeria products, Africa Industrialization Day events, and targeted sector interventions (palm oil, cocoa, textiles, mobile phones, electricity meters, etc.)."
        ],
        "Partnerships & International Cooperation": [
            "Strategic collaboration with organizations such as MAN, NASME, UNIDO, WASME, NEXIM, and other partners.",
            "Promoting regional and international cooperation to enhance Nigeria’s industrial competitiveness.",
            "Providing technical consultancy and advisory services to support industrial innovation."
        ],
        "MSME & Enterprise Development": [
            "Implementation of NEDEP and the Virtual MSME One-Stop Shop (NEDEP Portal).",
            "Establishment of Shared Common Facility Centres (SCFCs) and public-private partnerships to strengthen entrepreneurship and support start-ups."
        ],
        "International Partnerships & Innovation": [
            "Collaboration with UNIDO under the Country Partnership Programme.",
            "Engagement with the Global Entrepreneurship Network and other international platforms to promote technology transfer, innovation, and global competitiveness."
        ],
        "Coordination & Institutional Oversight": [
            "Supervision of industry agencies and parastatals, including NSDC, NADDC, SMEDAN, ITF, BOI, SON, NEPZA, and OGPZA.",
            "Strengthening inter-governmental collaboration and policy coordination across MDAs."
        ]
    },
    "Industrial Inspectorate Department": {
        "Capital Investment Evaluation": [
            "Inspecting proposed, new, and existing industrial projects to certify actual capital expenditure (local or foreign)."
        ],
        "Technical Assistance": [
            "Supporting government agencies and regulators such as CBN and NIPC through project valuation, post-landing investigations, and certification services."
        ],
        "Data & Industrial Records": [
            "Maintaining detailed national records on industrial plants, machinery, equipment, and economic trends to support policy planning."
        ],
        "Certification Services": [
            "Issuing key regulatory certificates that drive industrialization and investment in Nigeria."
        ]
    },
    "Department of Weights and Measures": {
        "Calibration & Verification": [
            "Custody, maintenance, and calibration of Nigeria’s standards (primary, secondary, and working standards) traceable to international benchmarks."
        ],
        "Testing & Certification": [
            "Monitoring, verifying, and certifying all weighing and measuring instruments used in commerce, industry, shops, and open markets."
        ],
        "Oil & Gas Measurement": [
            "Certification of equipment used to measure crude oil and gas, and verification of export volumes to ensure transparency in Nigeria’s oil and gas trade."
        ],
        "Consumer Protection": [
            "Cross-checking pre-packed goods to confirm that declared net weights match actual contents, preventing fraud and short-changing of consumers."
        ],
        "Equipment Approval": [
            "Approval of new weighing and measuring instruments (manufactured locally or imported) and modifications to existing devices to guarantee suitability for trade."
        ],
        "Standardization of Indigenous Measures": [
            "Enforcing uniform adoption of traditional measures (such as those used in grain and liquid trade) across Nigeria."
        ],
        "Licensing & Competency Certificates": [
            "Registration and issuance of certificates to manufacturers, calibrators, and repairers of weighing and measuring equipment."
        ],
        "Revenue Collection": [
            "Collection of statutory service fees, remitted through the Treasury Single Account (TSA), to support government accountability."
        ]
    }
}


# ----------------------------------------------------
# PYDANTIC SCHEMAS (ADDITIVE & NON-BREAKING)
# ----------------------------------------------------
class KPISubmissionSchema(BaseModel):
    department_name: str
    area_of_focus: str
    kpi_title: str
    target_value: float
    achieved_value: float
    quarter_period: str
    objective_deliverable: Optional[str] = None
    narrative: Optional[str] = Field(default="", max_length=3000)


# ----------------------------------------------------
# API ENDPOINTS
# ----------------------------------------------------
@router.get("/structure")
def get_department_structure():
    """
    Returns pre-populated Key Result Areas (Areas of Focus) and Objectives 
    for FMITI Departments to drive interactive frontend dropdowns.
    """
    return {
        "status": "success",
        "structure": FMITI_DEPARTMENT_STRUCTURE
    }


@router.post("/kpi")
def create_department_kpi(payload: KPISubmissionSchema, db: Session = Depends(get_db)):
    """
    Creates and logs a new Departmental KPI entry into the database.
    """
    new_entry = DepartmentKPIDB(
        department_name=payload.department_name,
        area_of_focus=payload.area_of_focus,
        kpi_title=payload.kpi_title,
        target_value=payload.target_value,
        achieved_value=payload.achieved_value,
        quarter_period=payload.quarter_period,
        objective_deliverable=payload.objective_deliverable if hasattr(DepartmentKPIDB, "objective_deliverable") else None,
        narrative=payload.narrative if hasattr(DepartmentKPIDB, "narrative") else None
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return {
        "status": "success", 
        "message": "KPI logged successfully", 
        "id": new_entry.id
    }


@router.delete("/kpi/{kpi_id}")
def delete_department_kpi(kpi_id: int, db: Session = Depends(get_db)):
    """
    Deletes a specific departmental KPI record from SQLite by ID.
    """
    record = db.query(DepartmentKPIDB).filter(DepartmentKPIDB.id == kpi_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="KPI record not found")
    
    db.delete(record)
    db.commit()
    return {"status": "success", "message": f"KPI record {kpi_id} deleted successfully"}


@router.get("/kpis")
def get_department_kpis(db: Session = Depends(get_db)):
    """
    Fetches all logged departmental KPIs with calculated rates and optional metadata.
    """
    records = db.query(DepartmentKPIDB).all()
    results = [
        {
            "id": r.id,
            "department_name": r.department_name,
            "area_of_focus": r.area_of_focus,
            "kpi_title": r.kpi_title,
            "target_value": r.target_value,
            "achieved_value": r.achieved_value,
            "quarter_period": r.quarter_period,
            "objective_deliverable": getattr(r, "objective_deliverable", None),
            "narrative": getattr(r, "narrative", ""),
            "achievement_rate": round((r.achieved_value / r.target_value) * 100, 1) if r.target_value > 0 else 0.0,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if hasattr(r, "created_at") and r.created_at else ""
        }
        for r in records
    ]
    return {"status": "success", "count": len(results), "kpis": results}


@router.post("/upload-department-report")
async def upload_department_report(
    department_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Saves an uploaded Excel or CSV report separately under the selected department title.
    Stores raw binary content to allow full file retrieval upon download.
    """
    if not (file.filename.endswith(".xlsx") or file.filename.endswith(".xls") or file.filename.endswith(".csv")):
        raise HTTPException(status_code=400, detail="Only Excel and CSV files are supported.")

    contents = await file.read()
    
    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        row_count = len(df)
    except Exception:
        row_count = 0

    report_kwargs = {
        "department_name": department_name,
        "file_name": file.filename,
        "rows_count": row_count
    }
    # Store binary contents if file_data column exists on model
    if hasattr(DepartmentReportDB, "file_data"):
        report_kwargs["file_data"] = contents

    report_entry = DepartmentReportDB(**report_kwargs)
    db.add(report_entry)
    db.commit()
    db.refresh(report_entry)

    return {
        "status": "success",
        "message": f"Report for '{department_name}' successfully archived.",
        "report_id": report_entry.id,
        "file_name": file.filename,
        "rows_counted": row_count
    }


@router.get("/reports")
def get_department_reports(db: Session = Depends(get_db)):
    """
    Fetches all archived departmental report uploads.
    """
    records = db.query(DepartmentReportDB).order_by(DepartmentReportDB.uploaded_at.desc()).all()
    results = [
        {
            "id": r.id,
            "department_name": r.department_name,
            "file_name": r.file_name,
            "rows_count": r.rows_count,
            "uploaded_at": r.uploaded_at.strftime("%Y-%m-%d %H:%M") if hasattr(r, "uploaded_at") and r.uploaded_at else ""
        }
        for r in records
    ]
    return {"status": "success", "count": len(results), "reports": results}


@router.get("/reports/{report_id}/download")
def download_department_report_file(report_id: int, db: Session = Depends(get_db)):
    """
    Streams and downloads the exact uploaded binary file corresponding to the archived report record.
    """
    report = db.query(DepartmentReportDB).filter(DepartmentReportDB.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Archived report record not found")
    
    file_bytes = getattr(report, "file_data", None)
    if not file_bytes:
        raise HTTPException(
            status_code=404, 
            detail="File content not stored for this older upload. Please re-upload this report."
        )

    if report.file_name.endswith(".csv"):
        media_type = "text/csv"
    elif report.file_name.endswith(".xls"):
        media_type = "application/vnd.ms-excel"
    else:
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    headers = {'Content-Disposition': f'attachment; filename="{report.file_name}"'}
    return StreamingResponse(io.BytesIO(file_bytes), headers=headers, media_type=media_type)


@router.delete("/reports/{report_id}")
def delete_department_report(report_id: int, db: Session = Depends(get_db)):
    """
    Deletes a specific archived departmental report record and its binary file from SQLite by ID.
    """
    report = db.query(DepartmentReportDB).filter(DepartmentReportDB.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Archived report record not found")
    
    db.delete(report)
    db.commit()
    return {"status": "success", "message": f"Archived report record {report_id} deleted successfully"}


@router.get("/export-kpis-excel")
def export_department_kpis_excel(db: Session = Depends(get_db)):
    """
    Exports logged departmental KPIs to Excel with separate Target, Achievement, and Narrative fields.
    """
    records = db.query(DepartmentKPIDB).all()
    data = [
        {
            "Department": r.department_name,
            "Area of Focus": r.area_of_focus,
            "Objective / Deliverable": getattr(r, "objective_deliverable", "N/A"),
            "KPI Title": r.kpi_title,
            "Target Value": r.target_value,
            "Achieved Value": r.achieved_value,
            "Achievement (%)": round((r.achieved_value / r.target_value) * 100, 1) if r.target_value > 0 else 0.0,
            "Period": r.quarter_period,
            "Performance Narrative": getattr(r, "narrative", ""),
            "Logged Date": r.created_at.strftime("%Y-%m-%d") if hasattr(r, "created_at") and r.created_at else ""
        }
        for r in records
    ]
    df = pd.DataFrame(data)
    if df.empty:
        df = pd.DataFrame(columns=["Department", "Area of Focus", "Objective / Deliverable", "KPI Title", "Target Value", "Achieved Value", "Achievement (%)", "Period", "Performance Narrative", "Logged Date"])

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="FMITI_Department_KPIs")
    output.seek(0)

    headers = {'Content-Disposition': 'attachment; filename="FMITI_Departmental_KPI_Report.xlsx"'}
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')