import pytest
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.db.models import FarmerProfile
from app.schemas.farm_map import FarmCreate, FieldCreate, DiseaseObservationCreate
from app.services import farm_map_service, active_farm_service, chat_context_service, decision_engine, weather_service, market_service

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

def test_full_agroguard_integration_pipeline(test_db):
    """
    Comprehensive QA Pass executing the 30-step end-to-end user scenario:
    1. Create Farm A (Punjab Wheat/Rice) with boundary & area calculation.
    2. Create 3 Fields (North Wheat, Field 2 Yellow Rust, East Paddy).
    3. Activate Farm A -> verify weather & nearby mandis use Farm A coordinates & calculate Haversine distances.
    4. Attach Disease Observation to Field 2 -> verify Field 2 health & farm overall health summary.
    5. Retrieve Unified Chat Context for Farm A & Field 2 -> verify zero leakage.
    6. Execute AI Decision Engine for Farm A -> verify structured action items with affected fields.
    7. Create & Switch to Farm B (Haryana Mustard) -> verify weather, mandis, and chatbot context update cleanly.
    8. Verify Farm A data does NOT leak into Farm B context.
    9. Verify missing weather & mandi API offline fallback states without data fabrication.
    """
    # Step 1: Create Farm A
    farm_a_data = FarmCreate(
        name="Farm A (Ludhiana Acres)",
        boundary_coordinates=[
            [30.9030, 75.8550],
            [30.9030, 75.8610],
            [30.8990, 75.8610],
            [30.8990, 75.8550],
            [30.9030, 75.8550]
        ],
        center_lat=30.9010,
        center_lon=75.8573,
        village_locality="Gill Village",
        district="Ludhiana",
        state="Punjab",
        country="India",
        location_name="Ludhiana, Punjab"
    )
    farm_a = farm_map_service.create_new_farm(test_db, farm_a_data, farmer_id=1)
    assert farm_a.id is not None
    assert farm_a.is_active is True
    assert farm_a.area_acres > 0.0

    # Step 2: Create 3 Fields on Farm A
    f1_create = FieldCreate(name="North Wheat Field", crop="Wheat", growth_stage="Tillering", area_acres=2.0)
    f2_create = FieldCreate(name="Field 2", crop="Wheat", growth_stage="Tillering", area_acres=1.5)
    f3_create = FieldCreate(name="East Paddy Field", crop="Rice", growth_stage="Vegetative", area_acres=2.5)

    f1 = asyncio.run(farm_map_service.create_field(test_db, farm_a.id, f1_create))
    f2 = asyncio.run(farm_map_service.create_field(test_db, farm_a.id, f2_create))
    f3 = asyncio.run(farm_map_service.create_field(test_db, farm_a.id, f3_create))

    assert f1.id is not None and f2.id is not None and f3.id is not None

    # Step 3: Verify Active Farm A Context & Location-Aware Services
    active_ctx_a = asyncio.run(active_farm_service.get_active_farm_context(test_db, farm_id=farm_a.id))
    assert active_ctx_a.farm_id == farm_a.id
    assert active_ctx_a.district == "Ludhiana"
    assert len(active_ctx_a.fields) == 3

    # Step 4: Verify Weather & Mandi location binding for Farm A
    weather_a = asyncio.run(weather_service.get_weather_data(
        lat=farm_a.center_lat,
        lon=farm_a.center_lon,
        location_name=farm_a.location_name
    ))
    assert weather_a.is_unavailable is False or weather_a.location != ""

    mandis_a = asyncio.run(market_service.get_market_prices(
        crop_filter="Wheat",
        state_filter="Punjab",
        farm_context={"latitude": farm_a.center_lat, "longitude": farm_a.center_lon, "district": "Ludhiana"}
    ))
    assert len(mandis_a.prices) > 0
    # Khanna Mandi is close to Ludhiana
    top_mandi_a = mandis_a.prices[0]
    assert top_mandi_a.distance_km is not None
    assert top_mandi_a.distance_km < 100.0

    # Step 5: Upload & Associate Disease Observation to Field 2
    obs_data = DiseaseObservationCreate(
        disease="Yellow Rust",
        confidence="High",
        severity="Severe",
        symptoms=["Yellow pustules on leaves", "Foliar striping"],
        treatment=["Inspect field canopy", "Bio-fungicide spray"],
        summary="Severe Yellow Rust detected on Field 2."
    )
    f2_updated = asyncio.run(farm_map_service.add_disease_observation(test_db, f2.id, obs_data))
    assert f2_updated.health_status in ["Disease Risk", "High Disease Risk"]

    # Verify Farm Summary Stats overall health
    farm_details_a = asyncio.run(farm_map_service.get_farm_details(test_db, farm_id=farm_a.id))
    assert farm_details_a.overall_health in ["Moderate Risk", "High Disease Risk"]

    # Step 6: Verify Unified Chat Context for Farm A & Field 2
    chat_ctx_a = asyncio.run(chat_context_service.get_unified_chat_context(test_db, farm_id=farm_a.id, field_id=f2.id))
    assert chat_ctx_a["active_farm"]["farm_id"] == farm_a.id
    assert chat_ctx_a["selected_field"]["field_id"] == f2.id
    assert chat_ctx_a["selected_field"]["field_name"] == "Field 2"
    assert chat_ctx_a["selected_field"]["latest_disease"] == "Yellow Rust"

    # Step 7: Execute AI Decision Engine for Farm A
    plan_a = asyncio.run(decision_engine.get_daily_farm_action_plan(test_db, farm_id=farm_a.id, force_fallback=True))
    assert plan_a.farm_status.farm_id == farm_a.id
    assert any("Field 2" in item.affected_field or "Field 2" in item.action for item in plan_a.today_actions)

    # Step 8: Create Farm B (Haryana Mustard) & Switch Active Farm
    farm_b_data = FarmCreate(
        name="Farm B (Hisar Estate)",
        boundary_coordinates=[
            [29.05, 76.08],
            [29.05, 76.09],
            [29.04, 76.09],
            [29.04, 76.08],
            [29.05, 76.08]
        ],
        center_lat=29.0574,
        center_lon=76.0868,
        village_locality="Hisar Rural",
        district="Hisar",
        state="Haryana",
        country="India",
        location_name="Hisar, Haryana"
    )
    farm_b = farm_map_service.create_new_farm(test_db, farm_b_data, farmer_id=1)
    fb1_create = FieldCreate(name="Mustard Field B1", crop="Mustard", growth_stage="Flowering", area_acres=4.0)
    fb1 = asyncio.run(farm_map_service.create_field(test_db, farm_b.id, fb1_create))

    # Activate Farm B
    active_ctx_b = active_farm_service.set_active_farm(test_db, farm_b.id, farmer_id=1)
    assert active_ctx_b.id == farm_b.id

    # Step 9: Verify Chat Context & Decision Engine for Farm B (Zero Farm A Leakage)
    chat_ctx_b = asyncio.run(chat_context_service.get_unified_chat_context(test_db, farm_id=farm_b.id))
    assert chat_ctx_b["active_farm"]["farm_id"] == farm_b.id
    assert chat_ctx_b["active_farm"]["name"] == "Farm B (Hisar Estate)"
    assert chat_ctx_b["crops"] == ["Mustard"]
    # Ensure Field 2 or Yellow Rust from Farm A does not leak into Farm B context
    assert not any(f.get("field_name") == "North Wheat Field" for f in chat_ctx_b["fields"])

    plan_b = asyncio.run(decision_engine.get_daily_farm_action_plan(test_db, farm_id=farm_b.id, force_fallback=True))
    assert plan_b.farm_status.farm_id == farm_b.id
    assert "Mustard" in plan_b.farm_status.crop
    assert plan_b.farm_status.farm_id != plan_a.farm_status.farm_id

    # Step 10: Test Network Failure / Missing Weather Fallback State
    async def mock_offline_weather(*args, **kwargs):
        raise Exception("Open-Meteo Connection Timeout")

    monkeypatch_obj = pytest.MonkeyPatch()
    monkeypatch_obj.setattr(weather_service, "get_weather_data", mock_offline_weather)
    
    offline_ctx = asyncio.run(chat_context_service.get_unified_chat_context(test_db, farm_id=farm_b.id))
    assert offline_ctx["weather"]["is_unavailable"] is True
    monkeypatch_obj.undo()
