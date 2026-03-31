import base64
import json
import os
import requests
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")


def check_emergency_symptoms(user_message: str):
    text = user_message.lower()

    emergency_keywords = [
        "chest pain",
        "breathing problem",
        "difficulty breathing",
        "shortness of breath",
        "unconscious",
        "fainted",
        "fainting",
        "seizure",
        "stroke",
        "slurred speech",
        "one side weakness",
        "heavy bleeding",
        "severe bleeding",
        "poison",
        "poisoning",
        "overdose",
        "heart attack",
        "severe allergic reaction",
        "anaphylaxis",
        "not able to breathe",
        "blue lips",
        "vomiting blood",
        "blood in vomit"
    ]

    for keyword in emergency_keywords:
        if keyword in text:
            return {
                "severity": "emergency",
                "is_follow_up_needed": False,
                "follow_up_questions": [],
                "possible_disease": "Medical Emergency",
                "symptom_summary": "Your symptoms may need urgent medical attention.",
                "medicines": ["Do not rely only on chatbot advice."],
                "diet": ["Do not eat or drink anything unless medically advised."],
                "precautions": [
                    "Seek immediate medical help",
                    "Call emergency services or go to the nearest hospital"
                ],
                "see_doctor_if": ["Go immediately"],
                "safety_warnings": [
                    "Emergency symptoms detected",
                    "Do not delay treatment"
                ],
                "disclaimer": "This may be an emergency. Please seek urgent medical care now."
            }

    return None


def detect_triage_and_questions(user_message: str):
    text = user_message.lower()

    fever_words = ["fever", "temperature", "cold", "body pain", "chills"]
    cough_words = ["cough", "throat pain", "sore throat"]
    breathing_words = ["breathing problem", "shortness of breath", "wheezing"]
    stomach_words = ["stomach pain", "vomiting", "diarrhea", "nausea"]
    headache_words = ["headache", "migraine", "dizziness"]

    follow_up_questions = []
    severity = "low"

    if any(word in text for word in fever_words):
        follow_up_questions.extend([
            "How many days have you had fever?",
            "What is your temperature if measured?",
            "Do you also have cough or chills?"
        ])
        severity = "medium"

    if any(word in text for word in cough_words):
        follow_up_questions.extend([
            "Is your cough dry or with mucus?",
            "Do you have sore throat or chest discomfort?",
            "Any breathing difficulty?"
        ])
        severity = "medium"

    if any(word in text for word in breathing_words):
        follow_up_questions.extend([
            "Are you having trouble speaking full sentences?",
            "Do you feel chest tightness?",
            "Are your lips or fingers turning blue?"
        ])
        severity = "high"

    if any(word in text for word in stomach_words):
        follow_up_questions.extend([
            "How many times have you vomited or had loose motions?",
            "Are you able to drink water?",
            "Do you have severe stomach cramps or blood in stool?"
        ])
        severity = "medium"

    if any(word in text for word in headache_words):
        follow_up_questions.extend([
            "How strong is the headache from 1 to 10?",
            "Do you have vomiting, blurred vision, or fever?",
            "Did it start suddenly?"
        ])
        severity = "medium"

    follow_up_questions = list(dict.fromkeys(follow_up_questions))

    return {
        "severity": severity,
        "is_follow_up_needed": len(follow_up_questions) > 0,
        "follow_up_questions": follow_up_questions[:4]
    }


def _safe_json_parse(text: str):
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1 and end > start:
        possible_json = text[start:end + 1]
        try:
            return json.loads(possible_json)
        except json.JSONDecodeError:
            pass

    return {
        "severity": "medium",
        "is_follow_up_needed": False,
        "follow_up_questions": [],
        "possible_disease": "Unknown",
        "symptom_summary": text,
        "medicines": ["Consult a doctor"],
        "diet": ["Light food", "Water"],
        "precautions": ["Monitor symptoms"],
        "see_doctor_if": ["Symptoms get worse"],
        "safety_warnings": [
            "Medicine advice may vary depending on allergies, age, or health conditions."
        ],
        "disclaimer": "This is not a confirmed medical diagnosis. Please consult a doctor."
    }


def get_ai_response(
    user_message: str,
    age: str = "",
    pregnancy_status: str = "",
    allergies: str = "",
    existing_conditions: str = "",
    current_medications: str = "",
):
    emergency_result = check_emergency_symptoms(user_message)
    if emergency_result:
        return emergency_result

    triage_result = detect_triage_and_questions(user_message)

    if not API_KEY:
        return {
            "severity": triage_result["severity"],
            "is_follow_up_needed": triage_result["is_follow_up_needed"],
            "follow_up_questions": triage_result["follow_up_questions"],
            "possible_disease": "Configuration Error",
            "symptom_summary": "Missing API key",
            "medicines": ["Check .env file"],
            "diet": ["N/A"],
            "precautions": ["Add OPENROUTER_API_KEY"],
            "see_doctor_if": ["Backend is fixed"],
            "safety_warnings": ["System configuration issue."],
            "disclaimer": "System configuration issue."
        }

    prompt = f"""
You are an AI medical symptom guidance assistant.

User symptoms:
{user_message}

Additional safety details:
- Age: {age if age else "Not provided"}
- Pregnancy status: {pregnancy_status if pregnancy_status else "Not provided"}
- Allergies: {allergies if allergies else "Not provided"}
- Existing conditions: {existing_conditions if existing_conditions else "Not provided"}
- Current medications: {current_medications if current_medications else "Not provided"}

Return ONLY valid JSON in exactly this format:

{{
  "severity": "low/medium/high",
  "is_follow_up_needed": true,
  "follow_up_questions": ["...", "..."],
  "possible_disease": "...",
  "symptom_summary": "...",
  "medicines": ["...", "..."],
  "diet": ["...", "..."],
  "precautions": ["...", "..."],
  "see_doctor_if": ["...", "..."],
  "safety_warnings": ["...", "..."],
  "disclaimer": "This is not a confirmed medical diagnosis. Please consult a doctor."
}}

Rules:
- Do not claim certainty.
- Do not say the patient definitely has a disease.
- Suggest only common symptom-relief medicines for mild cases.
- Do not recommend dangerous prescription-only treatment casually.
- Always include precautions.
- Always include warning signs for doctor consultation.
- Always include safety_warnings based on allergies, pregnancy, age, conditions, or medicine interactions if relevant.
- If symptoms sound serious, say immediate medical help is needed.
- Add severity as low, medium, or high.
- If symptoms are incomplete, set is_follow_up_needed to true.
- Add 2 to 4 useful follow_up_questions when needed.
- If symptoms are clear enough, set is_follow_up_needed to false and follow_up_questions to [].
"""

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "MediAssist AI"
            },
            json={
                "model": MODEL,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3
            },
            timeout=30
        )

        result = response.json()
        print("FULL RESPONSE:", result)

        if response.status_code != 200:
            return {
                "severity": triage_result["severity"],
                "is_follow_up_needed": triage_result["is_follow_up_needed"],
                "follow_up_questions": triage_result["follow_up_questions"],
                "possible_disease": "API Error",
                "symptom_summary": "Model request failed",
                "medicines": ["Check model or API key"],
                "diet": ["N/A"],
                "precautions": [str(result)],
                "see_doctor_if": ["Retry after fixing API issue"],
                "safety_warnings": ["System/API issue."],
                "disclaimer": "System error."
            }

        choices = result.get("choices")
        if not choices:
            return {
                "severity": triage_result["severity"],
                "is_follow_up_needed": triage_result["is_follow_up_needed"],
                "follow_up_questions": triage_result["follow_up_questions"],
                "possible_disease": "No Response",
                "symptom_summary": "No AI output received",
                "medicines": ["N/A"],
                "diet": ["N/A"],
                "precautions": ["Try again"],
                "see_doctor_if": ["Repeated error continues"],
                "safety_warnings": ["No response from model."],
                "disclaimer": "System error."
            }

        reply = choices[0]["message"]["content"]
        print("AI TEXT:", reply)

        parsed = _safe_json_parse(reply)

        parsed["severity"] = parsed.get("severity") or triage_result["severity"]
        parsed["is_follow_up_needed"] = parsed.get(
            "is_follow_up_needed",
            triage_result["is_follow_up_needed"]
        )
        parsed["follow_up_questions"] = parsed.get("follow_up_questions") or triage_result["follow_up_questions"]

        return {
            "severity": parsed.get("severity", triage_result["severity"]),
            "is_follow_up_needed": parsed.get(
                "is_follow_up_needed",
                triage_result["is_follow_up_needed"]
            ),
            "follow_up_questions": parsed.get(
                "follow_up_questions",
                triage_result["follow_up_questions"]
            ),
            "possible_disease": parsed.get("possible_disease", "Unknown"),
            "symptom_summary": parsed.get("symptom_summary", "No summary available"),
            "medicines": parsed.get("medicines", ["Consult a doctor"]),
            "diet": parsed.get("diet", ["Healthy light meals"]),
            "precautions": parsed.get("precautions", ["Monitor symptoms"]),
            "see_doctor_if": parsed.get("see_doctor_if", ["Symptoms worsen"]),
            "safety_warnings": parsed.get(
                "safety_warnings",
                ["Medicine advice may vary depending on allergies, age, or health conditions."]
            ),
            "disclaimer": parsed.get(
                "disclaimer",
                "This is not a confirmed medical diagnosis. Please consult a doctor."
            )
        }

    except Exception as e:
        print("ERROR:", str(e))
        return {
            "severity": triage_result["severity"],
            "is_follow_up_needed": triage_result["is_follow_up_needed"],
            "follow_up_questions": triage_result["follow_up_questions"],
            "possible_disease": "Error",
            "symptom_summary": str(e),
            "medicines": ["Unable to fetch"],
            "diet": ["N/A"],
            "precautions": ["Check backend connection"],
            "see_doctor_if": ["Problem continues"],
            "safety_warnings": ["System/backend issue."],
            "disclaimer": "System error."
        }


def analyze_skin_image(
    image_bytes: bytes,
    filename: str = "skin-image.jpg",
    content_type: str = "image/jpeg",
    language: str = "en",
    age: str = "",
    pregnancy_status: str = "",
    allergies: str = "",
    existing_conditions: str = "",
    current_medications: str = "",
    additional_notes: str = "",
):
    if not API_KEY:
        return {
            "severity": "medium",
            "possible_disease": "Configuration Error",
            "symptom_summary": "Missing API key for skin scan.",
            "medicines": ["Check backend .env file"],
            "diet": ["Stay hydrated"],
            "precautions": ["Add OPENROUTER_API_KEY before using skin scan."],
            "see_doctor_if": ["The issue spreads, worsens, or becomes painful"],
            "safety_warnings": ["Image-based guidance is not a confirmed diagnosis."],
            "disclaimer": "This is not a confirmed medical diagnosis. Please consult a dermatologist."
        }

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    note_text = additional_notes.strip() if additional_notes else "No extra notes provided."

    prompt = f"""
You are a cautious dermatology triage assistant. Review the uploaded skin image and provide guidance.

Patient details:
- Age: {age if age else 'Not provided'}
- Pregnancy status: {pregnancy_status if pregnancy_status else 'Not provided'}
- Allergies: {allergies if allergies else 'Not provided'}
- Existing conditions: {existing_conditions if existing_conditions else 'Not provided'}
- Current medications: {current_medications if current_medications else 'Not provided'}
- Extra notes from user: {note_text}

Return ONLY valid JSON in this exact format:
{{
  "severity": "low/medium/high",
  "possible_disease": "Most likely possibility or short differential",
  "symptom_summary": "What the image may suggest, including uncertainty",
  "medicines": ["...", "..."],
  "diet": ["...", "..."],
  "precautions": ["...", "..."],
  "see_doctor_if": ["...", "..."],
  "safety_warnings": ["...", "..."],
  "disclaimer": "This is not a confirmed medical diagnosis. Please consult a dermatologist."
}}

Rules:
- Be medically cautious and say clearly when the image is unclear.
- Do not claim certainty.
- Do not identify dangerous treatment as certain or prescribe strong medicines casually.
- Suggest only simple OTC symptom-relief ideas where reasonable.
- Mention hygiene, avoiding scratching, and when urgent care is needed when relevant.
- If the image quality is poor, say so in symptom_summary.
- If signs could fit infection, allergy, fungal rash, acne, eczema, psoriasis, dermatitis, heat rash, or bites, mention uncertainty.
- Keep advice concise and practical.
"""

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "MediAssist AI"
            },
            json={
                "model": os.getenv("OPENROUTER_VISION_MODEL", MODEL),
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:{content_type};base64,{image_b64}"}}
                        ]
                    }
                ],
                "temperature": 0.2
            },
            timeout=45
        )

        result = response.json()

        if response.status_code != 200:
            return {
                "severity": "medium",
                "possible_disease": "API Error",
                "symptom_summary": "Skin scan request failed.",
                "medicines": ["Check model or API key"],
                "diet": ["Healthy hydration"],
                "precautions": [str(result)],
                "see_doctor_if": ["The rash or lesion worsens"],
                "safety_warnings": ["Image-based guidance is limited."],
                "disclaimer": "System error. Please consult a dermatologist for an accurate diagnosis."
            }

        choices = result.get("choices")
        if not choices:
            raise ValueError("No AI output received")

        reply = choices[0]["message"]["content"]
        parsed = _safe_json_parse(reply)

        return {
            "severity": parsed.get("severity", "medium"),
            "possible_disease": parsed.get("possible_disease", "Unclear skin condition"),
            "symptom_summary": parsed.get("symptom_summary", "The uploaded image was reviewed, but the findings are uncertain."),
            "medicines": parsed.get("medicines", ["Use only mild symptom-relief products if needed"]),
            "diet": parsed.get("diet", ["Stay hydrated", "Maintain a balanced diet"]),
            "precautions": parsed.get("precautions", ["Keep the affected area clean and avoid scratching"]),
            "see_doctor_if": parsed.get("see_doctor_if", ["The condition spreads, becomes painful, or does not improve"]),
            "safety_warnings": parsed.get("safety_warnings", ["Image-based guidance is not a confirmed diagnosis."]),
            "disclaimer": parsed.get("disclaimer", "This is not a confirmed medical diagnosis. Please consult a dermatologist.")
        }
    except Exception as e:
        return {
            "severity": "medium",
            "possible_disease": "Error",
            "symptom_summary": str(e),
            "medicines": ["Unable to analyze image right now"],
            "diet": ["N/A"],
            "precautions": ["Check backend connection and API configuration"],
            "see_doctor_if": ["The issue is worsening or painful"],
            "safety_warnings": ["System/backend issue."],
            "disclaimer": "System error. Please consult a dermatologist for an accurate diagnosis."
        }
