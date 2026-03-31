from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.services.ai_service import analyze_skin_image
from app.services.translation import translate_to_target

router = APIRouter()


def translate_list(items, target_lang):
    return [translate_to_target(item, target_lang) for item in items]


@router.post("/skin-scan")
@router.post("/api/skin-scan")
async def skin_scan(
    image: UploadFile = File(...),
    language: str = Form("en"),
    age: str = Form(""),
    pregnancy_status: str = Form(""),
    allergies: str = Form(""),
    existing_conditions: str = Form(""),
    current_medications: str = Form(""),
    notes: str = Form(""),
):
    try:
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Please upload an image file.")

        image_bytes = await image.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Uploaded image is empty.")
        if len(image_bytes) > 8 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image is too large. Please upload an image under 8 MB.")

        ai_reply = analyze_skin_image(
            image_bytes=image_bytes,
            filename=image.filename or "skin-image.jpg",
            content_type=image.content_type,
            language=language,
            age=age,
            pregnancy_status=pregnancy_status,
            allergies=allergies,
            existing_conditions=existing_conditions,
            current_medications=current_medications,
            additional_notes=notes,
        )

        return {
            "severity": ai_reply.get("severity", "medium"),
            "possible_disease": translate_to_target(ai_reply.get("possible_disease", "Unknown"), language),
            "symptom_summary": translate_to_target(ai_reply.get("symptom_summary", ""), language),
            "medicines": translate_list(ai_reply.get("medicines", []), language),
            "diet": translate_list(ai_reply.get("diet", []), language),
            "precautions": translate_list(ai_reply.get("precautions", []), language),
            "see_doctor_if": translate_list(ai_reply.get("see_doctor_if", []), language),
            "safety_warnings": translate_list(ai_reply.get("safety_warnings", []), language),
            "disclaimer": translate_to_target(ai_reply.get("disclaimer", ""), language),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
