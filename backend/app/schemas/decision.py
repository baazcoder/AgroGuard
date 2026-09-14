from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ActionItem(BaseModel):
    priority: str  # "HIGH", "MEDIUM", "LOW", "AVOID", "high", "medium", "low"
    action: str
    reason: str
    timing: str  # "Today", "Next 3 Days", "Next 7 Days"
    affected_field: Optional[str] = "All Fields"
    source_context: Optional[str] = "Farm Intelligence"
    supporting_data_source: Optional[str] = "AgroGuard Real-Time Data"
    confidence: Optional[str] = "High"

class FarmStatusSummary(BaseModel):
    crop: str
    land_area: str
    health_status: str  # "Healthy", "Moderate Risk", "High Risk", "Attention Needed"
    weather_summary: str
    market_summary: str
    economics_summary: str
    farm_id: Optional[int] = None
    farm_name: Optional[str] = None

class FarmActionPlanResponse(BaseModel):
    farm_status: FarmStatusSummary
    today_actions: List[ActionItem]
    next_3_days: List[ActionItem]
    next_7_days: List[ActionItem]
    watch_for: List[str]
    avoid: List[str]
    expert_help_when: List[str]
    is_live_ai: bool = True
    generated_at: str
