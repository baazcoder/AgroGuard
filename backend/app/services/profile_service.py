from sqlalchemy.orm import Session
from app.db.models import FarmerProfile
from app.schemas.profile import FarmerProfileCreate, FarmerProfileUpdate, FarmerProfileResponse
from datetime import datetime
from typing import Optional, Dict, Any

def get_or_create_farmer_profile(db: Session, user_id: Optional[int] = None) -> FarmerProfile:
    """
    Get existing farmer profile for user_id or create an initial default profile in DB.
    """
    query = db.query(FarmerProfile)
    if user_id is not None:
        query = query.filter(FarmerProfile.user_id == user_id)
    
    profile = query.first()
    if not profile:
        profile = FarmerProfile(
            user_id=user_id,
            farmer_name="",
            preferred_language="English",
            state="",
            district="",
            village_location="",
            land_area=0.0,
            land_unit="acre",
            soil_type="Alluvial",
            irrigation_available=True,
            irrigation_type="Tube well",
            current_crop="",
            crop_variety="",
            crop_growth_stage="Vegetative",
            sowing_date="",
            farming_budget=0.0,
            farming_experience_years=0.0,
            previous_crop="",
            farm_notes=""
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

def save_farmer_profile(db: Session, data: FarmerProfileUpdate, user_id: Optional[int] = None) -> FarmerProfile:
    """
    Create or update farmer profile for user_id in DB.
    """
    query = db.query(FarmerProfile)
    if user_id is not None:
        query = query.filter(FarmerProfile.user_id == user_id)
    
    profile = query.first()
    if not profile:
        profile = FarmerProfile(user_id=user_id)
        db.add(profile)

    profile.farmer_name = data.farmer_name
    profile.preferred_language = data.preferred_language
    profile.state = data.state
    profile.district = data.district
    profile.village_location = data.village_location
    profile.land_area = max(0.0, data.land_area)
    profile.land_unit = data.land_unit
    profile.soil_type = data.soil_type
    profile.irrigation_available = data.irrigation_available
    profile.irrigation_type = data.irrigation_type
    profile.current_crop = data.current_crop
    profile.crop_variety = data.crop_variety or ""
    profile.crop_growth_stage = data.crop_growth_stage
    profile.sowing_date = data.sowing_date or ""
    profile.farming_budget = max(0.0, data.farming_budget or 0.0)
    profile.farming_experience_years = max(0.0, data.farming_experience_years or 0.0)
    profile.previous_crop = data.previous_crop or ""
    profile.farm_notes = data.farm_notes or ""
    profile.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(profile)
    return profile

def get_farmer_context(db: Session, user_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Build clean internal `farmer_context` dictionary representation (Farm Memory)
    for consumption by Gemini AI chat, crop advisor, and disease analysis.
    """
    profile = get_or_create_farmer_profile(db, user_id=user_id)
    
    loc_parts = [p for p in [profile.village_location, profile.district, profile.state] if p and p.strip()]
    location_str = ", ".join(loc_parts) if loc_parts else "Not specified"

    irrigation_status = profile.irrigation_type if profile.irrigation_available else "Rainfed (No Irrigation)"

    return {
        "farmer_name": profile.farmer_name or "Farmer",
        "location": location_str,
        "state": profile.state,
        "district": profile.district,
        "village": profile.village_location,
        "land_area": profile.land_area,
        "land_unit": profile.land_unit,
        "soil_type": profile.soil_type,
        "irrigation": irrigation_status,
        "irrigation_type": profile.irrigation_type,
        "irrigation_available": profile.irrigation_available,
        "current_crop": profile.current_crop or "Not specified",
        "crop_variety": profile.crop_variety or "Not specified",
        "growth_stage": profile.crop_growth_stage or "Not specified",
        "sowing_date": profile.sowing_date or "Not specified",
        "budget": profile.farming_budget or 0.0,
        "experience_years": profile.farming_experience_years or 0.0,
        "previous_crop": profile.previous_crop or "None",
        "language": profile.preferred_language or "English",
        "farm_notes": profile.farm_notes or ""
    }
