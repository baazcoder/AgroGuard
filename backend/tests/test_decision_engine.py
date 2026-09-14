import pytest
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base
from app.db.models import FarmerProfile, DiagnosisRecord
from app.services.decision_engine import get_daily_farm_action_plan

# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_decision_engine_end_to_end(test_db):
    """
    Integration test combining:
    Farmer Profile + Disease Result + Weather + Market + Farm Economics
    verifying it produces a coherent personalized action plan with priority cards, timing, and sources.
    """
    # 1. Seed Farmer Profile Memory
    profile = FarmerProfile(
        farmer_name="Gurpreet Singh",
        preferred_language="Punjabi",
        state="Punjab",
        district="Ludhiana",
        village_location="Gill Village",
        land_area=4.0,
        land_unit="acre",
        soil_type="Alluvial",
        irrigation_available=True,
        irrigation_type="Tube well",
        current_crop="Wheat",
        crop_variety="HD-3086",
        crop_growth_stage="Tillering",
        farming_budget=60000.0,
        farming_experience_years=12.0
    )
    test_db.add(profile)
    test_db.commit()

    # 2. Execute Decision Engine (using deterministic fallback)
    plan = asyncio.run(get_daily_farm_action_plan(db=test_db, force_fallback=True))

    # 3. Assertions
    assert plan.farm_status is not None
    assert "Wheat" in plan.farm_status.crop
    assert plan.farm_status.land_area != ""

    # Assert Action Items structure
    assert len(plan.today_actions) > 0
    today_first = plan.today_actions[0]
    assert today_first.priority.upper() in ["HIGH", "MEDIUM", "LOW", "AVOID"]
    assert today_first.action != ""
    assert today_first.reason != ""
    assert today_first.timing == "Today"
    assert today_first.affected_field != ""
    assert today_first.supporting_data_source != ""

    assert len(plan.next_3_days) > 0
    assert len(plan.next_7_days) > 0
    assert len(plan.watch_for) > 0
    assert len(plan.avoid) > 0

def test_decision_engine_farm_switching(test_db):
    """Test decision engine with multiple active farms (Farm A vs Farm B)."""
    from app.schemas.farm_map import FarmCreate, FieldCreate
    from app.services import farm_map_service

    # Farm 1 (Punjab Wheat)
    farm1 = farm_map_service.get_or_create_default_farm(test_db)
    farm1.is_active = True
    test_db.commit()

    # Farm 2 (Haryana Mustard)
    farm2_create = FarmCreate(
        name="Hisar Mustard Estate",
        boundary_coordinates=[[29.05, 76.08], [29.05, 76.09], [29.04, 76.09], [29.04, 76.08], [29.05, 76.08]],
        center_lat=29.0574,
        center_lon=76.0868,
        state="Haryana",
        district="Hisar",
        village_locality="Hisar Rural",
        location_name="Hisar, Haryana",
        area_acres=12.0
    )
    farm2 = farm_map_service.create_new_farm(test_db, farm2_create, farmer_id=1)
    field_create = FieldCreate(name="South Field", crop="Mustard", growth_stage="Flowering", area_acres=5.0)
    asyncio.run(farm_map_service.create_field(test_db, farm2.id, field_create))

    # Fetch Decision Plan for Farm 1
    plan1 = asyncio.run(get_daily_farm_action_plan(test_db, farm_id=farm1.id, force_fallback=True))
    assert plan1.farm_status.farm_id == farm1.id
    assert plan1.farm_status.farm_name == farm1.name

    # Fetch Decision Plan for Farm 2
    plan2 = asyncio.run(get_daily_farm_action_plan(test_db, farm_id=farm2.id, force_fallback=True))
    assert plan2.farm_status.farm_id == farm2.id
    assert plan2.farm_status.farm_name == farm2.name
    assert "Mustard" in plan2.farm_status.crop
    assert plan1.farm_status.farm_name != plan2.farm_status.farm_name

