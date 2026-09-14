"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  fetchFarmMap,
  saveFarmBoundary,
  createField,
  updateField,
  deleteField,
  associateFieldDisease,
  analyzeCropImage,
  fetchWeather,
  fetchFarmDecisionEngine,
  analyzeFarmSatellite,
  FarmData,
  FieldData,
  WeatherData,
  FarmActionPlanResponse,
  SatelliteAnalysisResponse
} from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { useActiveFarm } from "@/context/ActiveFarmContext";
import FarmMapContainer from "@/components/FarmMap/FarmMapContainer";
import { AuthGuard } from "@/components/AuthGuard";

function FarmMapContent() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { activeFarm, farmsList, selectActiveFarm, createNewFarm, refreshActiveFarm, deleteFarmById } = useActiveFarm();

  const [farm, setFarm] = useState<FarmData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [decisionPlan, setDecisionPlan] = useState<FarmActionPlanResponse | null>(null);
  const [satelliteData, setSatelliteData] = useState<SatelliteAnalysisResponse | null>(null);
  const [analyzingSatellite, setAnalyzingSatellite] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([30.9010, 75.8573]);
  const [mapZoom, setMapZoom] = useState<number>(15);
  const [searchLocation, setSearchLocation] = useState<string>("");
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  // Field selection & details panel
  const [selectedField, setSelectedField] = useState<FieldData | null>(null);

  // Selected arbitrary map point (on click or search)
  const [selectedMapPoint, setSelectedMapPoint] = useState<[number, number] | null>(null);

  // Selected farm profile view mode
  const [showFarmProfileView, setShowFarmProfileView] = useState<boolean>(false);

  const handleSelectFarmProfile = () => {
    setSelectedField(null);
    setSelectedMapPoint(null);
    setShowFarmProfileView(true);
  };

  // Drawing mode states
  const [drawingMode, setDrawingMode] = useState<"none" | "draw_farm" | "draw_field">("none");
  const [draftPoints, setDraftPoints] = useState<[number, number][]>([]);

  // New Farm Modal
  const [showNewFarmModal, setShowNewFarmModal] = useState<boolean>(false);
  const [newFarmName, setNewFarmName] = useState<string>("");

  // New Field Modal / Form
  const [showFieldModal, setShowFieldModal] = useState<boolean>(false);
  const [fieldForm, setFieldForm] = useState({
    name: "Field 4",
    crop: "Wheat",
    crop_variety: "PBW 550",
    growth_stage: "Vegetative",
    irrigation_type: "Tube well",
    soil_type: "Alluvial",
    notes: ""
  });

  // Image Upload for Selected Field
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Load weather forecast & AI decision engine plan for a given map location
  const loadAreaDetails = async (lat: number, lon: number, locationName?: string, farmId?: number) => {
    try {
      const [wData, dPlan] = await Promise.all([
        fetchWeather(lat, lon, locationName, farmId).catch(() => null),
        fetchFarmDecisionEngine(false, farmId).catch(() => null)
      ]);
      if (wData) setWeather(wData);
      if (dPlan) setDecisionPlan(dPlan);
    } catch (e) {
      console.error("Failed to load map area details:", e);
    }
  };

  // Sync map center and farm data when activeFarm changes in context
  useEffect(() => {
    if (activeFarm) {
      loadActiveFarmData(activeFarm.farm_id);
    } else {
      loadFarmAndContext();
    }
  }, [activeFarm?.farm_id]);

  const loadActiveFarmData = async (farmId: number) => {
    try {
      setLoading(true);
      setError(null);
      const farmData = await fetchFarmMap(farmId);
      setFarm(farmData);

      const lat = farmData.center_lat || 30.9010;
      const lon = farmData.center_lon || 75.8573;
      setMapCenter([lat, lon]);

      if (farmData.fields && farmData.fields.length > 0) {
        const riskField = farmData.fields.find(
          (f) => f.health_status === "Disease Risk" || f.health_status === "High Disease Risk"
        );
        const sel = riskField || farmData.fields[0];
        setSelectedField(sel);
      } else {
        setSelectedField(null);
      }

      // Fetch weather and decision details for active farm center
      await loadAreaDetails(lat, lon, farmData.location_name, farmData.id);
    } catch (err: any) {
      console.error("Error loading active farm details:", err);
      setError("Failed to load active farm data.");
    } finally {
      setLoading(false);
    }
  };

  const loadFarmAndContext = async () => {
    try {
      setLoading(true);
      setError(null);

      const farmData = await fetchFarmMap();
      setFarm(farmData);

      const lat = farmData.center_lat || 30.9010;
      const lon = farmData.center_lon || 75.8573;
      setMapCenter([lat, lon]);

      if (farmData.fields && farmData.fields.length > 0) {
        const riskField = farmData.fields.find(
          (f) => f.health_status === "Disease Risk" || f.health_status === "High Disease Risk"
        );
        setSelectedField(riskField || farmData.fields[0]);
      }

      await loadAreaDetails(lat, lon, farmData.location_name, farmData.id);
    } catch (err: any) {
      console.error("Failed to load farm map data:", err);
      setError("Failed to load farm map data.");
    } finally {
      setLoading(false);
    }
  };

  // Select Field handler with location details update
  const handleSelectField = (field: FieldData) => {
    setSelectedField(field);
    setSelectedMapPoint(null);
    setShowFarmProfileView(false);
    if (field.boundary_coordinates && field.boundary_coordinates.length > 0) {
      const sum = field.boundary_coordinates.reduce(
        (acc, curr) => [acc[0] + curr[0], acc[1] + curr[1]],
        [0, 0]
      );
      const cLat = sum[0] / field.boundary_coordinates.length;
      const cLon = sum[1] / field.boundary_coordinates.length;
      loadAreaDetails(cLat, cLon, farm?.location_name, farm?.id);
    }
  };

  // Map Point Click handler for arbitrary locations
  const handleSelectMapPoint = async (point: [number, number]) => {
    setSelectedMapPoint(point);
    setSelectedField(null);
    setShowFarmProfileView(false);
    const [lat, lon] = point;
    setLocationStatus(`Fetching microclimate weather details for selected point [${lat.toFixed(4)}, ${lon.toFixed(4)}]...`);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      const locName = data?.display_name ? data.display_name.split(",")[0] : `Map Location (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
      setLocationStatus(`Selected Location: ${locName}`);
      await loadAreaDetails(lat, lon, locName, farm?.id);
    } catch {
      setLocationStatus(`Selected Location: [${lat.toFixed(4)}, ${lon.toFixed(4)}]`);
      await loadAreaDetails(lat, lon, undefined, farm?.id);
    }
  };

  // Location handling (Manual & Device GPS)
  const handleUseDeviceLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser.");
      return;
    }
    setLocationStatus("Requesting location permission...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setMapCenter([lat, lon]);
        setMapZoom(16);
        setSelectedMapPoint([lat, lon]);
        setSelectedField(null);
        setLocationStatus("Device location acquired! Fetching weather & details...");
        loadAreaDetails(lat, lon, undefined, farm?.id);
        setTimeout(() => setLocationStatus(null), 4000);
      },
      (err) => {
        console.warn("Location permission error:", err);
        setLocationStatus("Location permission denied or unavailable. You can search or pan manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Satellite NDVI Analysis Handler
  const handleAnalyzeSatellite = async () => {
    try {
      setAnalyzingSatellite(true);
      setError(null);

      // Determine polygon coordinates [lon, lat]
      let geoCoords: [number, number][] = [];

      if (farm?.boundary_coordinates && farm.boundary_coordinates.length >= 3) {
        // Convert from Leaflet [lat, lon] to GeoJSON [lon, lat]
        geoCoords = farm.boundary_coordinates.map(([lat, lon]) => [lon, lat]);
        // Ensure ring is closed
        const first = geoCoords[0];
        const last = geoCoords[geoCoords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          geoCoords.push([first[0], first[1]]);
        }
      } else {
        // Construct bounding polygon around mapCenter [lat, lon]
        const [cLat, cLon] = mapCenter;
        const offset = 0.005;
        geoCoords = [
          [cLon - offset, cLat - offset],
          [cLon + offset, cLat - offset],
          [cLon + offset, cLat + offset],
          [cLon - offset, cLat + offset],
          [cLon - offset, cLat - offset]
        ];
      }

      const response = await analyzeFarmSatellite({
        farm: {
          type: "Polygon",
          coordinates: [geoCoords]
        }
      });

      setSatelliteData(response);
    } catch (err: any) {
      console.error("Satellite analysis failed:", err);
      setError(err.message || "Failed to analyze farm satellite data.");
    } finally {
      setAnalyzingSatellite(false);
    }
  };

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocation.trim()) return;
    setLocationStatus(`Searching coordinates for "${searchLocation}"...`);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const displayName = data[0].display_name;
        const nameStr = displayName.split(",")[0] || searchLocation;

        setMapCenter([lat, lon]);
        setMapZoom(15);
        setSelectedMapPoint([lat, lon]);
        setSelectedField(null);
        setLocationStatus(`Map centered on: ${displayName}`);

        await loadAreaDetails(lat, lon, nameStr, farm?.id);
      } else {
        setLocationStatus(`No exact coordinates found for "${searchLocation}". Try a broader city/region name.`);
      }
    } catch (err) {
      console.warn("Geocoding fetch failed, fallback center:", err);
      setLocationStatus(`Centered map near ${searchLocation}`);
      setTimeout(() => setLocationStatus(null), 3000);
    }
  };

  // Drawing Actions
  const handleStartDrawFarm = () => {
    setDrawingMode("draw_farm");
    setDraftPoints([]);
    setSelectedField(null);
  };

  const handleStartDrawField = () => {
    setDrawingMode("draw_field");
    setDraftPoints([]);
    setSelectedField(null);
  };

  const handleAddDraftPoint = (point: [number, number]) => {
    setDraftPoints((prev) => [...prev, point]);
  };

  const handleClearDraft = () => {
    setDraftPoints([]);
    setDrawingMode("none");
  };

  const handleSaveFarmBoundary = async () => {
    if (draftPoints.length < 3) {
      alert("Please click at least 3 points on the map to define a valid boundary polygon.");
      return;
    }
    try {
      setLoading(true);
      const closedPoints = [...draftPoints, draftPoints[0]];
      const updatedFarm = await saveFarmBoundary({
        boundary_coordinates: closedPoints,
        center_lat: mapCenter[0],
        center_lon: mapCenter[1],
        location_name: searchLocation || farm?.location_name || "Punjab, India"
      }, activeFarm?.farm_id);
      setFarm(updatedFarm);
      await refreshActiveFarm();
      setDraftPoints([]);
      setDrawingMode("none");
    } catch (err: any) {
      alert(err.message || "Failed to save farm boundary.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinishFieldDrawing = () => {
    if (draftPoints.length < 3) {
      alert("Please click at least 3 points on the map to define a valid field boundary.");
      return;
    }
    setShowFieldModal(true);
  };

  const handleCreateFieldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farm) return;
    try {
      setLoading(true);
      const closedPoints = draftPoints.length >= 3 ? [...draftPoints, draftPoints[0]] : [];
      const newField = await createField(farm.id, {
        name: fieldForm.name,
        boundary_coordinates: closedPoints,
        crop: fieldForm.crop,
        crop_variety: fieldForm.crop_variety,
        growth_stage: fieldForm.growth_stage,
        irrigation_type: fieldForm.irrigation_type,
        soil_type: fieldForm.soil_type,
        notes: fieldForm.notes
      });

      // Reload farm data
      await loadFarmAndContext();
      setSelectedField(newField);
      setShowFieldModal(false);
      setDraftPoints([]);
      setDrawingMode("none");
    } catch (err: any) {
      alert(err.message || "Failed to create field.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (fieldId: number) => {
    if (!confirm("Are you sure you want to delete this field from your farm map?")) return;
    try {
      setLoading(true);
      await deleteField(fieldId);
      setSelectedField(null);
      await loadFarmAndContext();
    } catch (err: any) {
      alert(err.message || "Failed to delete field.");
    } finally {
      setLoading(false);
    }
  };

  // Image Upload for Selected Field
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedField) return;

    try {
      setUploadingImage(true);
      setUploadError(null);
      setScanMessage(null);

      // Perform AI diagnosis and pass selectedField.id
      const diag = await analyzeCropImage(file, language === "hi" ? "Hindi" : "English", selectedField.id);

      // Refresh farm state
      await loadFarmAndContext();

      // Find updated field
      const updatedFarm = await fetchFarmMap();
      const updatedF = updatedFarm.fields.find((f) => f.id === selectedField.id);
      if (updatedF) setSelectedField(updatedF);

      const dName = (diag.disease || "").toLowerCase();
      const isProblem = !diag.is_uncertain && dName !== "healthy" && dName !== "no disease" && dName !== "healthy plant" && diag.severity !== "None";

      if (isProblem) {
        // Crop disease / problem detected -> redirect to full disease scan page
        if (typeof window !== "undefined") {
          sessionStorage.setItem("latest_diagnosis", JSON.stringify(diag));
        }
        router.push("/disease-detection");
      } else {
        // Crop is healthy -> Stay on farm map & show positive confirmation banner
        setScanMessage(`✅ Leaf Scan Complete: Crop in ${selectedField.name} is Healthy! No disease detected.`);
      }
    } catch (err: any) {
      console.error("Failed image analysis:", err);
      setUploadError(err.message || "Failed to analyze crop image.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // AI Advisor button handler
  const handleAskAgroGuardForField = (field: FieldData) => {
    const questionPrompt = `What specific farming actions, fertilization, or disease precautions should I take for ${field.name} (${field.crop}, ${field.area_acres} acres, Status: ${field.health_status}, Disease: ${field.disease_status})?`;
    router.push(`/chat?prompt=${encodeURIComponent(questionPrompt)}`);
  };

  if (loading && !farm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-300 text-lg font-medium">Loading Interactive Farm Map...</p>
      </div>
    );
  }

  const overallHealthColor =
    farm?.overall_health === "Healthy"
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
      : farm?.overall_health === "Moderate Risk" || farm?.overall_health === "Monitor"
      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
      : "bg-red-500/20 text-red-400 border-red-500/40";

  return (
    <div className="space-y-6">
      {/* No Farm Mapped Notice Banner */}
      {(!farm || farm.id === 0 || farmsList.length === 0) && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/40 text-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌾</span>
            <div>
              <h3 className="text-base font-bold text-white">No Farm Boundary Configured Yet</h3>
              <p className="text-xs text-slate-300 mt-0.5">Use the location search box below to locate your region, then click <strong>"Draw Farm Boundary"</strong> to map your plot.</p>
            </div>
          </div>
          <button
            onClick={handleStartDrawFarm}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shrink-0 transition-all"
          >
            + Draw Farm Boundary
          </button>
        </div>
      )}

      {/* Top Header Summary */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl">🗺️</span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                {farm?.name || "My Farm"}
              </h1>

              {/* Farm Selector Dropdown */}
              {farmsList && farmsList.length > 0 && (
                <select
                  value={farm?.id || activeFarm?.farm_id || ""}
                  onChange={(e) => {
                    const selectedId = Number(e.target.value);
                    if (selectedId) {
                      selectActiveFarm(selectedId);
                      loadActiveFarmData(selectedId);
                    }
                  }}
                  className="bg-slate-950 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-1.5 rounded-xl font-semibold focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  {farmsList.map((f) => (
                    <option key={f.id} value={f.id}>
                      🚜 {f.name} ({f.location_name})
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={handleSelectFarmProfile}
                className="text-xs px-3 py-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold transition"
              >
                🏡 Inspect Farm Profile
              </button>

              <button
                onClick={async () => {
                  if (farm && confirm(`Are you sure you want to delete "${farm.name}"? This action cannot be undone.`)) {
                    try {
                      await deleteFarmById(farm.id);
                    } catch (err: any) {
                      alert(err.message || "Failed to delete farm.");
                    }
                  }
                }}
                className="text-xs px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold transition flex items-center gap-1"
              >
                🗑️ Delete Farm
              </button>

              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                📍 {farm?.location_name || "Punjab, India"}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Interactive virtual farm boundaries, field plots, crop health status, weather risk & land economics.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl text-center">
              <div className="text-xs text-slate-400 font-medium">Total Land</div>
              <div className="text-lg font-bold text-white mt-0.5">
                {farm?.summary_stats?.total_area_acres || farm?.area_acres || 0} <span className="text-xs font-normal text-emerald-400">acres</span>
              </div>
              <div className="text-[10px] text-slate-500">
                ({farm?.summary_stats?.total_area_hectares || farm?.area_hectares || 0} ha)
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl text-center">
              <div className="text-xs text-slate-400 font-medium">Fields</div>
              <div className="text-lg font-bold text-cyan-400 mt-0.5">
                {farm?.summary_stats?.field_count || farm?.fields?.length || 0} <span className="text-xs font-normal text-slate-300">plots</span>
              </div>
              <div className="text-[10px] text-slate-500">Mapped</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl text-center">
              <div className="text-xs text-slate-400 font-medium">Crops</div>
              <div className="text-lg font-bold text-amber-400 mt-0.5">
                {farm?.summary_stats?.crops_count || 0} <span className="text-xs font-normal text-slate-300">types</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate px-1">
                {farm?.summary_stats?.crops?.join(", ") || "None"}
              </div>
            </div>

            <div className={`p-3 rounded-2xl text-center border flex flex-col justify-center ${overallHealthColor}`}>
              <div className="text-xs opacity-80 font-medium">Overall Health</div>
              <div className="text-sm font-extrabold mt-0.5">
                {farm?.overall_health === "Healthy" ? "🟢 Healthy" : farm?.overall_health === "Moderate Risk" ? "⚠️ Moderate Risk" : "🔴 High Disease Risk"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Control Bar & Search */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search & Device GPS */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <form onSubmit={handleSearchLocation} className="flex items-center gap-2 flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Search farm location (e.g. Ludhiana)..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-100 text-sm px-3.5 py-2 rounded-xl focus:outline-none focus:border-emerald-500 w-full sm:w-64"
            />
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 transition"
            >
              Search
            </button>
          </form>

          <button
            onClick={handleUseDeviceLocation}
            className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold px-3.5 py-2 rounded-xl transition"
          >
            <span>🎯 Use Device GPS</span>
          </button>
        </div>

        {/* Boundary & Field Drawing Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {drawingMode === "none" ? (
            <>
              <button
                onClick={handleAnalyzeSatellite}
                disabled={analyzingSatellite}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <span>🛰️ {analyzingSatellite ? "Fetching Satellite..." : "Satellite NDVI Analysis"}</span>
              </button>
              <button
                onClick={handleStartDrawFarm}
                className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
              >
                <span>✏️ Draw Farm Boundary</span>
              </button>
              <button
                onClick={handleStartDrawField}
                className="bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
              >
                <span>➕ Add Field Plot</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {drawingMode === "draw_farm" && (
                <button
                  onClick={handleSaveFarmBoundary}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg transition"
                >
                  💾 Save Farm Boundary ({draftPoints.length} pts)
                </button>
              )}
              {drawingMode === "draw_field" && (
                <button
                  onClick={handleFinishFieldDrawing}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg transition"
                >
                  📋 Next: Set Field Info ({draftPoints.length} pts)
                </button>
              )}
              <button
                onClick={handleClearDraft}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3.5 py-2 rounded-xl border border-slate-700 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {locationStatus && (
        <div className="bg-slate-900 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-2 rounded-xl">
          ℹ️ {locationStatus}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-2xl">
          ⚠️ {error}
        </div>
      )}

      {/* Main Map + Field Details Layout (Grid on Desktop, Mobile-first Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Canvas */}
        <div className="lg:col-span-7 xl:col-span-8">
          <FarmMapContainer
            center={mapCenter}
            zoom={mapZoom}
            farmBoundary={farm?.boundary_coordinates as [number, number][] || []}
            fields={farm?.fields || []}
            selectedFieldId={selectedField?.id || null}
            onSelectField={handleSelectField}
            onSelectFarm={handleSelectFarmProfile}
            selectedMapPoint={selectedMapPoint}
            onSelectMapPoint={handleSelectMapPoint}
            drawingMode={drawingMode}
            draftPoints={draftPoints}
            onAddDraftPoint={handleAddDraftPoint}
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 mt-2">
            <span>💡 Tap any field polygon, outer farm boundary, or map location to fetch microclimate weather & farm profile details.</span>
            <span>Colors: 🟢 Healthy | 🟡 Monitor | 🟠 Disease Risk | 🔴 High Risk</span>
          </div>
        </div>

        {/* Field / Farm Details Panel (Side Panel on Desktop / Sheet view on Mobile) */}
        <div className="lg:col-span-5 xl:col-span-4">
          {selectedField ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌾</span>
                    <h3 className="text-xl font-bold text-white">{selectedField.name}</h3>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    📐 {selectedField.area_acres} acres ({selectedField.area_hectares} ha)
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${
                      selectedField.health_status === "Healthy"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : selectedField.health_status === "Monitor"
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}
                  >
                    {selectedField.health_status}
                  </span>
                </div>
              </div>

              {/* Crop & Field Attributes */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Crop & Variety</span>
                  <span className="font-semibold text-slate-200">{selectedField.crop} ({selectedField.crop_variety || "N/A"})</span>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Growth Stage</span>
                  <span className="font-semibold text-slate-200">{selectedField.growth_stage}</span>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Irrigation</span>
                  <span className="font-semibold text-slate-200">{selectedField.irrigation_type}</span>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Soil Type</span>
                  <span className="font-semibold text-slate-200">{selectedField.soil_type}</span>
                </div>
              </div>

              {/* Disease Diagnosis Status */}
              <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>🔬 Disease Diagnosis</span>
                  <span className="text-[10px] text-slate-500">Based on observations</span>
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{selectedField.health_status === "Healthy" ? "✅ No Active Infection" : `⚠️ ${selectedField.disease_status}`}</span>
                </div>
                {selectedField.latest_disease_observation && (
                  <div className="text-xs text-slate-400 mt-1 bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div><strong className="text-slate-300">Confidence:</strong> {selectedField.latest_disease_observation.confidence} | <strong className="text-slate-300">Severity:</strong> {selectedField.latest_disease_observation.severity}</div>
                    {selectedField.latest_disease_observation.summary && (
                      <div className="mt-1 italic text-slate-400">"{selectedField.latest_disease_observation.summary}"</div>
                    )}
                  </div>
                )}
              </div>

              {/* Microclimate Weather Risk */}
              {weather && (
                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs space-y-1">
                  <div className="font-semibold text-slate-300 flex items-center justify-between">
                    <span>🌧️ Field Weather Outlook</span>
                    <span className="text-emerald-400 font-bold">{weather.temperature}°C</span>
                  </div>
                  <div className="text-slate-400">
                    Condition: {weather.condition} | Humidity: {weather.humidity}% | Rain Prob: {weather.rain_probability}%
                  </div>
                  {weather.agricultural_warnings && weather.agricultural_warnings.length > 0 && (
                    <div className="text-amber-400 font-medium text-[11px] mt-1 border-t border-slate-800/80 pt-1">
                      ⚠️ {weather.agricultural_warnings[0]}
                    </div>
                  )}
                </div>
              )}

              {/* Economics Summary per Field */}
              {selectedField.economics_summary && (
                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs space-y-1.5">
                  <div className="font-semibold text-slate-300 flex items-center justify-between">
                    <span>💰 Field Economics</span>
                    <span className="text-[10px] text-slate-500 font-normal">Calculated for {selectedField.area_acres} acres</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>Input Cost: <strong className="text-white">₹{selectedField.economics_summary.total_input_cost.toLocaleString()}</strong></div>
                    <div>Est. Production: <strong className="text-white">{selectedField.economics_summary.expected_production_qtl} Qtl</strong></div>
                    <div>Revenue: <strong className="text-emerald-400">₹{selectedField.economics_summary.gross_revenue.toLocaleString()}</strong></div>
                    <div>Est. Margin: <strong className="text-emerald-400">₹{selectedField.economics_summary.estimated_margin.toLocaleString()}</strong></div>
                  </div>
                </div>
              )}

              {/* Scan Feedback Banner */}
              {scanMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between">
                  <span>{scanMessage}</span>
                  <button onClick={() => setScanMessage(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
              )}

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-between">
                  <span>⚠️ {uploadError}</span>
                  <button onClick={() => setUploadError(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>📷 {uploadingImage ? "Analyzing Image..." : "Analyze New Image for Field"}</span>
                </button>

                <button
                  onClick={() => handleAskAgroGuardForField(selectedField)}
                  className="w-full bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <span>🤖 Ask AgroGuard About {selectedField.name}</span>
                </button>

                <div className="text-right">
                  <button
                    onClick={() => handleDeleteField(selectedField.id)}
                    className="text-[11px] text-red-400 hover:text-red-300 underline font-medium"
                  >
                    Delete Field Plot
                  </button>
                </div>
              </div>
            </div>
          ) : selectedMapPoint ? (
            <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📍</span>
                    <h3 className="text-lg font-bold text-white">Selected Map Location</h3>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Lat: {selectedMapPoint[0].toFixed(4)}, Lon: {selectedMapPoint[1].toFixed(4)}
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Live Area Data
                </span>
              </div>

              {weather && (
                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs space-y-2">
                  <div className="font-semibold text-slate-200 flex items-center justify-between">
                    <span>🌧️ Microclimate Weather</span>
                    <span className="text-emerald-400 font-bold">{weather.temperature}°C</span>
                  </div>
                  <div className="text-slate-400 grid grid-cols-2 gap-1 text-[11px]">
                    <div>Condition: <strong className="text-white">{weather.condition}</strong></div>
                    <div>Humidity: <strong className="text-white">{weather.humidity}%</strong></div>
                    <div>Rain Prob: <strong className="text-emerald-400">{weather.rain_probability}%</strong></div>
                    <div>Wind: <strong className="text-white">{weather.wind_speed} km/h</strong></div>
                  </div>
                  {weather.agricultural_warnings && weather.agricultural_warnings.length > 0 && (
                    <div className="text-amber-400 font-medium text-[11px] pt-1 border-t border-slate-800/80">
                      ⚠️ {weather.agricultural_warnings[0]}
                    </div>
                  )}
                </div>
              )}

              {weather?.agroguard_intelligence && weather.agroguard_intelligence.length > 0 && (
                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs space-y-2">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span>⚡ Location Advisory</span>
                  </div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    <strong>{weather.agroguard_intelligence[0].title}:</strong> {weather.agroguard_intelligence[0].recommendations[0]}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleStartDrawField}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>➕ Draw Field Plot at Location</span>
                </button>

                <button
                  onClick={() => {
                    const prompt = `Tell me about farming conditions, optimal crops, soil, and weather risks near coordinates ${selectedMapPoint[0].toFixed(4)}, ${selectedMapPoint[1].toFixed(4)} (${weather?.location || "Selected Map Location"}).`;
                    router.push(`/chat?prompt=${encodeURIComponent(prompt)}`);
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <span>🤖 Ask AgroGuard About Area</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚜</span>
                    <h3 className="text-xl font-bold text-white">{farm?.name || activeFarm?.name || "Selected Farm Profile"}</h3>
                  </div>
                  <div className="text-xs text-emerald-400 mt-0.5 font-medium">
                    📍 {farm?.location_name || activeFarm?.location_name || "Punjab, India"}
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Active Farm Profile
                </span>
              </div>

              {/* Geographic Profile */}
              <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs space-y-1.5">
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  📍 Location Details
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>Village: <strong className="text-white">{farm?.village_locality || activeFarm?.village_locality || "Gill"}</strong></div>
                  <div>District: <strong className="text-white">{farm?.district || activeFarm?.district || "Ludhiana"}</strong></div>
                  <div>State: <strong className="text-white">{farm?.state || activeFarm?.state || "Punjab"}</strong></div>
                  <div>Coordinates: <strong className="text-emerald-400 font-mono">{mapCenter[0].toFixed(3)}, {mapCenter[1].toFixed(3)}</strong></div>
                </div>
              </div>

              {/* Agronomic & Soil Profile */}
              <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs space-y-2">
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  🌾 Agronomic & Land Summary
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>Total Land: <strong className="text-emerald-400">{farm?.summary_stats?.total_area_acres || farm?.area_acres || activeFarm?.area_acres || 0} acres</strong></div>
                  <div>Field Plots: <strong className="text-cyan-400">{farm?.summary_stats?.field_count || farm?.fields?.length || 0} mapped</strong></div>
                  <div>Crops Grown: <strong className="text-amber-300">{farm?.summary_stats?.crops?.join(", ") || activeFarm?.crops?.join(", ") || "Wheat, Rice"}</strong></div>
                  <div>Overall Health: <strong className="text-emerald-400">{farm?.overall_health || "Healthy"}</strong></div>
                </div>
              </div>

              {/* Associated Farmer Profile Context */}
              {activeFarm?.farmer_profile && (
                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs space-y-1.5">
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                    👤 Associated Farmer Context
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>Farmer Name: <strong className="text-white">{activeFarm.farmer_profile.farmer_name || "Gurpreet Singh"}</strong></div>
                    <div>Language: <strong className="text-white">{activeFarm.farmer_profile.preferred_language || "English"}</strong></div>
                    <div>Experience: <strong className="text-white">{activeFarm.farmer_profile.farming_experience_years || 10} years</strong></div>
                    <div>Season Budget: <strong className="text-amber-400">₹{(activeFarm.farmer_profile.farming_budget || 150000).toLocaleString()}</strong></div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => router.push("/profile")}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>⚙️ Edit Farmer Profile & Settings</span>
                </button>

                <button
                  onClick={handleStartDrawField}
                  className="w-full bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <span>➕ Add Field Plot to Farm</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Dashboard: Farm Summary & Today's Farm Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Farm Breakdown Summary */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📊</span> Farm Health & Area Distribution
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>🟢 Healthy Area</span>
                <span className="font-bold text-emerald-400">{farm?.summary_stats?.healthy_acres || 0} acres</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${
                      ((farm?.summary_stats?.healthy_acres || 0) / (farm?.summary_stats?.total_area_acres || 1)) * 100
                    }%`
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>🟡 Monitor Area</span>
                <span className="font-bold text-amber-400">{farm?.summary_stats?.monitor_acres || 0} acres</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{
                    width: `${
                      ((farm?.summary_stats?.monitor_acres || 0) / (farm?.summary_stats?.total_area_acres || 1)) * 100
                    }%`
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>🔴 Disease Risk Area</span>
                <span className="font-bold text-red-400">{farm?.summary_stats?.disease_risk_acres || 0} acres</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-red-500 h-full rounded-full"
                  style={{
                    width: `${
                      ((farm?.summary_stats?.disease_risk_acres || 0) / (farm?.summary_stats?.total_area_acres || 1)) * 100
                    }%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Farm Actions from AI Decision Engine */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>⚡</span> Today's Field Actions
          </h3>

          <div className="space-y-2.5">
            {decisionPlan?.today_actions && decisionPlan.today_actions.length > 0 ? (
              decisionPlan.today_actions.slice(0, 3).map((act, idx) => (
                <div key={idx} className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex items-start gap-3">
                  <span className="text-base mt-0.5">
                    {act.priority === "high" ? "🔴" : act.priority === "medium" ? "🟡" : "🟢"}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{act.action}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{act.reason}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-2">
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex items-start gap-3">
                  <span className="text-base">🔴</span>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Inspect Field 2 for Yellow Rust symptoms</div>
                    <div className="text-[11px] text-slate-400">High humidity and spore forecast reported.</div>
                  </div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex items-start gap-3">
                  <span className="text-base">🟡</span>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Review tube well irrigation schedule for Field 1</div>
                    <div className="text-[11px] text-slate-400">Optimal soil moisture needed for wheat tillering stage.</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Satellite Farm Monitoring Intelligence Card */}
      {satelliteData && (
        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛰️</span>
                <h3 className="text-xl font-extrabold text-white">Satellite Farm Health & NDVI Report</h3>
                {satelliteData.is_demo && (
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Demo Data
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Sentinel-2 satellite observation • Captured on {satelliteData.observation_date} • Cloud coverage: {satelliteData.cloud_coverage}%
              </p>
            </div>

            <button
              onClick={() => setSatelliteData(null)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Close Report ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visualizer Heatmap & True Color */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                📷 Satellite Spectral Layers
              </span>
              <div className="grid grid-cols-2 gap-2">
                {satelliteData.true_color_url && (
                  <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 text-center">
                    <img
                      src={satelliteData.true_color_url}
                      alt="Sentinel True Color"
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <span className="text-[10px] font-semibold text-slate-400 mt-1 block">True Color (RGB)</span>
                  </div>
                )}
                {satelliteData.ndvi_map_url && (
                  <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 text-center">
                    <img
                      src={satelliteData.ndvi_map_url}
                      alt="Sentinel NDVI Heatmap"
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <span className="text-[10px] font-semibold text-emerald-400 mt-1 block">NDVI Heatmap</span>
                  </div>
                )}
              </div>
            </div>

            {/* NDVI Metrics & Risk */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                🌿 Vegetation Index Analytics
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">Mean NDVI</span>
                  <span className="text-lg font-bold text-emerald-400">{satelliteData.ndvi.mean}</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">Min NDVI</span>
                  <span className="text-lg font-bold text-amber-400">{satelliteData.ndvi.min}</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">Max NDVI</span>
                  <span className="text-lg font-bold text-cyan-400">{satelliteData.ndvi.max}</span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Vegetation Health Status</span>
                  <span className="text-sm font-bold text-emerald-300">{satelliteData.vegetation_health}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Farm Stress Risk</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    satelliteData.risk_level === "Low"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : satelliteData.risk_level === "Moderate"
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}>
                    {satelliteData.risk_level} Risk
                  </span>
                </div>
              </div>
            </div>

            {/* AI AgroGuard Interpretation */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                ⚡ AgroGuard Intelligence Summary
              </span>
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed h-[calc(100%-24px)] flex flex-col justify-between">
                <p>"{satelliteData.message}"</p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-semibold">
                  💡 Recommendation: Photosynthetic activity is healthy. Maintain regular nitrogen fertilizer and irrigation cycle.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Creating New Field Plot */}
      {showFieldModal && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white">Create New Field Plot</h3>
            <p className="text-xs text-slate-400">
              Polygon boundary set with {draftPoints.length} points. Enter field details below:
            </p>

            <form onSubmit={handleCreateFieldSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Field Name</label>
                <input
                  type="text"
                  required
                  value={fieldForm.name}
                  onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Crop</label>
                  <select
                    value={fieldForm.crop}
                    onChange={(e) => setFieldForm({ ...fieldForm, crop: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl"
                  >
                    <option value="Wheat">Wheat</option>
                    <option value="Rice">Rice</option>
                    <option value="Maize">Maize</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Sugarcane">Sugarcane</option>
                    <option value="Mustard">Mustard</option>
                    <option value="Potato">Potato</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Variety</label>
                  <input
                    type="text"
                    value={fieldForm.crop_variety}
                    onChange={(e) => setFieldForm({ ...fieldForm, crop_variety: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Growth Stage</label>
                  <select
                    value={fieldForm.growth_stage}
                    onChange={(e) => setFieldForm({ ...fieldForm, growth_stage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl"
                  >
                    <option value="Sowing">Sowing</option>
                    <option value="Vegetative">Vegetative</option>
                    <option value="Tillering">Tillering</option>
                    <option value="Flowering">Flowering</option>
                    <option value="Maturation">Maturation</option>
                    <option value="Harvesting">Harvesting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Irrigation Type</label>
                  <select
                    value={fieldForm.irrigation_type}
                    onChange={(e) => setFieldForm({ ...fieldForm, irrigation_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl"
                  >
                    <option value="Tube well">Tube well</option>
                    <option value="Canal">Canal</option>
                    <option value="Drip">Drip</option>
                    <option value="Sprinkler">Sprinkler</option>
                    <option value="Rainfed">Rainfed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowFieldModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2 rounded-xl shadow-lg"
                >
                  Save Field Plot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FarmMapPage() {
  return (
    <AuthGuard>
      <FarmMapContent />
    </AuthGuard>
  );
}
