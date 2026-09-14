from typing import Dict, Any, List
from app.schemas.weather import WeatherAdvisory

def generate_weather_intelligence(
    temperature: float,
    humidity: float,
    wind_speed: float,
    rain_probability: int,
    condition: str,
    farm_context: Dict[str, Any]
) -> List[WeatherAdvisory]:
    """
    Deterministic weather intelligence rule engine.
    Translates raw weather parameters and farmer context into actionable agricultural advisories.
    """
    crop = farm_context.get("crop") or "Crop"
    growth_stage = farm_context.get("growth_stage") or "Current Stage"
    
    advisories: List[WeatherAdvisory] = []

    # 1. Spraying Advisory
    if rain_probability > 50:
        advisories.append(WeatherAdvisory(
            category="spraying",
            status="UNSAFE",
            title="Spraying Advisory: Unsafe (High Rain Risk)",
            recommendations=[
                f"Do not perform chemical or pesticide spraying on {crop}.",
                "Expected rain within 24 hours will wash away applied chemicals, resulting in financial loss and ineffective pest control."
            ],
            reasons=[f"Rain probability is high at {rain_probability}% (threshold > 50%)"]
        ))
    elif wind_speed >= 20.0:
        advisories.append(WeatherAdvisory(
            category="spraying",
            status="UNSAFE",
            title="Spraying Advisory: Unsafe (High Wind Drift)",
            recommendations=[
                f"Postpone spraying pesticides or fertilizers on {crop}.",
                "High wind speed causes severe spray drift to adjacent fields and reduces coverage efficiency."
            ],
            reasons=[f"Wind speed is {wind_speed} km/h (threshold >= 20.0 km/h)"]
        ))
    elif wind_speed >= 15.0 or rain_probability >= 30:
        advisories.append(WeatherAdvisory(
            category="spraying",
            status="CAUTION",
            title="Spraying Advisory: Exercise Caution",
            recommendations=[
                "If spraying is urgent, use low-drift spray nozzles early in the morning.",
                "Monitor localized wind conditions before beginning application."
            ],
            reasons=[f"Moderate wind speed ({wind_speed} km/h) or moderate rain chance ({rain_probability}%)"]
        ))
    else:
        advisories.append(WeatherAdvisory(
            category="spraying",
            status="SAFE",
            title="Spraying Advisory: Optimal Conditions",
            recommendations=[
                f"Conditions are safe for applying required treatments or foliar sprays on {crop}.",
                "Ensure recommended dosage and appropriate personal protective equipment (PPE)."
            ],
            reasons=[f"Low wind ({wind_speed} km/h) and minimal rain risk ({rain_probability}%)"]
        ))

    # 2. Irrigation Advisory
    if rain_probability > 50:
        advisories.append(WeatherAdvisory(
            category="irrigation",
            status="DELAY",
            title="Irrigation Advisory: Delay Recommended",
            recommendations=[
                "Hold off on scheduled irrigation.",
                "Upcoming rainfall can naturally fulfill crop water requirements and prevent root waterlogging."
            ],
            reasons=[f"High rain probability of {rain_probability}%"]
        ))
    elif temperature >= 38.0:
        advisories.append(WeatherAdvisory(
            category="irrigation",
            status="RECOMMENDED",
            title="Irrigation Advisory: Heat Stress Prevention",
            recommendations=[
                f"Apply light irrigation to {crop} during early morning or late evening.",
                "Prevents evapotranspiration stress and crop wilting under extreme heat."
            ],
            reasons=[f"Extreme temperature recorded ({temperature}°C >= 38°C)"]
        ))
    else:
        advisories.append(WeatherAdvisory(
            category="irrigation",
            status="SAFE",
            title="Irrigation Advisory: Standard Schedule",
            recommendations=[
                f"Maintain normal irrigation intervals suitable for {crop} at the {growth_stage} stage."
            ],
            reasons=[f"Moderate temperature ({temperature}°C) and low rain risk ({rain_probability}%)"]
        ))

    # 3. Disease & Fungal Spore Risk
    is_high_humidity = humidity >= 75.0
    is_favorable_temp = 20.0 <= temperature <= 32.0

    if is_high_humidity and is_favorable_temp:
        advisories.append(WeatherAdvisory(
            category="disease_risk",
            status="HIGH_RISK",
            title="Disease Risk: High Fungal Threat",
            recommendations=[
                f"Inspect {crop} leaves carefully for signs of rust, powdery mildew, or blight.",
                "Ensure proper field drainage and consider preventive organic or biological fungicide if symptoms appear."
            ],
            reasons=[f"High humidity ({humidity}%) and warm temperatures ({temperature}°C) create ideal conditions for fungal spore germination."]
        ))
    elif humidity >= 70.0:
        advisories.append(WeatherAdvisory(
            category="disease_risk",
            status="CAUTION",
            title="Disease Risk: Moderate Humidity",
            recommendations=[
                f"Keep an eye on dense leaf canopy in {crop} fields for leaf dampness."
            ],
            reasons=[f"Humidity is elevated at {humidity}%"]
        ))
    else:
        advisories.append(WeatherAdvisory(
            category="disease_risk",
            status="LOW_RISK",
            title="Disease Risk: Low Threat Level",
            recommendations=[
                "Environmental conditions are currently unfavorable for rapid pathogen spreading."
            ],
            reasons=[f"Humidity ({humidity}%) and temperature ({temperature}°C) are within safe ranges."]
        ))

    # 4. Field Operations Advisory
    if rain_probability > 50:
        advisories.append(WeatherAdvisory(
            category="field_ops",
            status="CAUTION",
            title="Field Operations: Rain Protection Required",
            recommendations=[
                "Secure harvested crops under waterproof tarpaulins immediately.",
                "Ensure field boundary channels are clear of debris to handle run-off."
            ],
            reasons=[f"Incoming rain likely ({rain_probability}%)"]
        ))
    elif temperature >= 40.0:
        advisories.append(WeatherAdvisory(
            category="field_ops",
            status="CAUTION",
            title="Field Operations: Extreme Heat Alert",
            recommendations=[
                "Avoid heavy physical field work during peak sunlight hours (12:00 PM to 4:00 PM).",
                "Ensure adequate hydration for farm workers and livestock."
            ],
            reasons=[f"Severe high temperature ({temperature}°C)"]
        ))
    else:
        advisories.append(WeatherAdvisory(
            category="field_ops",
            status="SAFE",
            title="Field Operations: Good Conditions",
            recommendations=[
                "Suitable conditions for field labor, harvesting, weeding, and tilling."
            ],
            reasons=[f"Favorable working weather ({temperature}°C, wind {wind_speed} km/h)"]
        ))

    # 5. Planting & Sowing Advisory
    if rain_probability > 60 or temperature > 40.0:
        advisories.append(WeatherAdvisory(
            category="planting",
            status="DELAY",
            title="Planting Advisory: Delay Sowing",
            recommendations=[
                f"Postpone sowing or transplanting new seedlings of {crop}.",
                "Heavy rainfall or extreme heat can wash away seeds or burn delicate young shoots."
            ],
            reasons=[f"Extreme weather conditions (Rain: {rain_probability}%, Temp: {temperature}°C)"]
        ))
    else:
        advisories.append(WeatherAdvisory(
            category="planting",
            status="SAFE",
            title="Planting Advisory: Safe Sowing Window",
            recommendations=[
                f"Conditions are favorable for soil preparation, bed nursery work, or seed sowing for {crop}."
            ],
            reasons=[f"Soil temperature and moisture parameters are within normal range ({temperature}°C)"]
        ))

    # 6. Harvesting & Post-Harvest Advisory
    if rain_probability > 40:
        advisories.append(WeatherAdvisory(
            category="harvesting",
            status="CAUTION",
            title="Harvesting Advisory: Expedite Harvest & Protect Produce",
            recommendations=[
                f"If {crop} is mature, expedite harvesting before rainfall begins.",
                "Store threshed grain in covered shelters to prevent moisture damage and aflatoxin development."
            ],
            reasons=[f"Rain probability is {rain_probability}% during harvest window"]
        ))
    else:
        advisories.append(WeatherAdvisory(
            category="harvesting",
            status="SAFE",
            title="Harvesting Advisory: Clear Harvesting Window",
            recommendations=[
                f"Ideal weather for harvesting, threshing, and sun-drying produce."
            ],
            reasons=[f"Dry weather condition ({condition}) with low rain probability ({rain_probability}%)"]
        ))

    return advisories
