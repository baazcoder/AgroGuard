# app/services/gemini_service.py

import json
import logging
from typing import Optional, Any, List, Union

from google import genai
from google.genai import types

from app.config import settings
from app.schemas.analysis import DiagnosisResult

logger = logging.getLogger(__name__)

# ============================================================
# CONFIGURATION
# ============================================================

DEFAULT_MODEL = getattr(
    settings,
    "GEMINI_MODEL",
    "gemini-3.6-flash"
)

SUPPORTED_LANGUAGES = {
    "english": "English",
    "hindi": "Hindi",
    "punjabi": "Punjabi",
    "bhojpuri": "Bhojpuri",
    "haryanvi": "Haryanvi",
}


# ============================================================
# GEMINI CLIENT
# ============================================================

def _get_client() -> Optional[genai.Client]:
    """
    Create Gemini client only when API key is available.
    """
    api_key = getattr(settings, "GEMINI_API_KEY", None)

    if not api_key:
        logger.warning("GEMINI_API_KEY is not configured.")
        return None

    try:
        return genai.Client(api_key=api_key)
    except Exception as exc:
        logger.exception("Failed to create Gemini client: %s", exc)
        return None


# ============================================================
# LANGUAGE NORMALIZATION
# ============================================================

def _normalize_language(language: Optional[str]) -> str:
    """
    Normalize requested farmer language.
    """
    if not language:
        return "English"

    return SUPPORTED_LANGUAGES.get(language.strip().lower(), "English")


# ============================================================
# SAFE FALLBACK
# ============================================================

def _uncertain_result(
    reason: str = "The image could not be analyzed reliably.",
    language: str = "English",
) -> DiagnosisResult:
    """
    Safe fallback for diagnosis failures.
    """
    return DiagnosisResult(
        crop="Unknown",
        disease="Unable to determine",
        confidence="Uncertain",
        severity="None",
        symptoms=[],
        treatment=[
            "Upload a clear image of the affected plant leaf.",
            "Make sure the leaf occupies most of the image.",
            "Avoid very dark, blurry, or distant photographs.",
            "For serious crop damage, consult a local agricultural expert or KVK."
        ],
        prevention=[
            "Take clear photographs in natural daylight.",
            "Capture both the affected area and a healthy part of the plant."
        ],
        is_uncertain=True,
        summary=reason,
        disclaimer=(
            f"{reason} AI-assisted analysis. This result is uncertain and "
            "should not be treated as a confirmed agricultural diagnosis."
        ),
    )


# ============================================================
# DISEASE DIAGNOSIS PROMPT
# ============================================================

DIAGNOSIS_SYSTEM_PROMPT = """
You are AgroGuard, an AI agricultural crop-health assistant.

Your job is to analyze a photograph of a crop or plant and provide
a cautious agricultural diagnosis.

You must distinguish between:
1. Healthy crop
2. Plant disease
3. Pest/insect damage
4. Nutrient deficiency
5. Environmental or physical damage
6. Uncertain / insufficient evidence

IMPORTANT SAFETY RULES:
- Never fabricate a diagnosis.
- Never claim high confidence when visual evidence is weak.
- If the image is blurry, dark, too distant, not a plant, or does not
  contain enough visible evidence, return an uncertain diagnosis.
- The farmer's provided crop/location information is context only.
  It must NOT be treated as proof of a disease.
- Do not invent symptoms that cannot be observed.
- Do not invent pesticide names or chemical concentrations.
- Do not invent fertilizer dosage.
- If chemical treatment is needed, recommend following approved local labels or consulting KVK/agricultural experts.
- Do not guarantee crop recovery or yield.

If the image is uncertain, set:
- crop = "Unknown" (or the crop name only if clearly recognized)
- disease = "Unable to determine"
- confidence = "Uncertain"
- is_uncertain = true
"""


# ============================================================
# IMAGE ANALYSIS
# ============================================================

async def analyze_crop_image(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
    crop: Optional[str] = None,
    location: Optional[str] = None,
    land_area: Optional[float] = None,
    land_unit: Optional[str] = None,
    soil_type: Optional[str] = None,
    growth_stage: Optional[str] = None,
    language: Optional[str] = "English",
) -> DiagnosisResult:
    """
    Analyze crop image asynchronously using Gemini Vision.
    """
    selected_language = _normalize_language(language)

    if not image_bytes:
        logger.warning("Empty image received.")
        return _uncertain_result("No image was provided.", selected_language)

    client = _get_client()
    if client is None:
        return _uncertain_result("Gemini API is not configured.", selected_language)

    farmer_context = {
        "crop": crop or "Not provided",
        "location": location or "Not provided",
        "land_area": f"{land_area} {land_unit}" if land_area is not None else "Not provided",
        "soil_type": soil_type or "Not provided",
        "growth_stage": growth_stage or "Not provided",
        "preferred_language": selected_language,
    }

    user_prompt = f"""
Analyze the attached crop image.

Farmer context:
{json.dumps(farmer_context, ensure_ascii=False, indent=2)}

First determine if the image contains sufficient visual evidence.
Then evaluate if the plant is healthy, diseased, pest-damaged, nutrient deficient, or uncertain.
Only report symptoms that are clearly visible.
Respond in {selected_language}.
"""

    try:
        image_part = types.Part.from_bytes(
            data=image_bytes,
            mime_type=mime_type,
        )

        # Async non-blocking call via client.aio
        response = await client.aio.models.generate_content(
            model=DEFAULT_MODEL,
            contents=[user_prompt, image_part],
            config=types.GenerateContentConfig(
                system_instruction=DIAGNOSIS_SYSTEM_PROMPT,
                temperature=0.1,
                response_mime_type="application/json",
            ),
        )

        if not response or not response.text:
            logger.warning("Gemini returned an empty response.")
            return _uncertain_result("The AI model returned no usable result.", selected_language)

        raw_data = json.loads(response.text)
        return _build_diagnosis_result(raw_data, selected_language)

    except json.JSONDecodeError:
        logger.exception("Gemini returned invalid JSON.")
        return _uncertain_result("The AI response could not be interpreted.", selected_language)
    except Exception as exc:
        logger.exception("Crop image analysis failed: %s", exc)
        return _uncertain_result("The crop image could not be analyzed at this time.", selected_language)


# ============================================================
# DIAGNOSIS RESULT BUILDER & SANITIZER
# ============================================================

def _build_diagnosis_result(data: dict[str, Any], language: str) -> DiagnosisResult:
    """
    Sanitize and enforce safety contracts on diagnosis output.
    """
    if not isinstance(data, dict):
        return _uncertain_result("Invalid AI response.", language)

    crop = str(data.get("crop") or "Unknown")
    disease = str(data.get("disease") or "Unable to determine")
    confidence = str(data.get("confidence") or "Uncertain")
    severity = str(data.get("severity") or "None")

    def _sanitize_list(field: Any) -> list[str]:
        if isinstance(field, list):
            return [str(i).strip() for i in field if str(i).strip()]
        if field:
            return [str(field).strip()]
        return []

    symptoms = _sanitize_list(data.get("symptoms"))
    treatment = _sanitize_list(data.get("treatment") or data.get("recommended_treatment"))
    prevention = _sanitize_list(data.get("prevention"))
    is_uncertain = bool(data.get("is_uncertain", False))
    summary = str(data.get("summary") or f"Visual analysis for {crop}: {disease}")

    disclaimer = str(data.get("disclaimer") or (
        "AI-assisted analysis. For severe crop damage, consult a local agricultural expert or KVK."
    ))

    # Normalize classifications
    if confidence not in {"High", "Medium", "Low", "Uncertain"}:
        confidence = "Uncertain"

    if severity not in {"None", "Mild", "Moderate", "Severe", "Critical"}:
        severity = "None"

    if disease.lower() in {"unable to determine", "unknown", "uncertain", "unclear"} or confidence == "Uncertain":
        is_uncertain = True
        confidence = "Uncertain"

    return DiagnosisResult(
        crop=crop,
        disease=disease,
        confidence=confidence,
        severity=severity,
        symptoms=symptoms,
        treatment=treatment,
        prevention=prevention,
        is_uncertain=is_uncertain,
        summary=summary,
        disclaimer=disclaimer,
    )


# ============================================================
# AI FARMING CHATBOT
# ============================================================

CHAT_SYSTEM_PROMPT = """
You are AgroGuard, an AI agricultural assistant.

Your goal is to help farmers make practical decisions using the
information supplied by the application.

You can discuss crop planning, plant diseases, pests, irrigation,
soil health, weather-aware farming, market considerations, and sustainable practices.

IMPORTANT:
- Never pretend to have live weather or market prices unless provided in context.
- Never invent pesticide dosages or chemical concentrations.
- Direct farmers to local product labels and KVK/extension services for chemical controls.
- Answer in the farmer's requested language.
- Keep explanations simple, actionable, and practical.
"""


async def generate_chat_response(
    prompt: str,
    history: Optional[List[Any]] = None,
    farmer_context: Optional[dict[str, Any]] = None,
    language: Optional[str] = "English",
) -> str:
    """
    Generate AgroGuard farming assistant response safely supporting both
    Pydantic objects and dicts in history.
    """
    client = _get_client()
    selected_language = _normalize_language(language)

    if client is None:
        return (
            "AgroGuard AI is currently unavailable because the Gemini "
            "API is not configured. Please try again later."
        )

    history = history or []
    farmer_context = farmer_context or {}

    conversation_parts: list[str] = []

    for message in history:
        # Safely extract from Pydantic object or Dict
        if isinstance(message, dict):
            role = message.get("role", "user")
            content = message.get("content") or message.get("text") or ""
        elif hasattr(message, "role"):
            role = getattr(message, "role", "user")
            content = getattr(message, "content", None) or getattr(message, "text", "") or ""
        else:
            role = "user"
            content = str(message)

        if str(content).strip():
            conversation_parts.append(f"{str(role).upper()}: {content}")

    conversation_parts.append(f"USER: {prompt}")
    conversation = "\n\n".join(conversation_parts)

    context_text = json.dumps(farmer_context, ensure_ascii=False, indent=2)

    full_prompt = f"""
Farmer profile:
{context_text}

Preferred language: {selected_language}

Conversation History:
{conversation}

Respond directly to the user's latest query in {selected_language}.
"""

    try:
        response = await client.aio.models.generate_content(
            model=DEFAULT_MODEL,
            contents=[full_prompt],
            config=types.GenerateContentConfig(
                system_instruction=CHAT_SYSTEM_PROMPT,
                temperature=0.4,
            ),
        )

        if not response or not response.text:
            return "I couldn't generate a response right now. Please try again."

        return response.text.strip()

    except Exception as exc:
        logger.exception("AgroGuard chat failed: %s", exc)
        return "I'm temporarily unable to answer. Please try again in a moment."


# ============================================================
# CROP RECOMMENDATION
# ============================================================

CROP_RECOMMENDATION_PROMPT = """
You are AgroGuard's agricultural crop-planning assistant.
Recommend exactly 3 practical crops based on the provided region, soil, and season.
Do not fabricate live market prices or weather data.
"""


async def generate_crop_recommendations(
    region: str,
    season: str,
    soil_type: str,
    water_availability: str,
    land_area: Optional[float] = None,
    land_unit: Optional[str] = None,
    budget: Optional[float] = None,
    irrigation_type: Optional[str] = None,
    market_data: Optional[Any] = None,
    weather_data: Optional[Any] = None,
    language: Optional[str] = "English",
) -> Optional[dict[str, Any]]:
    """
    Generate structured crop recommendations asynchronously.
    """
    client = _get_client()
    if client is None:
        logger.warning("Cannot generate crop recommendations: Gemini API unavailable.")
        return None

    selected_language = _normalize_language(language)

    farmer_data = {
        "region": region,
        "season": season,
        "soil_type": soil_type,
        "water_availability": water_availability,
        "land_area": land_area,
        "land_unit": land_unit,
        "budget": budget,
        "irrigation_type": irrigation_type,
        "market_data": market_data,
        "weather_data": weather_data,
        "language": selected_language,
    }

    user_prompt = f"""
Farmer Information:
{json.dumps(farmer_data, ensure_ascii=False, indent=2, default=str)}

Recommend exactly 3 crops in {selected_language}.
Return JSON using this format:
{{
    "recommendations": [
        {{
            "crop_name": "...",
            "category": "...",
            "suitability_score": 85,
            "expected_duration": "...",
            "water_requirement": "...",
            "market_outlook": "...",
            "key_tips": ["..."]
        }}
    ],
    "ai_reasoning": "..."
}}
"""

    try:
        response = await client.aio.models.generate_content(
            model=DEFAULT_MODEL,
            contents=[user_prompt],
            config=types.GenerateContentConfig(
                system_instruction=CROP_RECOMMENDATION_PROMPT,
                temperature=0.2,
                response_mime_type="application/json",
            ),
        )

        if not response or not response.text:
            return None

        data = json.loads(response.text)
        if isinstance(data, dict):
            return data
        return None

    except Exception as exc:
        logger.exception("Crop recommendation failed: %s", exc)
        return None


# ============================================================
# FARM ACTION PLAN
# ============================================================

async def generate_farm_action_plan(
    farmer_context: dict[str, Any],
    disease_result: Optional[dict[str, Any]] = None,
    weather_data: Optional[dict[str, Any]] = None,
    market_data: Optional[dict[str, Any]] = None,
    language: Optional[str] = "English",
) -> Optional[dict[str, Any]]:
    """
    Generate a personalized farm action plan.
    """
    client = _get_client()
    if client is None:
        return None

    selected_language = _normalize_language(language)

    prompt = f"""
Create a practical farm action plan in {selected_language}.

FARMER: {json.dumps(farmer_context, ensure_ascii=False, indent=2, default=str)}
CROP HEALTH: {json.dumps(disease_result or {}, ensure_ascii=False, indent=2, default=str)}
WEATHER: {json.dumps(weather_data or {}, ensure_ascii=False, indent=2, default=str)}
MARKET: {json.dumps(market_data or {}, ensure_ascii=False, indent=2, default=str)}

Return valid JSON with keys: "today", "next_3_days", "next_7_days", "monitor", "avoid", "expert_help_when".
Each key should map to a list of strings.
"""

    try:
        response = await client.aio.models.generate_content(
            model=DEFAULT_MODEL,
            contents=[prompt],
            config=types.GenerateContentConfig(
                temperature=0.25,
                response_mime_type="application/json",
            ),
        )

        if not response or not response.text:
            return None

        data = json.loads(response.text)
        return data if isinstance(data, dict) else None

    except Exception as exc:
        logger.exception("Farm action plan generation failed: %s", exc)
        return None


# ============================================================
# SIMPLE HEALTH CHECK
# ============================================================

def gemini_is_configured() -> bool:
    """
    Check whether Gemini API is configured.
    """
    return bool(getattr(settings, "GEMINI_API_KEY", None))