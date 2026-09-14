from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float
from datetime import datetime
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True, nullable=False)
    email_or_phone = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DiagnosisRecord(Base):
    __tablename__ = "diagnosis_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)
    crop = Column(String, index=True)
    disease = Column(String, index=True)
    confidence = Column(String)
    severity = Column(String)
    symptoms_json = Column(Text)
    treatment_json = Column(Text)
    prevention_json = Column(Text)
    is_uncertain = Column(Boolean, default=False)
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class ChatRecord(Base):
    __tablename__ = "chat_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)
    user_message = Column(Text)
    assistant_reply = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True, nullable=True)
    farmer_name = Column(String, default="")
    preferred_language = Column(String, default="English")
    state = Column(String, default="")
    district = Column(String, default="")
    village_location = Column(String, default="")
    land_area = Column(Float, default=0.0)
    land_unit = Column(String, default="acre")
    soil_type = Column(String, default="Alluvial")
    irrigation_available = Column(Boolean, default=True)
    irrigation_type = Column(String, default="Tube well")
    current_crop = Column(String, default="")
    crop_variety = Column(String, default="")
    crop_growth_stage = Column(String, default="Vegetative")
    sowing_date = Column(String, default="")
    farming_budget = Column(Float, default=0.0)
    farming_experience_years = Column(Float, default=0.0)
    previous_crop = Column(String, default="")
    farm_notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, default=1, index=True)
    name = Column(String, default="My Farm")
    is_active = Column(Boolean, default=False, index=True)
    boundary_geojson = Column(Text, nullable=True)  # GeoJSON string of coordinates array [[lat, lon], ...]
    center_lat = Column(Float, default=30.9010)      # Default near Punjab/North India
    center_lon = Column(Float, default=75.8573)
    village_locality = Column(String, default="")
    district = Column(String, default="")
    state = Column(String, default="")
    country = Column(String, default="India")
    area_acres = Column(Float, default=0.0)
    area_hectares = Column(Float, default=0.0)
    area_unit = Column(String, default="acre")
    location_name = Column(String, default="Punjab, India")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, index=True)
    name = Column(String, default="Field 1")
    boundary_geojson = Column(Text, nullable=True)  # GeoJSON string of coordinates array [[lat, lon], ...]
    area_acres = Column(Float, default=0.0)
    area_hectares = Column(Float, default=0.0)
    crop = Column(String, default="Wheat")
    crop_variety = Column(String, default="PBW 550")
    sowing_date = Column(String, default="")
    growth_stage = Column(String, default="Vegetative")
    irrigation_type = Column(String, default="Tube well")
    soil_type = Column(String, default="Alluvial")
    health_status = Column(String, default="Healthy")  # Healthy, Monitor, Disease Risk, High Disease Risk
    disease_status = Column(String, default="None")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DiseaseObservation(Base):
    __tablename__ = "disease_observations"

    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, index=True)
    disease = Column(String, index=True)
    confidence = Column(String)
    severity = Column(String)
    symptoms_json = Column(Text, nullable=True)
    treatment_json = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


