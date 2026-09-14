from pydantic import BaseModel
from typing import List, Optional

class AdvisorRequest(BaseModel):
    region: str
    season: str # Kharif, Rabi, Zaid
    soil_type: str # Alluvial, Black, Red, Clay, Loamy
    water_availability: str # Abundant, Irrigation, Rainfed / Limited
    language: Optional[str] = "English"

class CropRecommendation(BaseModel):
    crop_name: str
    category: str # Cereals, Pulses, Cash Crops, Vegetables
    suitability_score: int # e.g. 95%
    expected_duration: str # e.g. 110-120 days
    water_requirement: str
    market_outlook: str
    key_tips: List[str]

class AdvisorResponse(BaseModel):
    region: str
    season: str
    soil_type: str
    recommendations: List[CropRecommendation]
    ai_reasoning: str
