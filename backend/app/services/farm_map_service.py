import json
import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.models import Farm, Field as FieldModel, DiseaseObservation as DiseaseObsModel, FarmerProfile
from app.schemas.farm_map import (
    FarmCreate, FarmResponse, FieldCreate, FieldUpdate, FieldResponse,
    DiseaseObservationCreate, DiseaseObservationResponse
)
from app.utils.geo_utils import calculate_polygon_area, calculate_centroid
from app.services import economics_service, profile_service

logger = logging.getLogger(__name__)

# Default farm data (around Ludhiana/Punjab) for instant interactive demo
DEFAULT_FARM_LAT = 30.9010
DEFAULT_FARM_LON = 75.8573

DEFAULT_FARM_BOUNDARY = [
    [30.9030, 75.8550],
    [30.9030, 75.8610],
    [30.8990, 75.8610],
    [30.8990, 75.8550],
    [30.9030, 75.8550]
]

DEFAULT_FIELDS = [
    {
        "name": "Field 1",
        "crop": "Wheat",
        "crop_variety": "PBW 550",
        "growth_stage": "Vegetative",
        "irrigation_type": "Tube well",
        "soil_type": "Alluvial",
        "health_status": "Healthy",
        "disease_status": "None",
        "notes": "Main wheat plot, healthy crop stand",
        "boundary": [
            [30.9030, 75.8550],
            [30.9030, 75.8580],
            [30.8990, 75.8580],
            [30.8990, 75.8550],
            [30.9030, 75.8550]
        ]
    },
    {
        "name": "Field 2",
        "crop": "Wheat",
        "crop_variety": "HD 2967",
        "growth_stage": "Vegetative",
        "irrigation_type": "Tube well",
        "soil_type": "Alluvial",
        "health_status": "Disease Risk",
        "disease_status": "Possible Yellow Rust",
        "notes": "Higher humidity area near tree border. Inspect yellow spots.",
        "boundary": [
            [30.9030, 75.8580],
            [30.9030, 75.8610],
            [30.9010, 75.8610],
            [30.9010, 75.8580],
            [30.9030, 75.8580]
        ]
    },
    {
        "name": "Field 3",
        "crop": "Rice",
        "crop_variety": "PR 126",
        "growth_stage": "Tillering",
        "irrigation_type": "Drip",
        "soil_type": "Clay Loam",
        "health_status": "Monitor",
        "disease_status": "None",
        "notes": "Monitored for stem borer activity",
        "boundary": [
            [30.9010, 75.8580],
            [30.9010, 75.8610],
            [30.8990, 75.8610],
            [30.8990, 75.8580],
            [30.9010, 75.8580]
        ]
    }
]

def parse_boundary(geojson_str: Optional[str]) -> List[List[float]]:
    if not geojson_str:
        return []
    try:
        data = json.loads(geojson_str)
        if isinstance(data, list):
            return data
        return []
    except Exception:
        return []

def serialize_boundary(coords: Optional[List[List[float]]]) -> Optional[str]:
    if not coords:
        return None
    return json.dumps(coords)

async def format_field_response(db: Session, field: FieldModel) -> FieldResponse:
    boundary_coords = parse_boundary(field.boundary_geojson)
    
    # Fetch latest disease observation if any
    latest_obs_model = (
        db.query(DiseaseObsModel)
        .filter(DiseaseObsModel.field_id == field.id)
        .order_by(DiseaseObsModel.created_at.desc())
        .first()
    )

    latest_obs = None
    if latest_obs_model:
        symptoms = json.loads(latest_obs_model.symptoms_json) if latest_obs_model.symptoms_json else []
        treatment = json.loads(latest_obs_model.treatment_json) if latest_obs_model.treatment_json else []
        latest_obs = DiseaseObservationResponse(
            id=latest_obs_model.id,
            field_id=latest_obs_model.field_id,
            disease=latest_obs_model.disease,
            confidence=latest_obs_model.confidence or "High",
            severity=latest_obs_model.severity or "Moderate",
            symptoms=symptoms,
            treatment=treatment,
            summary=latest_obs_model.summary or "",
            created_at=latest_obs_model.created_at
        )

    # Calculate economics for field
    econ = None
    try:
        if field.area_acres > 0:
            econ_resp = await economics_service.calculate_farm_economics(
                crop=field.crop,
                land_area=field.area_acres,
                land_unit="acre"
            )
            econ = {
                "total_input_cost": econ_resp.total_input_cost,
                "expected_production_qtl": econ_resp.expected_production_qtl,
                "market_price_per_qtl": econ_resp.market_price_per_qtl,
                "gross_revenue": econ_resp.gross_revenue,
                "estimated_margin": econ_resp.estimated_margin
            }
    except Exception as e:
        logger.warning(f"Error computing economics for field {field.id}: {e}")

    return FieldResponse(
        id=field.id,
        farm_id=field.farm_id,
        name=field.name,
        boundary_coordinates=boundary_coords,
        area_acres=field.area_acres,
        area_hectares=field.area_hectares,
        crop=field.crop,
        crop_variety=field.crop_variety,
        sowing_date=field.sowing_date or "",
        growth_stage=field.growth_stage,
        irrigation_type=field.irrigation_type,
        soil_type=field.soil_type,
        health_status=field.health_status,
        disease_status=field.disease_status,
        notes=field.notes or "",
        created_at=field.created_at,
        updated_at=field.updated_at,
        latest_disease_observation=latest_obs,
        economics_summary=econ
    )

def compute_overall_health(fields: List[FieldModel]) -> str:
    if not fields:
        return "Healthy"
    statuses = [f.health_status for f in fields]
    if "High Disease Risk" in statuses:
        return "High Disease Risk"
    if "Disease Risk" in statuses:
        return "Moderate Risk"
    if "Monitor" in statuses:
        return "Monitor"
    return "Healthy"

def get_or_create_default_farm(db: Session, farmer_id: int = 1) -> Farm:
    farm = db.query(Farm).filter(Farm.farmer_id == farmer_id).first()
    if not farm:
        # Check farmer profile for default location/area if available
        profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == farmer_id).first()
        location = "Punjab, India"
        if profile and profile.state:
            location = f"{profile.district or profile.village_location or 'Farm'}, {profile.state}"

        area_calc = calculate_polygon_area(DEFAULT_FARM_BOUNDARY)
        farm = Farm(
            farmer_id=farmer_id,
            name="My Farm",
            boundary_geojson=serialize_boundary(DEFAULT_FARM_BOUNDARY),
            center_lat=DEFAULT_FARM_LAT,
            center_lon=DEFAULT_FARM_LON,
            area_acres=area_calc["acres"],
            area_hectares=area_calc["hectares"],
            location_name=location
        )
        db.add(farm)
        db.commit()
        db.refresh(farm)

        # Seed default fields
        for f_data in DEFAULT_FIELDS:
            f_area = calculate_polygon_area(f_data["boundary"])
            field_obj = FieldModel(
                farm_id=farm.id,
                name=f_data["name"],
                boundary_geojson=serialize_boundary(f_data["boundary"]),
                area_acres=f_area["acres"],
                area_hectares=f_area["hectares"],
                crop=f_data["crop"],
                crop_variety=f_data["crop_variety"],
                growth_stage=f_data["growth_stage"],
                irrigation_type=f_data["irrigation_type"],
                soil_type=f_data["soil_type"],
                health_status=f_data["health_status"],
                disease_status=f_data["disease_status"],
                notes=f_data["notes"]
            )
            db.add(field_obj)
        db.commit()
        db.refresh(farm)
    return farm

async def get_farm_details(db: Session, farm_id: Optional[int] = None, farmer_id: int = 1) -> FarmResponse:
    farm = None
    if farm_id:
        farm = db.query(Farm).filter(Farm.id == farm_id, Farm.farmer_id == farmer_id).first()

    if not farm:
        farm = db.query(Farm).filter(Farm.farmer_id == farmer_id, Farm.is_active == True).first()

    if not farm:
        farm = db.query(Farm).filter(Farm.farmer_id == farmer_id).first()

    if not farm:
        farmer_profile_dict = profile_service.get_farmer_context(db, user_id=farmer_id)
        return FarmResponse(
            id=0,
            name="No Farm Mapped",
            is_active=False,
            boundary_coordinates=[],
            center_lat=20.5937,
            center_lon=78.9629,
            village_locality="",
            district="",
            state="",
            country="India",
            area_acres=0.0,
            area_hectares=0.0,
            area_unit="acre",
            location_name="No Farm Configured",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            fields=[],
            overall_health="Healthy",
            summary_stats={
                "total_area_acres": 0.0,
                "total_area_hectares": 0.0,
                "field_count": 0,
                "crops_count": 0,
                "crops": [],
                "healthy_acres": 0.0,
                "monitor_acres": 0.0,
                "disease_risk_acres": 0.0
            },
            farmer_profile=farmer_profile_dict
        )

    fields_models = db.query(FieldModel).filter(FieldModel.farm_id == farm.id).all()
    fields_responses = []
    for f in fields_models:
        fields_responses.append(await format_field_response(db, f))

    overall_health = compute_overall_health(fields_models)
    
    # Calculate stats
    total_acres = sum(f.area_acres for f in fields_responses)
    total_ha = sum(f.area_hectares for f in fields_responses)
    healthy_acres = sum(f.area_acres for f in fields_responses if f.health_status == "Healthy")
    monitor_acres = sum(f.area_acres for f in fields_responses if f.health_status == "Monitor")
    risk_acres = sum(f.area_acres for f in fields_responses if f.health_status in ["Disease Risk", "High Disease Risk"])

    crops_list = list(set(f.crop for f in fields_responses if f.crop))

    summary_stats = {
        "total_area_acres": round(total_acres, 2) if total_acres > 0 else farm.area_acres,
        "total_area_hectares": round(total_ha, 2) if total_ha > 0 else farm.area_hectares,
        "field_count": len(fields_responses),
        "crops_count": len(crops_list),
        "crops": crops_list,
        "healthy_acres": round(healthy_acres, 2),
        "monitor_acres": round(monitor_acres, 2),
        "disease_risk_acres": round(risk_acres, 2),
    }

    boundary_coords = parse_boundary(farm.boundary_geojson)
    farmer_profile_dict = profile_service.get_farmer_context(db)

    return FarmResponse(
        id=farm.id,
        name=farm.name,
        is_active=farm.is_active or False,
        boundary_coordinates=boundary_coords,
        center_lat=farm.center_lat,
        center_lon=farm.center_lon,
        village_locality=farm.village_locality or "",
        district=farm.district or "",
        state=farm.state or "",
        country=farm.country or "India",
        area_acres=farm.area_acres,
        area_hectares=farm.area_hectares,
        area_unit=farm.area_unit or "acre",
        location_name=farm.location_name,
        created_at=farm.created_at,
        updated_at=farm.updated_at,
        fields=fields_responses,
        overall_health=overall_health,
        summary_stats=summary_stats,
        farmer_profile=farmer_profile_dict
    )

def create_or_update_farm(db: Session, data: FarmCreate) -> Farm:
    farm = db.query(Farm).first()
    area_dict = calculate_polygon_area(data.boundary_coordinates or [])
    c_lat, c_lon = calculate_centroid(data.boundary_coordinates or [])

def create_new_farm(db: Session, data: FarmCreate, farmer_id: int = 1) -> Farm:
    area_dict = calculate_polygon_area(data.boundary_coordinates or [])
    c_lat, c_lon = calculate_centroid(data.boundary_coordinates or [])

    lat = data.center_lat if data.center_lat is not None else c_lat
    lon = data.center_lon if data.center_lon is not None else c_lon

    # Deactivate other farms for farmer
    db.query(Farm).filter(Farm.farmer_id == farmer_id).update({Farm.is_active: False})

    farm = Farm(
        farmer_id=farmer_id,
        name=data.name or f"Farm {db.query(Farm).filter(Farm.farmer_id == farmer_id).count() + 1}",
        is_active=True,
        boundary_geojson=serialize_boundary(data.boundary_coordinates),
        center_lat=lat,
        center_lon=lon,
        village_locality=data.village_locality or "",
        district=data.district or "",
        state=data.state or "",
        country=data.country or "India",
        area_acres=area_dict["acres"],
        area_hectares=area_dict["hectares"],
        area_unit=data.area_unit or "acre",
        location_name=data.location_name or "Punjab, India"
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    logger.info(f"Created new Farm ID={farm.id} Name='{farm.name}' (Active=True)")
    return farm

def create_or_update_farm(db: Session, data: FarmCreate, farm_id: Optional[int] = None, farmer_id: int = 1) -> Farm:
    farm = None
    if farm_id:
        farm = db.query(Farm).filter(Farm.id == farm_id, Farm.farmer_id == farmer_id).first()

    if not farm:
        return create_new_farm(db, data, farmer_id=farmer_id)

    area_dict = calculate_polygon_area(data.boundary_coordinates or [])
    c_lat, c_lon = calculate_centroid(data.boundary_coordinates or [])

    if data.name:
        farm.name = data.name
    if data.boundary_coordinates:
        farm.boundary_geojson = serialize_boundary(data.boundary_coordinates)
        farm.area_acres = area_dict["acres"]
        farm.area_hectares = area_dict["hectares"]
        farm.center_lat = c_lat
        farm.center_lon = c_lon
    if data.center_lat is not None:
        farm.center_lat = data.center_lat
    if data.center_lon is not None:
        farm.center_lon = data.center_lon
    if data.village_locality is not None:
        farm.village_locality = data.village_locality
    if data.district is not None:
        farm.district = data.district
    if data.state is not None:
        farm.state = data.state
    if data.country is not None:
        farm.country = data.country
    if data.area_unit is not None:
        farm.area_unit = data.area_unit
    if data.location_name:
        farm.location_name = data.location_name
    if data.is_active is True:
        db.query(Farm).filter(Farm.farmer_id == farmer_id).update({Farm.is_active: False})
        farm.is_active = True

    farm.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(farm)
    return farm

async def get_all_farms_response(db: Session, farmer_id: int = 1) -> List[FarmResponse]:
    farms = db.query(Farm).filter(Farm.farmer_id == farmer_id).order_by(Farm.created_at.desc()).all()
    if not farms:
        return []

    responses = []
    for farm in farms:
        responses.append(await get_farm_details(db, farm_id=farm.id, farmer_id=farmer_id))
    return responses

def delete_farm_record(db: Session, farm_id: int, farmer_id: int = 1) -> bool:
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.farmer_id == farmer_id).first()
    if not farm:
        return False
    
    # Cascade delete fields & disease observations for this farm
    fields = db.query(FieldModel).filter(FieldModel.farm_id == farm_id).all()
    for f in fields:
        db.query(DiseaseObsModel).filter(DiseaseObsModel.field_id == f.id).delete()
        db.delete(f)

    was_active = farm.is_active
    db.delete(farm)
    db.commit()

    if was_active:
        remaining_farm = db.query(Farm).filter(Farm.farmer_id == farmer_id).first()
        if remaining_farm:
            remaining_farm.is_active = True
            db.commit()
    return True

async def create_field(db: Session, farm_id: int, data: FieldCreate) -> FieldResponse:
    area_dict = calculate_polygon_area(data.boundary_coordinates or [])
    field = FieldModel(
        farm_id=farm_id,
        name=data.name,
        boundary_geojson=serialize_boundary(data.boundary_coordinates),
        area_acres=area_dict["acres"],
        area_hectares=area_dict["hectares"],
        crop=data.crop,
        crop_variety=data.crop_variety or "",
        sowing_date=data.sowing_date or "",
        growth_stage=data.growth_stage or "Vegetative",
        irrigation_type=data.irrigation_type or "Tube well",
        soil_type=data.soil_type or "Alluvial",
        health_status="Healthy",
        disease_status="None",
        notes=data.notes or ""
    )
    db.add(field)
    db.commit()
    db.refresh(field)
    return await format_field_response(db, field)

async def update_field(db: Session, field_id: int, data: FieldUpdate) -> Optional[FieldResponse]:
    field = db.query(FieldModel).filter(FieldModel.id == field_id).first()
    if not field:
        return None

    if data.name is not None:
        field.name = data.name
    if data.boundary_coordinates is not None:
        field.boundary_geojson = serialize_boundary(data.boundary_coordinates)
        area_dict = calculate_polygon_area(data.boundary_coordinates)
        field.area_acres = area_dict["acres"]
        field.area_hectares = area_dict["hectares"]
    if data.crop is not None:
        field.crop = data.crop
    if data.crop_variety is not None:
        field.crop_variety = data.crop_variety
    if data.sowing_date is not None:
        field.sowing_date = data.sowing_date
    if data.growth_stage is not None:
        field.growth_stage = data.growth_stage
    if data.irrigation_type is not None:
        field.irrigation_type = data.irrigation_type
    if data.soil_type is not None:
        field.soil_type = data.soil_type
    if data.health_status is not None:
        field.health_status = data.health_status
    if data.disease_status is not None:
        field.disease_status = data.disease_status
    if data.notes is not None:
        field.notes = data.notes

    field.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(field)
    return await format_field_response(db, field)

def delete_field(db: Session, field_id: int) -> bool:
    field = db.query(FieldModel).filter(FieldModel.id == field_id).first()
    if not field:
        return False
    db.delete(field)
    db.commit()
    return True

async def add_disease_observation(db: Session, field_id: int, data: DiseaseObservationCreate) -> FieldResponse:
    field = db.query(FieldModel).filter(FieldModel.id == field_id).first()
    if not field:
        raise ValueError("Field not found")

    obs = DiseaseObsModel(
        field_id=field_id,
        disease=data.disease,
        confidence=data.confidence or "High",
        severity=data.severity or "Moderate",
        symptoms_json=json.dumps(data.symptoms or [], ensure_ascii=False),
        treatment_json=json.dumps(data.treatment or [], ensure_ascii=False),
        summary=data.summary or ""
    )
    db.add(obs)

    # Update field health status based on disease severity
    if data.severity in ["Severe", "Critical"]:
        field.health_status = "High Disease Risk"
    elif data.disease and data.disease.lower() not in ["healthy", "none"]:
        field.health_status = "Disease Risk"
    else:
        field.health_status = "Healthy"

    field.disease_status = data.disease
    field.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(field)

    return await format_field_response(db, field)
