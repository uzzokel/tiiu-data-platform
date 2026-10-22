from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import (
    create_access_token, 
    TIER_1_ADMIN_EMAILS, 
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

# In-memory storage for registered accounts
REGISTERED_USERS = {}

class RegisterSchema(BaseModel):
    email: str  # <--- Standard str replaces EmailStr to fix the missing email-validator dependency
    password: str
    role: Optional[str] = "field_auditor"


@router.post("/register")
async def register_account(payload: RegisterSchema):
    """
    Registers a new user into the platform.
    """
    email_clean = payload.email.lower().strip()
    if email_clean in REGISTERED_USERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists."
        )

    assigned_role = "super_admin" if email_clean in [e.lower() for e in TIER_1_ADMIN_EMAILS] else payload.role
    
    REGISTERED_USERS[email_clean] = {
        "password": payload.password,
        "role": assigned_role
    }

    return {
        "message": "User registered successfully. You can now log in.",
        "email": email_clean,
        "role": assigned_role
    }


@router.post("/login")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible login endpoint. 
    Expects 'username' (can be email) and 'password' submitted via form-data.
    Returns a signed JWT bearer token containing the user's role.
    """
    email_or_username = form_data.username.lower().strip()
    password = form_data.password

    mock_user_db = {
        "admin@fmiti.gov.ng": {"role": "super_admin", "name": "System Admin"},
        "dept.officer@fmiti.gov.ng": {"role": "department_officer", "name": "Department KPI Officer"},
        "parastatal.cac@fmiti.gov.ng": {"role": "parastatal_officer", "name": "CAC Registry Officer"},
        "field.auditor@fmiti.gov.ng": {"role": "field_auditor", "name": "Field Enumerator"}
    }

    user_record = mock_user_db.get(email_or_username) or REGISTERED_USERS.get(email_or_username)

    # Check Tier 1 Admin Whitelist
    if email_or_username in [e.lower() for e in TIER_1_ADMIN_EMAILS]:
        resolved_role = "super_admin"
    elif user_record:
        resolved_role = user_record["role"]
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please register your account first.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create JWT Token payload
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {
        "sub": email_or_username,
        "role": resolved_role
    }
    
    access_token = create_access_token(data=token_data, expires_delta=access_token_expires)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "email": email_or_username,
        "role": resolved_role
    }