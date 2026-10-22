import os
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt

SECRET_KEY = os.getenv("SECRET_KEY", "FMITI_TIIU_DEV_SECRET_KEY_2026")
ALGORITHM = "HS256"
ENV = os.getenv("ENV", "development")  # Set to 'production' when online
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Tier 1 Hardcoded Admin Emails (Unrestricted Super Admin Access)
TIER_1_ADMIN_EMAILS = [
    "admin@fmiti.gov.ng",
    "tiiu.admin@fmiti.gov.ng",
    "uzzokel@gmail.com"  # Add your primary development/admin email here
]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generates a signed JWT access token containing user claims and role."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def require_roles(allowed_roles: List[str]):
    def role_checker(token: Optional[str] = Depends(oauth2_scheme)):
        # Smooth flow during local dev: Auto-grant dev admin if unauthenticated in dev mode
        if not token:
            if ENV == "development":
                return {"username": "dev_admin", "email": "uzzokel@gmail.com", "role": "super_admin"}
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required."
            )
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_email = payload.get("sub") or payload.get("email") or ""
            user_role = payload.get("role")

            # Tier 1 Override Check: Force super_admin if email matches whitelist
            if user_email.lower().strip() in [e.lower() for e in TIER_1_ADMIN_EMAILS]:
                user_role = "super_admin"
                payload["role"] = "super_admin"

            if user_role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Permission denied for this action."
                )
            return payload
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token session."
            )
    return role_checker