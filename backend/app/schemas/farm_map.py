from pydantic import BaseModel, Field as PydanticField
from typing import List, Optional, Any, Dict
from datetime import datetime

class DiseaseObservationCreate(BaseModel):
    disease: str
    confidence: Optional[str] = "High"
    severity: Optional[str] = "Moderate"
    symptoms: Optional[List[str]] = []
    treatment: Optional[List[str]] = []
    summary: Optional[str] = ""

class DiseaseObservationResponse(BaseModel):
    id: int
    field_id: int
    disease: str
    confidence: str
    severity: str
    symptoms: List[str] = []
    treatment: List[str] = []
    summary: Optional[str] = ""
    created_at: datetime

    class Config:
        from_attributes = True

class FieldCreate(BaseModel):
    name: str = "Field 1"
    boundary_coordinates: Optional[List[List[float]]] = []
    crop: str = "Wheat"
    crop_variety: Optional[str] = "PBW 550"
    sowing_date: Optional[str] = ""
    growth_stage: Optional[str] = "Vegetative"
    irrigation_type: Optional[str] = "Tube well"
    soil_type: Optional[str] = "Alluvial"
    notes: Optional[str] = ""

class FieldUpdate(BaseModel):
    name: Optional[str] = None
    boundary_coordinates: Optional[List[List[float]]] = None
    crop: Optional[str] = None
    crop_variety: Optional[str] = None
    sowing_date: Optional[str] = None
    growth_stage: Optional[str] = None
    irrigation_type: Optional[str] = None
    soil_type: Optional[str] = None
    health_status: Optional[str] = None
    disease_status: Optional[str] = None
    notes: Optional[str] = None

class FieldResponse(BaseModel):
    id: int
    farm_id: int
    name: str
    boundary_coordinates: List[List[float]] = []
    area_acres: float
    area_hectares: float
    crop: str
    crop_variety: Optional[str] = ""
    sowing_date: Optional[str] = ""
    growth_stage: str
    irrigation_type: str
    soil_type: str
    health_status: str
    disease_status: str
    notes: Optional[str] = ""
    created_at: datetime
    updated_at: datetime
    latest_disease_observation: Optional[DiseaseObservationResponse] = None
    economics_summary: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class FarmCreate(BaseModel):
    name: Optional[str] = "My Farm"
    boundary_coordinates: Optional[List[List[float]]] = []
    center_lat: Optional[float] = 30.9010
    center_lon: Optional[float] = 75.8573
    village_locality: Optional[str] = ""
    district: Optional[str] = ""
    state: Optional[str] = ""
    country: Optional[str] = "India"
    area_unit: Optional[str] = "acre"
    location_name: Optional[str] = "Punjab, India"
    is_active: Optional[bool] = False

class FarmResponse(BaseModel):
    id: int
    name: str
    is_active: bool = False
    boundary_coordinates: List[List[float]] = []
    center_lat: float
    center_lon: float
    village_locality: Optional[str] = ""
    district: Optional[str] = ""
    state: Optional[str] = ""
    country: Optional[str] = "India"
    area_acres: float
    area_hectares: float
    area_unit: Optional[str] = "acre"
    location_name: str
    created_at: datetime
    updated_at: datetime
    fields: List[FieldResponse] = []
    overall_health: str = "Healthy"
    summary_stats: Dict[str, Any] = {}
    farmer_profile: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class ActiveFarmContextResponse(BaseModel):
    farm_id: int
    name: str
    is_active: bool = True
    boundary: List[List[float]] = []
    latitude: float
    longitude: float
    village_locality: str = ""
    district: str = ""
    state: str = ""
    country: str = "India"
    total_area: float = 0.0
    area_unit: str = "acre"
    area_acres: float = 0.0
    area_hectares: float = 0.0
    location_name: str = ""
    fields: List[FieldResponse] = []
    crops: List[str] = []
    soil_information: List[str] = []
    irrigation_information: List[str] = []
    crop_stages: List[str] = []
    farmer_profile: Optional[Dict[str, Any]] = None

