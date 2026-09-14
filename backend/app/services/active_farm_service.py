import json
import logging
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models import Farm, Field as FieldModel, FarmerProfile
from app.schemas.farm_map import ActiveFarmContextResponse, FieldResponse
from app.utils.geo_utils import calculate_polygon_area, calculate_centroid
from app.services import farm_map_service, profile_service

logger = logging.getLogger(__name__)

def validate_farm_inputs(center_lat: Optional[float], center_lon: Optional[float], area_acres: Optional[float] = None):
    """
    Validates geographic coordinates and farm area dimensions.
    """
    if center_lat is not None:
        if not (-90.0 <= center_lat <= 90.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid latitude coordinate: {center_lat}. Must be between -90 and 90."
            )
    if center_lon is not None:
        if not (-180.0 <= center_lon <= 180.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid longitude coordinate: {center_lon}. Must be between -180 and 180."
            )
    if area_acres is not None and area_acres < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Farm area cannot be negative."
        )

def set_active_farm(db: Session, farm_id: int, farmer_id: int = 1) -> Farm:
    """
    Sets the specified farm_id as active for the given farmer_id, resetting all other farms.
    """
    target_farm = db.query(Farm).filter(Farm.id == farm_id, Farm.farmer_id == farmer_id).first()
    if not target_farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm with ID {farm_id} not found or access denied."
        )

    # Deactivate all farms for farmer
    db.query(Farm).filter(Farm.farmer_id == farmer_id).update({Farm.is_active: False})
    
    # Activate target farm
    target_farm.is_active = True
    db.commit()
    db.refresh(target_farm)
    logger.info(f"Set active farm to ID={farm_id} for farmer_id={farmer_id}")
    return target_farm

async def get_active_farm_context(
    db: Session,
    farm_id: Optional[int] = None,
    farmer_id: int = 1
) -> ActiveFarmContextResponse:
    """
    Central Service Function: Returns structured Active Farm Context.
    Supports explicitly passing farm_id or fetching currently active farm.
    """
    target_farm = None

    if farm_id is not None:
        target_farm = db.query(Farm).filter(Farm.id == farm_id, Farm.farmer_id == farmer_id).first()
        if not target_farm:
            logger.warning(f"Requested farm_id={farm_id} not found. Falling back to default active farm.")
            target_farm = None
        else:
            set_active_farm(db, farm_id, farmer_id)

    if not target_farm:
        # Search for active farm in DB
        target_farm = db.query(Farm).filter(Farm.farmer_id == farmer_id, Farm.is_active == True).first()

    if not target_farm:
        # Search for any farm owned by farmer
        target_farm = db.query(Farm).filter(Farm.farmer_id == farmer_id).first()

    if not target_farm:
        farmer_profile_dict = profile_service.get_farmer_context(db, user_id=farmer_id)
        return ActiveFarmContextResponse(
            farm_id=0,
            name="No Farm Mapped",
            is_active=False,
            boundary=[],
            latitude=20.5937,
            longitude=78.9629,
            village_locality="",
            district="",
            state="",
            country="India",
            total_area=0.0,
            area_unit="acre",
            area_acres=0.0,
            area_hectares=0.0,
            location_name="No Farm Configured",
            fields=[],
            crops=[],
            soil_information=[],
            irrigation_information=[],
            crop_stages=[],
            farmer_profile=farmer_profile_dict
        )

    # Fetch fields for target farm
    field_models = db.query(FieldModel).filter(FieldModel.farm_id == target_farm.id).all()
    formatted_fields: List[FieldResponse] = []
    for f in field_models:
        formatted_fields.append(await farm_map_service.format_field_response(db, f))

    # Aggregated farm properties across fields
    crops = list(set(f.crop for f in formatted_fields if f.crop))
    soils = list(set(f.soil_type for f in formatted_fields if f.soil_type))
    irrigations = list(set(f.irrigation_type for f in formatted_fields if f.irrigation_type))
    crop_stages = list(set(f.growth_stage for f in formatted_fields if f.growth_stage))

    # Linked Farmer Profile Context
    farmer_profile_dict = profile_service.get_farmer_context(db)

    boundary_coords = farm_map_service.parse_boundary(target_farm.boundary_geojson)

    return ActiveFarmContextResponse(
        farm_id=target_farm.id,
        name=target_farm.name,
        is_active=target_farm.is_active or True,
        boundary=boundary_coords,
        latitude=target_farm.center_lat,
        longitude=target_farm.center_lon,
        village_locality=target_farm.village_locality or "",
        district=target_farm.district or "",
        state=target_farm.state or "",
        country=target_farm.country or "India",
        total_area=target_farm.area_acres,
        area_unit=target_farm.area_unit or "acre",
        area_acres=target_farm.area_acres,
        area_hectares=target_farm.area_hectares,
        location_name=target_farm.location_name or "Punjab, India",
        fields=formatted_fields,
        crops=crops,
        soil_information=soils,
        irrigation_information=irrigations,
        crop_stages=crop_stages,
        farmer_profile=farmer_profile_dict
    )
