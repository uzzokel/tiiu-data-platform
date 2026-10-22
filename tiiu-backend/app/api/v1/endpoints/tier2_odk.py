import uuid
import io
import xml.etree.ElementTree as ET
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.submission import UniversalSubmissionDB
from app.core.security import require_roles  # Security helper import

router = APIRouter(prefix="/api/v1/tier2/odk", tags=["ODK Tier 2 Pipeline"])


@router.api_route("", methods=["POST", "HEAD"])
@router.api_route("/", methods=["POST", "HEAD"])
@router.api_route("/submission", methods=["POST", "HEAD"])
@router.api_route("/receiver", methods=["POST", "HEAD"])
@router.api_route("/receiver/submission", methods=["POST", "HEAD"])
async def receive_odk_submission(request: Request, db: Session = Depends(get_db)):
    """
    OpenRosa ODK Receiver Endpoint.
    UNPROTECTED: Kept completely open so field enumerators' ODK Collect apps can submit data without authentication blocks.
    """
    if request.method == "HEAD":
        return Response(status_code=204, headers={"X-OpenRosa-Version": "1.0"})

    form_id = "ODK_FIELD_AUDIT"
    instance_id = f"inst_{uuid.uuid4()}"
    parsed_data = {}

    try:
        form = await request.form()
        if "xml_submission_file" in form:
            upload_file = form["xml_submission_file"]
            content = await upload_file.read()
            xml_str = content.decode("utf-8", errors="ignore")
            
            try:
                root = ET.fromstring(xml_str)
                form_id = root.tag.split('}')[-1] if '}' in root.tag else root.tag
                
                # Recursive helper to extract all nested XML values into a flat dictionary
                def parse_element(elem, prefix=""):
                    nonlocal instance_id
                    for child in elem:
                        tag_name = child.tag.split('}')[-1] if '}' in child.tag else child.tag
                        full_key = f"{prefix}_{tag_name}" if prefix else tag_name
                        if len(child) > 0:
                            parse_element(child, full_key)
                        else:
                            parsed_data[full_key] = child.text
                            if tag_name.lower() in ["instanceid", "instance_id"]:
                                instance_id = child.text or instance_id

                parse_element(root)
            except Exception as xml_err:
                parsed_data["parse_error"] = str(xml_err)
                parsed_data["raw_xml"] = xml_str
        else:
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

    # Ensure unique instance ID to satisfy SQLite unique constraints
    existing = db.query(UniversalSubmissionDB).filter_by(instance_id=instance_id).first()
    if existing:
        instance_id = f"{instance_id}_{uuid.uuid4().hex[:6]}"

    try:
        submission = UniversalSubmissionDB(
            form_id=form_id,
            instance_id=instance_id,
            data=parsed_data
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
        print(f"✅ DB INSERT SUCCESS: Created Submission ID #{submission.id} (Instance: {submission.instance_id})")
    except Exception as db_err:
        db.rollback()
        print(f"❌ DB INSERT ERROR: {str(db_err)}")
        raise HTTPException(status_code=500, detail=f"Database commit error: {str(db_err)}")

    return Response(
        content='<?xml version="1.0" encoding="UTF-8" ?><OpenRosaResponse xmlns="http://openrosa.org/http/response"><message startup="true">Success</message></OpenRosaResponse>',
        status_code=201,
        media_type="text/xml"
    )


@router.get("/submissions")
def get_odk_submissions(db: Session = Depends(get_db)):
    """
    Returns list of received ODK field submissions formatted for the Next.js Field Intelligence Hub dashboard.
    """
    records = db.query(UniversalSubmissionDB).order_by(UniversalSubmissionDB.received_at.desc()).all()
    
    formatted_submissions = []
    for r in records:
        payload = r.data or {}
        enumerator_id = (
            payload.get("enumerator_id") or 
            payload.get("enumerator") or 
            payload.get("meta_enumerator_id") or 
            "ENUM-001"
        )
        location = (
            payload.get("location") or 
            payload.get("lga") or 
            payload.get("state") or 
            "Abuja, FCT"
        )
        
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


@router.delete(
    "/submissions/{submission_id}",
    dependencies=[Depends(require_roles(["super_admin"]))]
)
def delete_odk_submission(submission_id: int, db: Session = Depends(get_db)):
    """
    Deletes a specific ODK form submission record by its database ID.
    PROTECTED: Requires 'super_admin' role.
    """
    record = db.query(UniversalSubmissionDB).filter(UniversalSubmissionDB.id == submission_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Submission record not found")
    
    db.delete(record)
    db.commit()
    return {
        "status": "success",
        "message": f"Submission {submission_id} deleted successfully"
    }


@router.delete(
    "/submissions",
    dependencies=[Depends(require_roles(["super_admin"]))]
)
def delete_all_odk_submissions(db: Session = Depends(get_db)):
    """
    Deletes ALL ODK form submissions from the database.
    PROTECTED: Requires 'super_admin' role.
    """
    deleted_count = db.query(UniversalSubmissionDB).delete()
    db.commit()
    return {
        "status": "success",
        "message": f"Deleted all {deleted_count} submission records successfully"
    }


@router.get(
    "/export-excel",
    dependencies=[Depends(require_roles(["super_admin", "department_officer", "parastatal_officer"]))]
)
def export_odk_submissions_excel(db: Session = Depends(get_db)):
    """
    Exports ODK submissions to an Excel file.
    PROTECTED: Requires 'super_admin', 'department_officer', or 'parastatal_officer' role.
    """
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
                clean_key = str(key).replace("_", " ").title()
                row[clean_key] = val
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