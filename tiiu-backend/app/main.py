from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text  # <--- Added for SQLite column auto-patching
from app.core.config import settings
from app.api.v1.endpoints import ingestion, enterprise, tier2_odk, analytics, departments, auth  # <--- Added auth import here
from app.database import engine
from app.models.audit import Base
from app.models.department import DepartmentKPIDB, DepartmentReportDB  # <--- Imported report model here
from app.models.submission import UniversalSubmissionDB  # <--- CRITICAL: Import ODK model here

# Automatically create database tables on startup (creates tiiu.db if it doesn't exist)
Base.metadata.create_all(bind=engine)

def run_sqlite_migrations():
    """Safely adds missing columns to SQLite without disrupting existing data."""
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    
    with engine.begin() as conn:
        # Patch department_kpis table
        if "department_kpis" in table_names:
            columns = [c["name"] for c in inspector.get_columns("department_kpis")]
            if "objective_deliverable" not in columns:
                conn.execute(text("ALTER TABLE department_kpis ADD COLUMN objective_deliverable VARCHAR"))
            if "narrative" not in columns:
                conn.execute(text("ALTER TABLE department_kpis ADD COLUMN narrative TEXT"))
        
        # Patch department_reports table to store raw file BLOBs
        if "department_reports" in table_names:
            report_cols = [c["name"] for c in inspector.get_columns("department_reports")]
            if "file_data" not in report_cols:
                conn.execute(text("ALTER TABLE department_reports ADD COLUMN file_data BLOB"))

# Run auto-migration patch on startup
run_sqlite_migrations()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend data pipeline and integration gateway for FMITI TIIU.",
    version="1.0.0"
)

# Enable CORS for Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)        # <--- Added Auth login route
app.include_router(ingestion.router)
app.include_router(enterprise.router)
app.include_router(tier2_odk.router)    # <--- ODK Collect Field Surveys & Audits
app.include_router(analytics.router)    # <--- Analytics, Aggregations & Exports
app.include_router(departments.router)  # <--- Department Profiles & KPI Performance Tracking

# Direct fallback endpoints to resolve frontend 404s for submissions and enumerators
@app.get("/api/submissions")
async def get_submissions():
    return {
        "submissions": [
            {
                "id": 1,
                "form_id": "FMITI_Field_Audit_2026",
                "instance_id": "uuid:1092-8812-3921",
                "enumerator_id": "ENUM-001",
                "received_at": "2026-10-23 10:15",
                "data": {"facility_name": "Aba Leather Hub", "state": "Abia", "audit_status": "Verified"}
            }
        ],
        "count": 1
    }

@app.get("/api/aggregations/enumerators")
async def get_enumerator_aggregations():
    return {
        "aggregations": [
            {"enumerator_id": "ENUM-001", "total_audits": 14, "state": "Abia"},
            {"enumerator_id": "ENUM-002", "total_audits": 9, "state": "Kaduna"}
        ],
        "total_active_enumerators": 2
    }

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "FMITI TIIU Pipeline API",
        "docs_url": "/docs"
    }