import logging
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.satellite import SatelliteAnalysisRequest, SatelliteAnalysisResponse
from app.services import satellite_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Satellite Farm Monitoring & NDVI"])

@router.post("/satellite", response_model=SatelliteAnalysisResponse)
async def analyze_farm_satellite(
    request: SatelliteAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Primary Satellite Endpoint:
    Receives GeoJSON farm polygon boundary and date parameters.
    Processes Sentinel-2 satellite imagery to calculate NDVI vegetation health and cloud coverage.
    Returns structured satellite observation response or graceful fallback demo mode if credentials are unconfigured.
    """
    try:
        return await satellite_service.analyze_farm_satellite(request)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as exc:
        logger.error(f"Satellite analysis failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze satellite imagery for the farm boundary."
        )
