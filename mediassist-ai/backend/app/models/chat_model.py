from pydantic import BaseModel



class ChatRequest(BaseModel):
    message: str
    language: str = "en"

    age: str = ""
    pregnancy_status: str = ""
    allergies: str = ""
    existing_conditions: str = ""
    current_medications: str = ""

    