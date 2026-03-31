from fastapi import APIRouter, HTTPException
from app.models.chat_model import ChatRequest
from app.services.ai_service import get_ai_response
from app.services.translation import translate_to_english, translate_to_target

router = APIRouter()


def translate_list(items, target_lang):
    return [translate_to_target(item, target_lang) for item in items]


@router.post("/chat")
@router.post("/api/chat")
def chat(request: ChatRequest):
    try:
        # Convert input to English
        english_text = translate_to_english(request.message)

        # Get AI response
        ai_reply = get_ai_response(
            english_text,
            age=request.age,
            pregnancy_status=request.pregnancy_status,
            allergies=request.allergies,
            existing_conditions=request.existing_conditions,
            current_medications=request.current_medications,
        )

        # Translate response to user language
        translated_response = {
            "severity": ai_reply.get("severity", "medium"),
            "is_follow_up_needed": ai_reply.get("is_follow_up_needed", False),
            "follow_up_questions": translate_list(
                ai_reply.get("follow_up_questions", []),
                request.language
            ),
            "possible_disease": translate_to_target(
                ai_reply.get("possible_disease", "Unknown"),
                request.language
            ),
            "symptom_summary": translate_to_target(
                ai_reply.get("symptom_summary", ""),
                request.language
            ),
            "medicines": translate_list(
                ai_reply.get("medicines", []),
                request.language
            ),
            "diet": translate_list(
                ai_reply.get("diet", []),
                request.language
            ),
            "precautions": translate_list(
                ai_reply.get("precautions", []),
                request.language
            ),
            "see_doctor_if": translate_list(
                ai_reply.get("see_doctor_if", []),
                request.language
            ),
            "safety_warnings": translate_list(
                ai_reply.get("safety_warnings", []),
                request.language
            ),
            "disclaimer": translate_to_target(
                ai_reply.get("disclaimer", ""),
                request.language
            ),
        }

        return translated_response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))