import pytest
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.utils.geo_utils import calculate_polygon_area, calculate_centroid
from app.schemas.farm_map import FarmCreate, FieldCreate, DiseaseObservationCreate
from app.services import farm_map_service

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

def test_calculate_polygon_area():
    # Square polygon ~ 400m x 400m near Ludhiana
    square_coords = [
        [30.9000, 75.8500],
        [30.9000, 75.8542],
        [30.9036, 75.8542],
        [30.9036, 75.8500],
        [30.9000, 75.8500]
    ]

    res = calculate_polygon_area(square_coords)
    assert res["sq_meters"] > 0
    assert res["acres"] > 0
    assert res["hectares"] > 0

    c_lat, c_lon = calculate_centroid(square_coords)
    assert 30.8 < c_lat < 31.0
    assert 75.7 < c_lon < 76.0

def test_get_or_create_default_farm(test_db):
    farm = farm_map_service.get_or_create_default_farm(test_db)
    assert farm.id is not None
    assert farm.name == "My Farm"
    assert farm.area_acres > 0

def test_farm_map_details_async(test_db):
    details = asyncio.run(farm_map_service.get_farm_details(test_db))
    assert details.id is not None
    assert len(details.fields) >= 3
    assert details.summary_stats["total_area_acres"] > 0

def test_field_crud_and_disease_observation(test_db):
    # 1. Ensure default farm
    farm = farm_map_service.get_or_create_default_farm(test_db)

    # 2. Add field
    field_create = FieldCreate(
        name="Test Plot 99",
        boundary_coordinates=[
            [30.9050, 75.8550],
            [30.9050, 75.8570],
            [30.9030, 75.8570],
            [30.9030, 75.8550],
            [30.9050, 75.8550]
        ],
        crop="Wheat",
        crop_variety="PBW 550",
        growth_stage="Vegetative",
        irrigation_type="Tube well",
        soil_type="Alluvial"
    )

    field_resp = asyncio.run(farm_map_service.create_field(test_db, farm.id, field_create))
    assert field_resp.name == "Test Plot 99"
    assert field_resp.health_status == "Healthy"
    assert field_resp.area_acres > 0

    # 3. Add disease observation
    obs_create = DiseaseObservationCreate(
        disease="Yellow Rust",
        confidence="High",
        severity="Severe",
        symptoms=["Yellow pustules"],
        treatment=["Propiconazole"],
        summary="Yellow Rust detected"
    )

    updated_field = asyncio.run(farm_map_service.add_disease_observation(test_db, field_resp.id, obs_create))
    assert updated_field.health_status == "High Disease Risk"
    assert updated_field.disease_status == "Yellow Rust"

    # 4. Delete field
    success = farm_map_service.delete_field(test_db, field_resp.id)
    assert success is True
