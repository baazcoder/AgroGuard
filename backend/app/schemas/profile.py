from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any
from datetime import datetime

VALID_LANGUAGES = ["English", "Hindi", "Punjabi", "Bhojpuri", "Haryanvi"]
VALID_LAND_UNITS = ["acre", "hectare"]

class FarmerProfileBase(BaseModel):
    farmer_name: str = Field(default="", description="Name of the farmer")
    preferred_language: str = Field(default="English", description="Preferred communication language")
    state: str = Field(default="", description="State")
    district: str = Field(default="", description="District")
    village_location: str = Field(default="", description="Village or location name")
    land_area: float = Field(default=0.0, description="Total land area (must be >= 0)")
    land_unit: str = Field(default="acre", description="Unit of land measurement: acre or hectare")
    soil_type: str = Field(default="Alluvial", description="Type of soil (e.g., Alluvial, Black, Red, Loamy, Sandy, Clay)")
    irrigation_available: bool = Field(default=True, description="Availability of irrigation facilities")
    irrigation_type: str = Field(default="Tube well", description="Type of irrigation (e.g., Tube well, Canal, Drip, Sprinkler, Rainfed)")
    current_crop: str = Field(default="", description="Currently cultivated crop")
    crop_variety: Optional[str] = Field(default="", description="Variety of current crop if known")
    crop_growth_stage: str = Field(default="Vegetative", description="Current growth stage of crop")
    sowing_date: Optional[str] = Field(default="", description="Approximate date of sowing (YYYY-MM-DD)")
    farming_budget: Optional[float] = Field(default=0.0, description="Approximate seasonal budget in local currency (>= 0)")
    farming_experience_years: Optional[float] = Field(default=0.0, description="Years of farming experience (>= 0)")
    previous_crop: Optional[str] = Field(default="", description="Previous crop grown in the field")
    farm_notes: Optional[str] = Field(default="", description="Additional notes or observation")

    @field_validator("land_area", "farming_budget", "farming_experience_years", mode="before")
    @classmethod
    def validate_numeric_fields(cls, v: Any) -> float:
        if v is None or v == "" or v == "NaN":
            return 0.0
        try:
            val = float(v)
            return max(0.0, val)
        except (ValueError, TypeError):
            return 0.0

    @field_validator("land_unit")
    @classmethod
    def validate_land_unit(cls, v: str) -> str:
        unit = (v or "").strip().lower()
        if unit not in VALID_LAND_UNITS:
            return "acre"
        return unit

    @field_validator("preferred_language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        lang_input = (v or "").strip()
        mapping = {
            "en": "English", "english": "English",
            "hi": "Hindi", "hindi": "Hindi",
            "pa": "Punjabi", "punjabi": "Punjabi",
            "bho": "Bhojpuri", "bhojpuri": "Bhojpuri",
            "hr": "Haryanvi", "haryanvi": "Haryanvi"
        }
        return mapping.get(lang_input.lower(), "English")

class FarmerProfileCreate(FarmerProfileBase):
    pass

class FarmerProfileUpdate(FarmerProfileBase):
    pass

class FarmerProfileResponse(FarmerProfileBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FarmMemoryContext(BaseModel):
    farmer_name: str
    location: str
    land_area: float
    land_unit: str
    soil_type: str
    irrigation: str
    irrigation_available: bool
    current_crop: str
    crop_variety: str
    growth_stage: str
    sowing_date: str
    budget: float
    experience: float
    previous_crop: str
    language: str
    farm_notes: str
