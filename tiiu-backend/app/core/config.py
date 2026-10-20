import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "FMITI TIIU Data Intelligence Pipeline"
    API_V1_STR: str = "/api/v1"
    
    # Parastatal API Base URLs
    CAC_API_BASE: str = os.getenv("CAC_API_BASE", "https://api.cac.gov.ng")
    FIRS_API_BASE: str = os.getenv("FIRS_API_BASE", "https://api.firs.gov.ng")
    BOI_API_BASE: str = os.getenv("BOI_API_BASE", "https://api.boi.ng")
    NEPC_API_BASE: str = os.getenv("NEPC_API_BASE", "https://api.nepc.gov.ng")
    SON_API_BASE: str = os.getenv("SON_API_BASE", "https://api.son.gov.ng")

settings = Settings()