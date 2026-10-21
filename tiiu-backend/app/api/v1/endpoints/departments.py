import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.department import DepartmentKPIDB, DepartmentReportDB

router = APIRouter(prefix="/api/v1/departments", tags=["FMITI Departments & KPIs"])

class KPISubmissionSchema(BaseModel):
    department_name: str
    area_of_focus: str
    kpi_title: str
    target_value: float
    achieved_value: float
    quarter_period: str

@router.post("/kpi")
def create_department_kpi(payload: KPISubmissionSchema, db: Session = Depends(get_db)):
    new_entry = DepartmentKPIDB(
        department_name=payload.department_name,
        area_of_focus=payload.area_of_focus,
        kpi_title=payload.kpi_title,
        target_value=payload.target_value,
        achieved_value=payload.achieved_value,
        quarter_period=payload.quarter_period
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return {"status": "success", "message": "KPI logged successfully", "id": new_entry.id}


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


@router.post("/upload-department-report")
async def upload_department_report(
    department_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Saves an uploaded Excel or CSV report separately under the selected department title.
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

    report_entry = DepartmentReportDB(
        department_name=department_name,
        file_name=file.filename,
        rows_count=row_count
    )
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
    records = db.query(DepartmentReportDB).order_by(DepartmentReportDB.uploaded_at.desc()).all()
    results = [
        {
            "id": r.id,
            "department_name": r.department_name,
            "file_name": r.file_name,
            "rows_count": r.rows_count,
            "uploaded_at": r.uploaded_at.strftime("%Y-%m-%d %H:%M")
        }
        for r in records
    ]
    return {"status": "success", "count": len(results), "reports": results}


@router.get("/kpis")
def get_department_kpis(db: Session = Depends(get_db)):
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
            "achievement_rate": round((r.achieved_value / r.target_value) * 100, 1) if r.target_value > 0 else 0.0,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for r in records
    ]
    return {"status": "success", "count": len(results), "kpis": results}


@router.get("/export-kpis-excel")
def export_department_kpis_excel(db: Session = Depends(get_db)):
    records = db.query(DepartmentKPIDB).all()
    data = [
        {
            "Department": r.department_name,
            "Area of Focus": r.area_of_focus,
            "KPI Title": r.kpi_title,
            "Target": r.target_value,
            "Achieved": r.achieved_value,
            "Achievement (%)": round((r.achieved_value / r.target_value) * 100, 1) if r.target_value > 0 else 0.0,
            "Period": r.quarter_period,
            "Logged Date": r.created_at.strftime("%Y-%m-%d")
        }
        for r in records
    ]
    df = pd.DataFrame(data)
    if df.empty:
        df = pd.DataFrame(columns=["Department", "Area of Focus", "KPI Title", "Target", "Achieved", "Achievement (%)", "Period", "Logged Date"])

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="FMITI_Department_KPIs")
    output.seek(0)

    headers = {'Content-Disposition': 'attachment; filename="FMITI_Departmental_KPI_Report.xlsx"'}
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')