import uuid
import io
import xml.etree.ElementTree as ET
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.submission import UniversalSubmissionDB

router = APIRouter(prefix="/api/v1/tier2/odk", tags=["ODK Tier 2 Pipeline"])

@router.api_route("", methods=["POST", "HEAD"])
@router.api_route("/", methods=["POST", "HEAD"])
@router.api_route("/submission", methods=["POST", "HEAD"])
@router.api_route("/receiver", methods=["POST", "HEAD"])
@router.api_route("/receiver/submission", methods=["POST", "HEAD"])
async def receive_odk_submission(request: Request, db: Session = Depends(get_db)):
    """
    OpenRosa endpoint compatible with ODK Collect multipart/form-data submissions.
    Extracts instanceID and form data securely.
    """
    if request.method == "HEAD":
        return Response(status_code=204, headers={"X-OpenRosa-Version": "1.0"})

    form_id = "ODK_FIELD_AUDIT"
    instance_id = f"inst_{uuid.uuid4()}"
    parsed_data = {}

    try:
        # Check if request is multipart/form-data (sent by ODK Collect)
        form = await request.form()
        if "xml_submission_file" in form:
            upload_file = form["xml_submission_file"]
            content = await upload_file.read()
            xml_str = content.decode("utf-8", errors="ignore")
            
            # Parse XML payload from ODK
            try:
                root = ET.fromstring(xml_str)
                form_id = root.tag.split('}')[-1] if '}' in root.tag else root.tag
                
                # Extract all tags as key-value pairs
                for child in root:
                    tag_name = child.tag.split('}')[-1] if '}' in child.tag else child.tag
                    if tag_name.lower() == "meta":
                        for meta_child in child:
                            meta_tag = meta_child.tag.split('}')[-1] if '}' in meta_child.tag else meta_child.tag
                            if meta_tag.lower() in ["instanceid", "instance_id"]:
                                instance_id = meta_child.text or instance_id
                            parsed_data[meta_tag] = meta_child.text
                    else:
                        parsed_data[tag_name] = child.text
            except Exception:
                parsed_data["raw_xml"] = xml_str
        else:
            # Fallback for JSON requests
            try:
                json_data = await request.json()
                parsed_data = json_data
                form_id = json_data.get("form_id", form_id)
                instance_id = json_data.get("instance_id") or json_data.get("instanceId") or instance_id
            except Exception:
                body = await request.body()
                parsed_data["raw_body"] = body.decode("utf-8", errors="ignore")
    except Exception as e:
        parsed_data["error"] = str(e)

    # Ensure uniqueness to prevent SQLite IntegrityError
    existing = db.query(UniversalSubmissionDB).filter_by(instance_id=instance_id).first()
    if existing:
        instance_id = f"{instance_id}_{uuid.uuid4().hex[:6]}"

    submission = UniversalSubmissionDB(
        form_id=form_id,
        instance_id=instance_id,
        data=parsed_data
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return Response(
        content='<?xml version="1.0" encoding="UTF-8" ?><OpenRosaResponse xmlns="http://openrosa.org/http/response"><message startup="true">Success</message></OpenRosaResponse>',
        status_code=201,
        media_type="text/xml"
    )


@router.get("/submissions")
def get_odk_submissions(db: Session = Depends(get_db)):
    records = db.query(UniversalSubmissionDB).order_by(UniversalSubmissionDB.received_at.desc()).all()
    
    formatted_submissions = []
    for r in records:
        payload = r.data or {}
        enumerator_id = payload.get("enumerator_id") or payload.get("enumerator") or payload.get("meta", {}).get("enumerator_id") or "ENUM-001"
        location = payload.get("location") or payload.get("lga") or payload.get("state") or "Abuja, FCT"
        
        formatted_submissions.append({
            "id": r.id,
            "form_id": r.form_id,
            "instance_id": r.instance_id,
            "enumerator_id": enumerator_id,
            "location": location,
            "received_at": r.received_at.strftime("%Y-%m-%d %H:%M:%S"),
            "data": payload
        })

    return {
        "status": "success",
        "count": len(formatted_submissions),
        "submissions": formatted_submissions
    }


@router.get("/export-excel")
def export_odk_submissions_excel(db: Session = Depends(get_db)):
    records = db.query(UniversalSubmissionDB).order_by(UniversalSubmissionDB.received_at.desc()).all()
    
    flattened_data = []
    for r in records:
        row = {
            "Submission DB ID": r.id,
            "Form ID": r.form_id,
            "Instance ID": r.instance_id,
            "Received Timestamp": r.received_at.strftime("%Y-%m-%d %H:%M:%S"),
        }
        if isinstance(r.data, dict):
            for key, val in r.data.items():
                row[str(key).replace("_", " ").title()] = str(val) if isinstance(val, (dict, list)) else val
        flattened_data.append(row)

    df = pd.DataFrame(flattened_data)
    if df.empty:
        df = pd.DataFrame(columns=["Submission DB ID", "Form ID", "Instance ID", "Received Timestamp"])

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="ODK_Field_Submissions")
    output.seek(0)

    headers = {'Content-Disposition': 'attachment; filename="FMITI_ODK_Field_Audits_Export.xlsx"'}
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')