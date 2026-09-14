import pytest
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.db.models import Farm, Field as FieldModel
from app.schemas.farm_map import FarmCreate, FieldCreate
from app.services import farm_map_service, active_farm_service
from app.services.chat_context_service import get_unified_chat_context
from app.services.gemini_service import CHAT_SYSTEM_PROMPT

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

def test_unified_chat_context_structure(test_db):
    """Verify structured Farm Context assembling required keys."""
    ctx = asyncio.run(get_unified_chat_context(test_db))
    assert "farmer" in ctx
    assert "active_farm" in ctx
    assert "fields" in ctx
    assert "crops" in ctx
    assert "weather" in ctx
    assert "nearby_mandis" in ctx
    assert "disease_observations" in ctx
    assert "economics" in ctx
    assert "current_actions" in ctx

def test_chat_context_farm_switching(test_db):
    """
    Test switching between Farm 1 (Punjab) and Farm 2 (Haryana) in get_unified_chat_context.
    Verify context responds to requested farm_id.
    """
    # 1. Farm 1 (Default Punjab)
    farm1 = farm_map_service.get_or_create_default_farm(test_db)
    farm1.is_active = True
    test_db.commit()

    # 2. Farm 2 (Haryana)
    farm2_create = FarmCreate(
        name="Haryana Green Acres",
        boundary_coordinates=[[29.05, 76.08], [29.05, 76.09], [29.04, 76.09], [29.04, 76.08], [29.05, 76.08]],
        center_lat=29.0574,
        center_lon=76.0868,
        state="Haryana",
        district="Hisar",
        village_locality="Hisar Rural",
        location_name="Hisar, Haryana",
        area_acres=10.5
    )
    farm2 = farm_map_service.create_new_farm(test_db, farm2_create, farmer_id=1)

    ctx_farm1 = asyncio.run(get_unified_chat_context(test_db, farm_id=farm1.id))
    assert ctx_farm1["active_farm"].get("farm_id") == farm1.id

    ctx_farm2 = asyncio.run(get_unified_chat_context(test_db, farm_id=farm2.id))
    assert ctx_farm2["active_farm"].get("farm_id") == farm2.id
    assert ctx_farm1["active_farm"]["name"] != ctx_farm2["active_farm"]["name"]

def test_chat_context_field_selection(test_db):
    """Test selected_field resolution when field_id parameter is passed."""
    farm1 = farm_map_service.get_or_create_default_farm(test_db)
    f_create = FieldCreate(name="North Wheat Field", crop="Wheat", growth_stage="Tillering", area_acres=2.5)
    field1 = asyncio.run(farm_map_service.create_field(test_db, farm1.id, f_create))

    ctx = asyncio.run(get_unified_chat_context(test_db, farm_id=farm1.id, field_id=field1.id))
    assert ctx.get("selected_field") is not None
    assert ctx["selected_field"].get("field_id") == field1.id
    assert ctx["selected_field"].get("field_name") == "North Wheat Field"

def test_chat_response_missing_data_unavailability_notice():
    """Verify chatbot returns explicit unavailable notices when data/API is unavailable."""
    assert "MISSING DATA HANDLING" in CHAT_SYSTEM_PROMPT
    assert "NEVER INVENT OR FABRICATE DATA" in CHAT_SYSTEM_PROMPT

def test_chat_context_empty_db_fallback(test_db):
    """Test get_unified_chat_context when DB has no existing farms or profiles."""
    ctx = asyncio.run(get_unified_chat_context(test_db))
    assert ctx["active_farm"] is not None
    assert ctx["active_farm"]["name"] == "My Farm"
    assert "fields" in ctx

def test_chat_context_null_weather_mandi_fallback(test_db, monkeypatch):
    """Verify context handles missing/empty weather and market services gracefully without crashing."""
    async def mock_weather(*args, **kwargs):
        raise Exception("Weather API Unreachable")

    async def mock_mandis(*args, **kwargs):
        raise Exception("Market API Unreachable")

    from app.services import weather_service, market_service
    monkeypatch.setattr(weather_service, "get_weather_data", mock_weather)
    monkeypatch.setattr(market_service, "get_market_prices", mock_mandis)

    ctx = asyncio.run(get_unified_chat_context(test_db))
    assert ctx["weather"]["is_unavailable"] is True
    assert ctx["nearby_mandis"] == []


