from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any

class FarmEconomicsRequest(BaseModel):
    crop: str = Field(default="Wheat", description="Crop name")
    land_area: float = Field(default=4.0, description="Total land area")
    land_unit: str = Field(default="acre", description="Unit: acre, hectare, sqm")
    custom_market_price: Optional[float] = Field(default=None, description="Optional custom market price per quintal")

    @field_validator("land_area", mode="before")
    @classmethod
    def validate_land_area(cls, v: Any) -> float:
        if v is None or v == "" or v == "NaN":
            return 0.0
        try:
            val = float(v)
            return max(0.0, val)
        except (ValueError, TypeError):
            return 0.0

class CostBreakdownItem(BaseModel):
    category: str  # Seed, Fertilizer, Irrigation, Plant Protection, Labor, Other
    item_name: str
    quantity: float
    unit: str
    cost_per_unit: float
    total_cost: float
    is_verified: bool

class FarmEconomicsResponse(BaseModel):
    crop_name: str
    land_area: float
    land_unit: str
    land_area_acres: float
    land_area_hectares: float
    land_area_sqm: float
    
    # Financial Summaries
    total_input_cost: float
    cost_range: Dict[str, float]  # min & max
    
    cost_breakdown: List[CostBreakdownItem]
    
    expected_production_qtl: float
    expected_production_kg: float
    production_range_qtl: Dict[str, float]
    
    market_price_per_qtl: float
    market_price_source: str
    
    gross_revenue: float
    revenue_range: Dict[str, float]
    
    estimated_margin: float
    margin_range: Dict[str, float]
    
    # Status & Auditability
    is_verified_crop: bool
    data_status: str  # "VERIFIED DATA", "PARTIAL DATA", "UNAVAILABLE DATA"
    missing_fields: List[str]
    calculation_breakdown: List[str]
    disclaimer: str
