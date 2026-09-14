import pytest
import asyncio
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.db.models import Farm
from app.schemas.farm_map import FarmCreate
from app.services import active_farm_service, farm_map_service

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

def test_active_farm_context_initialization(test_db):
    ctx = asyncio.run(active_farm_service.get_active_farm_context(test_db, farmer_id=1))
    assert ctx.farm_id is not None
    assert ctx.is_active is True
    assert ctx.name == "My Farm"
    assert ctx.latitude == 30.9010
    assert ctx.longitude == 75.8573
    assert ctx.farmer_profile is not None

def test_multi_farm_creation_and_switching(test_db):
    # 1. Initialize default farm (Farm 1)
    farm1 = farm_map_service.get_or_create_default_farm(test_db)
    farm1.is_active = True
    test_db.commit()

    # 2. Create second farm (Farm 2 in Haryana)
    farm2_create = FarmCreate(
        name="Haryana Green Acres",
        boundary_coordinates=[
            [29.0588, 76.0856],
            [29.0588, 76.0880],
            [29.0560, 76.0880],
            [29.0560, 76.0856],
            [29.0588, 76.0856]
        ],
        center_lat=29.0574,
        center_lon=76.0868,
        state="Haryana",
        district="Hisar",
        village_locality="Hisar Rural",
        location_name="Hisar, Haryana"
    )

    farm2 = farm_map_service.create_new_farm(test_db, farm2_create, farmer_id=1)
    assert farm2.id != farm1.id
    assert farm2.is_active is True

    # Check that farm1 is no longer active
    test_db.refresh(farm1)
    assert farm1.is_active is False

    # 3. Get Active Context -> should return Farm 2 (Haryana)
    ctx2 = asyncio.run(active_farm_service.get_active_farm_context(test_db, farmer_id=1))
    assert ctx2.farm_id == farm2.id
    assert ctx2.name == "Haryana Green Acres"
    assert ctx2.state == "Haryana"

    # 4. Switch back to Farm 1
    ctx1 = asyncio.run(active_farm_service.get_active_farm_context(test_db, farm_id=farm1.id, farmer_id=1))
    assert ctx1.farm_id == farm1.id
    assert ctx1.name == "My Farm"

def test_coordinate_validation():
    # Valid coordinates
    active_farm_service.validate_farm_inputs(30.9010, 75.8573, 5.0)

    # Invalid latitude
    with pytest.raises(HTTPException) as exc_lat:
        active_farm_service.validate_farm_inputs(95.0, 75.8573)
    assert exc_lat.value.status_code == 400

    # Invalid longitude
    with pytest.raises(HTTPException) as exc_lon:
        active_farm_service.validate_farm_inputs(30.9010, 195.0)
    assert exc_lon.value.status_code == 400

    # Negative area
    with pytest.raises(HTTPException) as exc_area:
        active_farm_service.validate_farm_inputs(30.9010, 75.8573, -10.0)
    assert exc_area.value.status_code == 400

def test_deleted_farm_fallback(test_db):
    farm1 = farm_map_service.get_or_create_default_farm(test_db)
    farm2 = farm_map_service.create_new_farm(test_db, FarmCreate(name="Farm 2"), farmer_id=1)

    assert farm2.is_active is True

    # Delete active farm2
    success = farm_map_service.delete_farm_record(test_db, farm2.id, farmer_id=1)
    assert success is True

    # Verify fallback active farm is farm1
    ctx = asyncio.run(active_farm_service.get_active_farm_context(test_db, farmer_id=1))
    assert ctx.farm_id == farm1.id
    assert ctx.is_active is True

def test_unauthorized_farm_access(test_db):
    # Farm belonging to farmer_id=2
    farm_other = farm_map_service.create_new_farm(test_db, FarmCreate(name="Other Farmer's Farm"), farmer_id=2)

    # Requesting farm_other.id under farmer_id=1 should fail or fall back cleanly
    with pytest.raises(HTTPException) as exc:
        active_farm_service.set_active_farm(test_db, farm_other.id, farmer_id=1)
    assert exc.value.status_code == 404
