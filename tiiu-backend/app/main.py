from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import ingestion, enterprise, tier2_odk, analytics, departments, auth  # <--- Added auth import here
from app.database import engine
from app.models.audit import Base
from app.models.department import DepartmentKPIDB
from app.models.submission import UniversalSubmissionDB  # <--- CRITICAL: Import ODK model here

# Automatically create database tables on startup (creates tiiu.db if it doesn't exist)
Base.metadata.create_all(bind=engine)

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
app.include_router(auth.router)         # <--- Added Auth login route
app.include_router(ingestion.router)
app.include_router(enterprise.router)
app.include_router(tier2_odk.router)    # <--- ODK Collect Field Surveys & Audits
app.include_router(analytics.router)    # <--- Analytics, Aggregations & Exports
app.include_router(departments.router)  # <--- Department Profiles & KPI Performance Tracking

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "FMITI TIIU Pipeline API",
        "docs_url": "/docs"
    }