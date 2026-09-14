import json
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import DiagnosisRecord
from app.services import (
    active_farm_service,
    profile_service,
    weather_service,
    market_service,
    farm_map_service,
    economics_service,
    weather_intelligence
)

logger = logging.getLogger(__name__)

async def get_unified_chat_context(
    db: Session,
    farm_id: Optional[int] = None,
    field_id: Optional[int] = None,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Assembles structured Active Farm Context for AgroGuard AI Chatbot:
    1. farmer: Profile memory (name, language, budget, experience)
    2. active_farm: Currently selected farm metadata & boundary center (id, name, total_area, lat/lon, location)
    3. selected_field: Detailed field context if field_id provided or selected on farm map
    4. fields: All fields on active farm with crops, growth stages, soil, irrigation, health
    5. crops: List of active crops across farm fields
    6. weather: Live weather forecast & agricultural advisories for farm coordinates
    7. nearby_mandis: Proximity-ranked nearby mandi commodity prices with distances & timestamps
    8. disease_observations: Recent leaf disease diagnoses and field observations
    9. economics: Estimated crop input costs, revenue, and gross margins
    10. current_actions: Weather-aware daily decision engine action plan
    """
    # 1. Active Farm Context
    active_farm_data = {}
    fields_list = []
    crops_set = set()
    selected_field_data = None
    farmer_ctx = profile_service.get_farmer_context(db, user_id=user_id)

    try:
        f_id = user_id if user_id is not None else 0
        af_ctx = await active_farm_service.get_active_farm_context(db, farm_id=farm_id, farmer_id=f_id)
        if af_ctx:
            active_farm_data = {
                "farm_id": af_ctx.farm_id,
                "name": af_ctx.name,
                "total_area_acres": af_ctx.area_acres,
                "total_area_hectares": af_ctx.area_hectares,
                "area_unit": af_ctx.area_unit,
                "latitude": af_ctx.latitude,
                "longitude": af_ctx.longitude,
                "location_name": af_ctx.location_name,
                "village_locality": af_ctx.village_locality,
                "district": af_ctx.district,
                "state": af_ctx.state,
                "country": af_ctx.country
            }

            for f in af_ctx.fields:
                field_dict = {
                    "field_id": f.id,
                    "field_name": f.name,
                    "area_acres": f.area_acres,
                    "area_hectares": f.area_hectares,
                    "crop": f.crop,
                    "crop_variety": f.crop_variety,
                    "growth_stage": f.growth_stage,
                    "soil_type": f.soil_type,
                    "irrigation_type": f.irrigation_type,
                    "health_status": f.health_status,
                    "disease_status": f.disease_status,
                    "notes": f.notes,
                    "latest_disease": f.latest_disease_observation.disease if f.latest_disease_observation else None,
                    "latest_disease_severity": f.latest_disease_observation.severity if f.latest_disease_observation else None
                }
                fields_list.append(field_dict)
                if f.crop:
                    crops_set.add(f.crop)

                if field_id is not None and f.id == field_id:
                    selected_field_data = field_dict

            # If field_id not specified but fields exist, set first field as default selected_field
            if selected_field_data is None and fields_list:
                selected_field_data = fields_list[0]

    except Exception as e:
        logger.error(f"Failed to fetch active farm for chatbot context: {e}")

    # Fallback crop if set in profile, otherwise empty
    if not crops_set:
        farmer_crop = farmer_ctx.get("crop") or farmer_ctx.get("current_crop")
        if farmer_crop:
            crops_set.add(farmer_crop)

    crops_list = list(crops_set)
    primary_crop = crops_list[0] if crops_list else "No Crop Mapped"

    # 2. Weather Context for Active Farm Coordinates
    weather_ctx = {"is_unavailable": True, "status": "Weather data unavailable"}
    try:
        w_data = await weather_service.get_weather_data(
            lat=active_farm_data.get("latitude"),
            lon=active_farm_data.get("longitude"),
            location_name=active_farm_data.get("location_name") or farmer_ctx.get("district"),
            farm_context=farmer_ctx,
            farm_id=active_farm_data.get("farm_id")
        )
        weather_ctx = {
            "location": w_data.location,
            "temperature_celsius": w_data.temperature,
            "feels_like_celsius": w_data.feels_like,
            "condition": w_data.condition,
            "humidity_percent": w_data.humidity,
            "wind_speed_kmh": w_data.wind_speed,
            "rain_probability_percent": w_data.rain_probability,
            "precipitation_mm": w_data.precipitation_mm or 0.0,
            "uv_index": w_data.uv_index,
            "agricultural_warnings": w_data.agricultural_warnings,
            "weather_source": w_data.weather_source,
            "last_updated": w_data.last_updated,
            "is_unavailable": w_data.is_unavailable
        }
    except Exception as e:
        logger.error(f"Failed to fetch weather for active farm chatbot context: {e}")

    # 3. Mandi Market Prices Context
    nearby_mandis = []
    try:
        m_data = await market_service.get_market_prices(
            crop_filter=primary_crop,
            state_filter=active_farm_data.get("state") or farmer_ctx.get("state"),
            farm_context={
                "farm_id": active_farm_data.get("farm_id"),
                "name": active_farm_data.get("name"),
                "latitude": active_farm_data.get("latitude"),
                "longitude": active_farm_data.get("longitude"),
                "crops": crops_list,
                "district": active_farm_data.get("district"),
                "state": active_farm_data.get("state")
            }
        )
        nearby_mandis = [
            {
                "crop": item.crop,
                "mandi": item.mandi,
                "state": item.state,
                "district": item.district,
                "distance_km": item.distance_km,
                "min_price": item.min_price,
                "max_price": item.max_price,
                "modal_price": item.modal_price,
                "unit": item.unit,
                "trend": item.trend,
                "trend_display": item.trend_display,
                "updated_minutes_ago": item.updated_minutes_ago,
                "data_source": item.data_source,
                "is_price_available": item.is_price_available,
                "price_status": item.price_status
            }
            for item in m_data.prices
        ]
    except Exception as e:
        logger.error(f"Failed to fetch market prices for chatbot context: {e}")

    # 4. Recent Disease Diagnoses Context
    disease_obs = []
    try:
        records = db.query(DiagnosisRecord).order_by(DiagnosisRecord.created_at.desc()).limit(5).all()
        for r in records:
            symptoms = json.loads(r.symptoms_json) if r.symptoms_json else []
            treatments = json.loads(r.treatment_json) if r.treatment_json else []
            disease_obs.append({
                "crop": r.crop,
                "detected_disease": r.disease,
                "confidence": r.confidence,
                "severity": r.severity,
                "symptoms": symptoms,
                "treatments": treatments,
                "summary": r.summary,
                "diagnosed_at": r.created_at.strftime("%Y-%m-%d %H:%M")
            })
    except Exception as e:
        logger.error(f"Failed to fetch disease diagnoses for chatbot context: {e}")

    # 5. Farm Economics Context
    economics_ctx = {}
    try:
        ec_res = await economics_service.calculate_farm_economics(
            crop=primary_crop,
            land_area=active_farm_data.get("total_area_acres") or 4.0,
            land_unit="acre"
        )
        economics_ctx = {
            "crop_name": ec_res.crop_name,
            "land_area_acres": ec_res.land_area_acres,
            "total_input_cost": ec_res.total_input_cost,
            "expected_production_qtl": ec_res.expected_production_qtl,
            "market_price_per_qtl": ec_res.market_price_per_qtl,
            "gross_revenue": ec_res.gross_revenue,
            "estimated_margin": ec_res.estimated_margin,
            "data_status": ec_res.data_status
        }
    except Exception as e:
        logger.error(f"Failed to fetch economics for chatbot context: {e}")

    # 6. Current Weather-Aware Decision Engine Actions
    current_actions = []
    try:
        advisories = weather_intelligence.generate_weather_intelligence(
            temperature=weather_ctx.get("temperature_celsius", 25.0),
            humidity=weather_ctx.get("humidity_percent", 60.0),
            wind_speed=weather_ctx.get("wind_speed_kmh", 10.0),
            rain_probability=weather_ctx.get("rain_probability_percent", 10),
            condition=weather_ctx.get("condition", "Clear"),
            farm_context={"crop": primary_crop, "growth_stage": "Vegetative"}
        )
        current_actions = [
            {
                "category": adv.category,
                "status": adv.status,
                "action": adv.title,
                "recommendations": adv.recommendations,
                "reasons": adv.reasons
            }
            for adv in advisories
        ]
    except Exception as e:
        logger.error(f"Failed to generate decision engine actions for chatbot: {e}")

    return {
        "farmer": {
            "name": farmer_ctx.get("farmer_name", "Farmer"),
            "preferred_language": farmer_ctx.get("language", "English"),
            "district": farmer_ctx.get("district", "Patiala"),
            "state": farmer_ctx.get("state", "Punjab"),
            "farming_budget": farmer_ctx.get("farming_budget"),
            "farming_experience_years": farmer_ctx.get("farming_experience_years")
        },
        "active_farm": active_farm_data,
        "selected_field": selected_field_data,
        "fields": fields_list,
        "crops": crops_list,
        "weather": weather_ctx,
        "nearby_mandis": nearby_mandis,
        "disease_observations": disease_obs,
        "economics": economics_ctx,
        "current_actions": current_actions
    }

