from typing import Dict

# Exact conversion factors
ACRE_TO_HECTARE = 0.404686
HECTARE_TO_ACRE = 2.47105
ACRE_TO_SQM = 4046.86
HECTARE_TO_SQM = 10000.0
SQM_TO_ACRE = 0.000247105
SQM_TO_HECTARE = 0.0001

VALID_UNITS = {"acre", "acres", "hectare", "hectares", "ha", "sqm", "square_meter", "square_meters", "sq_meter"}

def normalize_unit(unit: str) -> str:
    u = (unit or "").strip().lower()
    if u in {"acre", "acres"}:
        return "acre"
    elif u in {"hectare", "hectares", "ha"}:
        return "hectare"
    elif u in {"sqm", "square_meter", "square_meters", "sq_meter"}:
        return "sqm"
    return "acre"

def to_acres(area: float, unit: str) -> float:
    """
    Convert land area from any supported unit to Acres.
    Returns 0.0 for zero or negative land areas.
    """
    if area is None or area <= 0:
        return 0.0

    norm = normalize_unit(unit)
    if norm == "acre":
        return round(float(area), 4)
    elif norm == "hectare":
        return round(float(area) * HECTARE_TO_ACRE, 4)
    elif norm == "sqm":
        return round(float(area) * SQM_TO_ACRE, 4)
    return round(float(area), 4)

def to_hectares(area: float, unit: str) -> float:
    """
    Convert land area from any supported unit to Hectares.
    Returns 0.0 for zero or negative land areas.
    """
    if area is None or area <= 0:
        return 0.0

    norm = normalize_unit(unit)
    if norm == "hectare":
        return round(float(area), 4)
    elif norm == "acre":
        return round(float(area) * ACRE_TO_HECTARE, 4)
    elif norm == "sqm":
        return round(float(area) * SQM_TO_HECTARE, 4)
    return round(float(area) * ACRE_TO_HECTARE, 4)

def to_sqm(area: float, unit: str) -> float:
    """
    Convert land area from any supported unit to Square Meters.
    Returns 0.0 for zero or negative land areas.
    """
    if area is None or area <= 0:
        return 0.0

    norm = normalize_unit(unit)
    if norm == "sqm":
        return round(float(area), 2)
    elif norm == "acre":
        return round(float(area) * ACRE_TO_SQM, 2)
    elif norm == "hectare":
        return round(float(area) * HECTARE_TO_SQM, 2)
    return round(float(area) * ACRE_TO_SQM, 2)
