from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, field_validator

class GeoJSONPolygon(BaseModel):
    """
    Standard GeoJSON Polygon Representation.
    Coordinates structure: [ [ [longitude, latitude], [longitude, latitude], ... ] ]
    """
    type: Literal["Polygon"] = "Polygon"
    coordinates: List[List[List[float]]] = Field(
        ...,
        description="GeoJSON Polygon coordinates in [longitude, latitude] format."
    )

    @field_validator("coordinates")
    def validate_polygon_structure(cls, coords):
        if not coords or not isinstance(coords, list) or len(coords) == 0:
            raise ValueError("Polygon coordinates list cannot be empty.")
        ring = coords[0]
        if not isinstance(ring, list) or len(ring) < 3:
            raise ValueError("Polygon exterior ring must contain at least 3 coordinate points.")
        
        for pt in ring:
            if not isinstance(pt, list) or len(pt) < 2:
                raise ValueError("Each coordinate point must be a list of [longitude, latitude].")
            lon, lat = pt[0], pt[1]
            if not (-180.0 <= lon <= 180.0):
                raise ValueError(f"Longitude {lon} is out of bounds (-180 to 180).")
            if not (-90.0 <= lat <= 90.0):
                raise ValueError(f"Latitude {lat} is out of bounds (-90 to 90).")
        return coords

class SatelliteAnalysisRequest(BaseModel):
    farm: GeoJSONPolygon = Field(..., description="Target farm boundary polygon in GeoJSON format")
    date_from: Optional[str] = Field(None, description="Start date YYYY-MM-DD for imagery search")
    date_to: Optional[str] = Field(None, description="End date YYYY-MM-DD for imagery search")
    max_cloud: int = Field(30, ge=0, le=100, description="Maximum acceptable cloud coverage percentage (0-100)")

class NDVISummary(BaseModel):
    mean: float = Field(..., description="Mean Normalized Difference Vegetation Index (-1 to +1)")
    min: float = Field(..., description="Minimum NDVI value across farm polygon")
    max: float = Field(..., description="Maximum NDVI value across farm polygon")

class SatelliteAnalysisResponse(BaseModel):
    success: bool
    farm: GeoJSONPolygon
    observation_date: str = Field(..., description="Date of the analyzed satellite observation")
    cloud_coverage: float = Field(..., description="Cloud coverage percentage (0-100)")
    ndvi: NDVISummary
    vegetation_health: str = Field(..., description="Health status (e.g., Very Healthy, Healthy, Moderate, Low, Very Low)")
    risk_level: str = Field(..., description="Farm risk assessment (Low, Moderate, High)")
    true_color_url: Optional[str] = Field(None, description="Raster URL or Data URI for True Color RGB satellite image")
    ndvi_map_url: Optional[str] = Field(None, description="Raster URL or Data URI for NDVI colormap image")
    is_demo: bool = Field(False, description="Flag indicating if sample/demo data was served")
    message: str = Field(..., description="Agricultural interpretation and observation summary")
