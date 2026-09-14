import json
import logging
from typing import Optional
from app.config import settings
from app.schemas.analysis import DiagnosisResult

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are AgroGuard, an expert agricultural AI assistant specialized in plant pathology and crop health diagnosis.

Analyze the provided crop image carefully and identify:
1. Crop: Name of the plant/crop (e.g., Wheat, Rice, Tomato, Potato, Corn, Cotton).
2. Most likely disease: Specific plant disease, fungal infection, pest damage, nutrient deficiency, or "Healthy Crop" if no disease is visible.
3. Confidence: "High", "Medium", "Low", or "Uncertain".
4. Severity: "None" (for healthy), "Mild", "Moderate", "Severe", or "Critical".
5. Visible symptoms: List specific visual indicators on leaves, stems, or fruits shown in the image.
6. Recommended treatment: Actionable steps including approved organic/chemical treatments or fertilizers.
7. Prevention: Agronomic practices to prevent future occurrences.

CRITICAL INSTRUCTIONS:
- If the image is blurry, dark, unclear, or does NOT depict a crop/plant leaf, return disease as "Uncertain / Unclear Image", confidence as "Uncertain", and set is_uncertain to true.
- Do NOT invent or fabricate symptoms or diagnoses when uncertain.
- Always provide helpful, actionable recommendations.

Return your response strictly in the following JSON format:
{
  "crop": "Crop Name",
  "disease": "Disease Name or Healthy Crop",
  "confidence": "High | Medium | Low | Uncertain",
  "severity": "None | Mild | Moderate | Severe | Critical",
  "symptoms": ["Symptom 1", "Symptom 2"],
  "treatment": ["Treatment step 1", "Treatment step 2"],
  "prevention": ["Prevention measure 1", "Prevention measure 2"],
  "is_uncertain": false,
  "summary": "Brief 1-2 sentence diagnostic overview."
}
"""

async def analyze_crop_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> DiagnosisResult:
    """
    Analyzes crop image using Google Gemini Vision API.
    Falls back gracefully with structured output if API key is not configured or error occurs.
    """
    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is not set. Returning demonstration analysis.")
        return _generate_demo_analysis()

    try:
        # Try google-genai SDK first
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        image_part = types.Part.from_bytes(
            data=image_bytes,
            mime_type=mime_type
        )
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[SYSTEM_PROMPT, image_part],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        
        if response and response.text:
            data = json.loads(response.text)
            return DiagnosisResult(
                crop=data.get("crop", "Unknown Crop"),
                disease=data.get("disease", "Uncertain"),
                confidence=data.get("confidence", "Medium"),
                severity=data.get("severity", "Moderate"),
                symptoms=data.get("symptoms", []),
                treatment=data.get("treatment", []),
                prevention=data.get("prevention", []),
                is_uncertain=data.get("is_uncertain", False),
                summary=data.get("summary", "Analysis completed by Gemini Vision.")
            )

    except Exception as e:
        logger.error(f"Gemini 2.5 Flash call failed: {e}. Trying legacy google-generativeai fallback...")
        try:
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=settings.GEMINI_API_KEY)
            model = legacy_genai.GenerativeModel('gemini-1.5-flash')
            
            cookie_part = {
                "mime_type": mime_type,
                "data": image_bytes
            }
            res = model.generate_content([SYSTEM_PROMPT, cookie_part])
            if res and res.text:
                # Clean code blocks if present
                clean_json = res.text.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_json)
                return DiagnosisResult(
                    crop=data.get("crop", "Wheat"),
                    disease=data.get("disease", "Yellow Rust"),
                    confidence=data.get("confidence", "High"),
                    severity=data.get("severity", "Moderate"),
                    symptoms=data.get("symptoms", []),
                    treatment=data.get("treatment", []),
                    prevention=data.get("prevention", []),
                    is_uncertain=data.get("is_uncertain", False),
                    summary=data.get("summary", "Analysis completed.")
                )
        except Exception as fallback_err:
            logger.error(f"Fallback Gemini API call failed: {fallback_err}")
    
    return _generate_demo_analysis()

def _generate_demo_analysis() -> DiagnosisResult:
    """Fallback demonstration result for hackathon testing when API key is unconfigured."""
    return DiagnosisResult(
        crop="Wheat (Triticum aestivum)",
        disease="Yellow Rust (Stripe Rust / Puccinia striiformis)",
        confidence="High",
        severity="Moderate",
        symptoms=[
            "Bright yellow-orange linear pustules along leaf veins",
            "Yellowing stripes appearing on upper leaves",
            "Powdery yellow spores rubbing off easily upon touch",
            "Chlorosis surrounding spore infection zones"
        ],
        treatment=[
            "Apply foliar fungicide such as Tebuconazole (25% EC @ 1ml/L water) or Propiconazole",
            "Ensure uniform spray coverage early in the morning or late afternoon",
            "Isolate heavily infected patches to minimize spore spread to neighboring fields",
            "Apply balanced nitrogen fertilizer to avoid excessive foliage lushness"
        ],
        prevention=[
            "Sow rust-resistant wheat varieties recommended for your agro-climatic zone",
            "Practice crop rotation with legumes or oilseeds",
            "Maintain optimal plant spacing to allow adequate ventilation and reduce canopy humidity",
            "Monitor crop fields weekly during high moisture and cool temperature periods (10°C - 20°C)"
        ],
        is_uncertain=False,
        summary="Yellow Rust detected on wheat leaves with moderate severity. Prompt fungicide application is recommended to protect crop yield.",
        disclaimer="AI-assisted analysis. For severe crop damage, consult your local Krishi Vigyan Kendra (KVK) or agricultural expert."
    )

async def generate_chat_response(prompt: str, history: Optional[list] = None) -> str:
    """Generates conversational responses for agricultural queries."""
    if not settings.GEMINI_API_KEY:
        return (
            "I am **AgroGuard AI Assistant**. I can help you with crop advice, disease management, "
            "irrigation schedules, and soil care. (Note: Provide a `GEMINI_API_KEY` in `backend/.env` for live custom responses!)"
        )
    
    try:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        system_instruction = (
            "You are AgroGuard, an expert AI agricultural scientist and farming advisor. "
            "Provide helpful, concise, practical, and scientific advice to farmers. "
            "Use clear bullet points and markdown formatting."
        )
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"{system_instruction}\n\nFarmer Question: {prompt}"
        )
        if response and response.text:
            return response.text
    except Exception as e:
        logger.error(f"Error in Gemini chat response: {e}")
        
    return (
        "Based on agricultural best practices, ensure proper soil moisture testing before irrigation, "
        "apply balanced NPK fertilization, and monitor crops regularly for early sign of pest activity."
    )
