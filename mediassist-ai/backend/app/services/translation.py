from deep_translator import GoogleTranslator

def translate_to_english(text: str) -> str:
    try:
        return GoogleTranslator(source="auto", target="en").translate(text)
    except Exception:
        return text

def translate_to_target(text: str, target_lang: str) -> str:
    if not target_lang or target_lang == "en":
        return text
    try:
        return GoogleTranslator(source="auto", target=target_lang).translate(text)
    except Exception:
        return text