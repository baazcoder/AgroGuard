import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.farm_map import (
    FarmCreate, FarmResponse, FieldCreate, FieldUpdate, FieldResponse,
    DiseaseObservationCreate, ActiveFarmContextResponse
)
from app.services import farm_map_service, active_farm_service

from app.db.auth_deps import get_optional_current_user
from app.db.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Farm Map"])

@router.get("/farms", response_model=List[FarmResponse])
async def list_farms(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Get all registered farms for the current authenticated farmer.
    """
    f_id = current_user.id if current_user else 1
    return await farm_map_service.get_all_farms_response(db, farmer_id=f_id)

@router.get("/farms/active", response_model=ActiveFarmContextResponse)
async def get_active_farm_context(
    farm_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Primary Active Farm Context Endpoint: Returns the active farm context.
    Optionally accepts farm_id query parameter.
    """
    f_id = current_user.id if current_user else 1
    return await active_farm_service.get_active_farm_context(db, farm_id=farm_id, farmer_id=f_id)

@router.post("/farms/active/{farm_id}", response_model=ActiveFarmContextResponse)
async def set_active_farm(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Set specified farm_id as the Active Farm for current user.
    """
    f_id = current_user.id if current_user else 1
    active_farm_service.set_active_farm(db, farm_id, farmer_id=f_id)
    return await active_farm_service.get_active_farm_context(db, farm_id=farm_id, farmer_id=f_id)

@router.post("/farms", response_model=FarmResponse)
async def create_or_save_farm(
    data: FarmCreate,
    farm_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Create a new farm or update an existing farm boundary, location, and metadata.
    Includes coordinate and area validation.
    """
    f_id = current_user.id if current_user else 1
    active_farm_service.validate_farm_inputs(data.center_lat, data.center_lon)
    farm_obj = farm_map_service.create_or_update_farm(db, data, farm_id=farm_id, farmer_id=f_id)
    return await farm_map_service.get_farm_details(db, farm_id=farm_obj.id, farmer_id=f_id)

@router.get("/farms/{farm_id}", response_model=FarmResponse)
async def get_farm_by_id(
    farm_id: int, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Get farm details by farm_id.
    """
    f_id = current_user.id if current_user else 1
    return await farm_map_service.get_farm_details(db, farm_id=farm_id, farmer_id=f_id)

@router.delete("/farms/{farm_id}")
async def delete_farm(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Delete a farm record and reassign active farm if necessary.
    """
    f_id = current_user.id if current_user else 1
    success = farm_map_service.delete_farm_record(db, farm_id, farmer_id=f_id)
    if not success:
        raise HTTPException(status_code=404, detail="Farm not found or access denied.")
    return {"message": "Farm deleted successfully", "farm_id": farm_id}

@router.post("/farms/{farm_id}/fields", response_model=FieldResponse)
async def create_field(farm_id: int, data: FieldCreate, db: Session = Depends(get_db)):
    """
    Add a field/plot to the specified farm map.
    """
    return await farm_map_service.create_field(db, farm_id, data)

@router.get("/farms/{farm_id}/fields", response_model=List[FieldResponse])
async def get_fields(farm_id: int, db: Session = Depends(get_db)):
    """
    List all fields for a farm.
    """
    farm = await farm_map_service.get_farm_details(db, farm_id=farm_id)
    return farm.fields

@router.put("/fields/{field_id}", response_model=FieldResponse)
async def update_field(field_id: int, data: FieldUpdate, db: Session = Depends(get_db)):
    """
    Update field properties, crop info, boundary, or health status.
    """
    res = await farm_map_service.update_field(db, field_id, data)
    if not res:
        raise HTTPException(status_code=404, detail="Field not found")
    return res

@router.delete("/fields/{field_id}")
async def delete_field(field_id: int, db: Session = Depends(get_db)):
    """
    Delete a field from the farm map.
    """
    success = farm_map_service.delete_field(db, field_id)
    if not success:
        raise HTTPException(status_code=404, detail="Field not found")
    return {"message": "Field deleted successfully", "field_id": field_id}

@router.post("/fields/{field_id}/disease-observation", response_model=FieldResponse)
async def add_disease_observation(field_id: int, data: DiseaseObservationCreate, db: Session = Depends(get_db)):
    """
    Associate a crop disease diagnosis result with a specific field on the map.
    """
    try:
        return await farm_map_service.add_disease_observation(db, field_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
