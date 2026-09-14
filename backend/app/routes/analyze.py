import json
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import DiagnosisRecord
from app.utils.image_validation import validate_image_file
from app.services.gemini_service import analyze_crop_image
from app.schemas.analysis import DiagnosisResult
from app.schemas.farm_map import DiseaseObservationCreate
from app.services import profile_service, farm_map_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Crop Disease Analysis"])

@router.post("/analyze-crop", response_model=DiagnosisResult)
async def analyze_crop(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    field_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Primary Endpoint: Upload crop image for AI diagnosis via Gemini Vision using Farm Memory.
    Saves diagnosis to database for chatbot context memory and optionally attaches to a specific field.
    """
    image_bytes = await validate_image_file(file)
    mime_type = file.content_type or "image/jpeg"
    
    farmer_ctx = profile_service.get_farmer_context(db)
    req_language = language or farmer_ctx.get("language", "English")

    result = await analyze_crop_image(
        image_bytes=image_bytes,
        mime_type=mime_type,
        crop=farmer_ctx.get("current_crop"),
        location=farmer_ctx.get("location"),
        land_area=farmer_ctx.get("land_area"),
        land_unit=farmer_ctx.get("land_unit"),
        soil_type=farmer_ctx.get("soil_type"),
        growth_stage=farmer_ctx.get("growth_stage"),
        language=req_language
    )

    # Persist diagnosis record to DB for chatbot memory
    try:
        diag_rec = DiagnosisRecord(
            crop=result.crop,
            disease=result.disease,
            confidence=result.confidence,
            severity=result.severity,
            symptoms_json=json.dumps(result.symptoms, ensure_ascii=False),
            treatment_json=json.dumps(result.treatment, ensure_ascii=False),
            prevention_json=json.dumps(result.prevention, ensure_ascii=False),
            is_uncertain=result.is_uncertain,
            summary=result.summary
        )
        db.add(diag_rec)
        db.commit()

        # If field_id is supplied, associate diagnosis with specific farm field
        if field_id:
            obs_create = DiseaseObservationCreate(
                disease=result.disease,
                confidence=result.confidence,
                severity=result.severity,
                symptoms=result.symptoms,
                treatment=result.treatment,
                summary=result.summary
            )
            await farm_map_service.add_disease_observation(db, field_id, obs_create)
            logger.info(f"Associated disease diagnosis '{result.disease}' with field_id={field_id}")
    except Exception as e:
        logger.error(f"Failed to log diagnosis record to DB: {e}")

    return result

