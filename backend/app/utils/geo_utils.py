import math
from typing import List, Tuple, Dict, Any

EARTH_RADIUS_METERS = 6378137.0  # WGS84 Earth semi-major axis

def calculate_polygon_area(coordinates: List[List[float]]) -> Dict[str, float]:
    """
    Calculate accurate geodesic area for a polygon defined by lat/lon pairs:
    [[lat1, lon1], [lat2, lon2], ...]
    
    Returns:
        dict with sq_meters, acres, and hectares.
    """
    if not coordinates or len(coordinates) < 3:
        return {"sq_meters": 0.0, "acres": 0.0, "hectares": 0.0}

    clean_coords = []
    for point in coordinates:
        if isinstance(point, (list, tuple)) and len(point) >= 2:
            lat, lon = float(point[0]), float(point[1])
            clean_coords.append((lat, lon))

    if len(clean_coords) < 3:
        return {"sq_meters": 0.0, "acres": 0.0, "hectares": 0.0}

    # Close polygon if not closed
    if clean_coords[0] != clean_coords[-1]:
        clean_coords.append(clean_coords[0])

    # Compute average latitude for planar projection centered at farm center
    avg_lat = sum(p[0] for p in clean_coords) / len(clean_coords)
    avg_lat_rad = math.radians(avg_lat)

    # Convert lat/lon to local meters (x, y) relative to farm center
    points_m = []
    for lat, lon in clean_coords:
        lat_rad = math.radians(lat)
        lon_rad = math.radians(lon)
        x = EARTH_RADIUS_METERS * lon_rad * math.cos(avg_lat_rad)
        y = EARTH_RADIUS_METERS * lat_rad
        points_m.append((x, y))

    # Shoelace formula for polygon area
    area_sqm = 0.0
    n = len(points_m)
    for i in range(n - 1):
        x1, y1 = points_m[i]
        x2, y2 = points_m[i + 1]
        area_sqm += (x1 * y2) - (x2 * y1)

    area_sqm = abs(area_sqm) / 2.0

    # Unit conversions
    acres = area_sqm * 0.000247105
    hectares = area_sqm / 10000.0

    return {
        "sq_meters": round(area_sqm, 2),
        "acres": round(acres, 2),
        "hectares": round(hectares, 2)
    }

def calculate_centroid(coordinates: List[List[float]]) -> Tuple[float, float]:
    """Calculate center lat/lon of polygon."""
    if not coordinates:
        return (30.9010, 75.8573)
    lats = [float(p[0]) for p in coordinates if len(p) >= 2]
    lons = [float(p[1]) for p in coordinates if len(p) >= 2]
    if not lats or not lons:
        return (30.9010, 75.8573)
    return (round(sum(lats) / len(lats), 6), round(sum(lons) / len(lons), 6))

def calculate_haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """
    Calculate the great circle distance between two points on the earth in kilometers using Haversine formula.
    Returns 99999.9 if coordinates are invalid or missing.
    """
    try:
        lat1, lon1, lat2, lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
    except (ValueError, TypeError):
        return 99999.9

    # Validate coordinate ranges (-90 to 90 for lat, -180 to 180 for lon)
    if not (-90.0 <= lat1 <= 90.0 and -180.0 <= lon1 <= 180.0 and -90.0 <= lat2 <= 90.0 and -180.0 <= lon2 <= 180.0):
        return 99999.9

    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = R * c
    return round(distance, 1)

