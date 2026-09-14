from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.utils.image_validation import validate_image_file
from app.services.gemini_service import analyze_crop_image
from app.schemas.analysis import DiagnosisResult

router = APIRouter(prefix="/api", tags=["Crop Disease Analysis"])

@router.post("/analyze-crop", response_model=DiagnosisResult)
async def analyze_crop(file: UploadFile = File(...)):
    """
    Primary Hackathon Endpoint: Upload crop image for AI diagnosis via Gemini Vision.
    """
    image_bytes = await validate_image_file(file)
    mime_type = file.content_type or "image/jpeg"
    
    result = await analyze_crop_image(image_bytes=image_bytes, mime_type=mime_type)
    return result
