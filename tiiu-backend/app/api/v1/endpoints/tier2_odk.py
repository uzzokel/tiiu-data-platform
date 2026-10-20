import os
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException, Request, Response, status, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit import UniversalSubmissionDB

router = APIRouter(prefix="/api/v1/tier2/odk", tags=["Tier 2: ODK Collect Field Surveys & Audits"])

FORMS_DIR = os.path.join(os.path.dirname(__file__), "../../../forms")


@router.get("/formList")
async def get_form_list(request: Request):
    base_url = str(request.base_url).rstrip("/")
    download_url = f"{base_url}/api/v1/tier2/odk/forms/FMITI_CLUSTER_AUDIT_V1.xml"

    xml_content = f"""<?xml version='1.0' encoding='UTF-8' ?>
<xforms xmlns="http://openrosa.org/xforms/xformsList">
    <xform>
        <formID>FMITI_CLUSTER_AUDIT_V1</formID>
        <name>FMITI Industrial Cluster Audit Form</name>
        <version>1.0</version>
        <hash>md5:dummyhashvalue123456789</hash>
        <downloadUrl>{download_url}</downloadUrl>
    </xform>
</xforms>
"""
    return Response(
        content=xml_content,
        media_type="text/xml",
        headers={"X-OpenRosa-Version": "1.0"}
    )


@router.get("/forms/{form_filename}")
async def download_form_file(form_filename: str):
    file_path = os.path.join(FORMS_DIR, form_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Requested form file not found.")
    
    return FileResponse(
        path=file_path,
        media_type="application/xml",
        filename=form_filename,
        headers={"X-OpenRosa-Version": "1.0"}
    )


# ODK Collect HEAD Handshake Verification
@router.head("/submission")
async def receive_odk_submission_head():
    return Response(status_code=204, headers={"X-OpenRosa-Version": "1.0"})


# ODK Collect POST Submission Payload
@router.post("/submission")
async def receive_odk_submission_post(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    xml_file = form_data.get("xml_submission_file")
    
    if xml_file:
        xml_content = await xml_file.read()
        xml_string = xml_content.decode("utf-8")
        
        parsed_fields = {}
        form_id = None
        instance_id = None

        try:
            root = ET.fromstring(xml_content)
            form_id = root.attrib.get("id") or root.tag.split("}")[-1]

            for elem in root.iter():
                tag_name = elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag
                if elem.text and elem.text.strip():
                    parsed_fields[tag_name] = elem.text.strip()

            instance_id = parsed_fields.get("instanceID")
        except Exception as e:
            parsed_fields["parse_error"] = str(e)

        try:
            db_record = UniversalSubmissionDB(
                form_id=form_id,
                instance_id=instance_id,
                form_data=parsed_fields,
                raw_xml=xml_string
            )
            db.add(db_record)
            db.commit()
            print(f"Successfully saved submission for form '{form_id}' into Universal DB!")
        except Exception as db_err:
            db.rollback()
            print(f"Error saving submission to database: {db_err}")
    
    return Response(
        content='<OpenRosaResponse xmlns="http://openrosa.org/http/response"><message>Success</message></OpenRosaResponse>',
        status_code=201,
        media_type="text/xml",
        headers={"X-OpenRosa-Version": "1.0"}
    )


@router.get("/submissions")
async def list_stored_submissions(db: Session = Depends(get_db)):
    """Fetch all submissions across all form types directly from SQLite."""
    records = db.query(UniversalSubmissionDB).all()
    return {
        "total_submissions": len(records),
        "submissions": [
            {
                "id": r.id,
                "form_id": r.form_id,
                "instance_id": r.instance_id,
                "data": r.form_data,
                "received_at": r.received_at.isoformat() if r.received_at else None
            } for r in records
        ]
    }