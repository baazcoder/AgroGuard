"use client";

import React, { useState, useEffect } from "react";
import { 
  CloudSun, MapPin, Navigation, Droplets, Wind, Sun, AlertTriangle, 
  Search, Calendar, ShieldAlert, Sparkles, RefreshCw, CheckCircle2, XCircle, Info
} from "lucide-react";
import { fetchWeather, WeatherData, WeatherAdvisory } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { useActiveFarm } from "@/context/ActiveFarmContext";

export default function WeatherPage() {
  const { t } = useLanguage();
  const { activeFarm } = useActiveFarm();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [manualCity, setManualCity] = useState<string>("");
  const [gettingLocation, setGettingLocation] = useState<boolean>(false);

  const loadWeather = async (lat?: number, lon?: number, locationStr?: string, farmId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const targetFarmId = farmId !== undefined ? farmId : activeFarm?.farm_id;
      const targetLat = lat !== undefined ? lat : activeFarm?.latitude;
      const targetLon = lon !== undefined ? lon : activeFarm?.longitude;

      const data = await fetchWeather(targetLat, targetLon, locationStr, targetFarmId);
      setWeather(data);
    } catch (err: any) {
      setError("Unable to load weather forecast for the selected farm.");
    } finally {
      setLoading(false);
      setGettingLocation(false);
    }
  };

  // Re-fetch weather whenever active farm changes in context
  useEffect(() => {
    // Invalidate stale weather data immediately on farm change
    setWeather(null);
    if (activeFarm) {
      loadWeather(activeFarm.latitude, activeFarm.longitude, activeFarm.location_name, activeFarm.farm_id);
    } else {
      loadWeather();
    }
  }, [activeFarm?.farm_id]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        loadWeather(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setGettingLocation(false);
        setError("Location permission denied. Showing active farm location weather.");
      }
    );
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCity.trim()) return;
    loadWeather(undefined, undefined, manualCity);
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = status.toUpperCase();
    if (s === "SAFE" || s === "LOW_RISK") {
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
    if (s === "CAUTION") {
      return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    }
    if (s === "UNSAFE" || s === "HIGH_RISK") {
      return "bg-rose-500/20 text-rose-300 border-rose-500/40";
    }
    if (s === "RECOMMENDED" || s === "DELAY") {
      return "bg-purple-500/20 text-purple-300 border-purple-500/40";
    }
    return "bg-slate-700/40 text-slate-300 border-slate-600/40";
  };

  const getStatusIcon = (status: string) => {
    const s = status.toUpperCase();
    if (s === "SAFE" || s === "LOW_RISK") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (s === "CAUTION") return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    if (s === "UNSAFE" || s === "HIGH_RISK") return <XCircle className="w-4 h-4 text-rose-400" />;
    return <Info className="w-4 h-4 text-purple-400" />;
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <CloudSun className="w-4 h-4" />
          <span>{t.weather.badge}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {t.weather.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          {t.weather.subtitle}
        </p>
      </div>

      {/* LOCATION SELECTOR BAR */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Use Geolocation CTA */}
        <button
          onClick={handleUseLocation}
          disabled={gettingLocation || loading}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2.5 transition-all"
        >
          {gettingLocation ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          <span>{t.weather.useLocation}</span>
        </button>

        {/* Manual City Search */}
        <form onSubmit={handleManualSearch} className="w-full sm:w-auto flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              placeholder={t.weather.searchCity}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>{t.common.search}</span>
          </button>
        </form>

      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* WEATHER CONTENT */}
      {loading ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">{t.common.loading}</p>
        </div>
      ) : weather ? (
        <div className="space-y-8">

          {/* WEATHER SERVICE UNAVAILABLE BANNER */}
          {weather.is_unavailable && (
            <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-base text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <span>{t.weather.weatherUnavailable}</span>
              </div>
              <p className="text-xs text-rose-300/80">
                {weather.message || "Live weather service is temporarily offline. AgroGuard does not show fabricated live weather data."}
              </p>
            </div>
          )}
          
          {/* CURRENT WEATHER CARD */}
          {!weather.is_unavailable && (
            <div className="glass-panel p-8 sm:p-10 rounded-3xl space-y-6 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Active Farm Microclimate</span>
                    {activeFarm && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        🚜 {activeFarm.name}
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl font-extrabold text-white flex items-center gap-2 mt-1">
                    <MapPin className="w-6 h-6 text-emerald-400" />
                    <span>{weather.location}</span>
                  </h2>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>📡 {weather.weather_source || "Open-Meteo Weather Station"}</span>
                    {weather.last_updated && <span>• Updated: {weather.last_updated}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-extrabold text-white">{weather.temperature}°C</span>
                  <span className="block text-xs font-medium text-emerald-300">
                    Feels like {weather.feels_like !== undefined ? weather.feels_like : weather.temperature}°C
                  </span>
                  <span className="block text-xs text-slate-400 mt-0.5">{weather.condition}</span>
                </div>
              </div>

              {/* METRICS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-blue-400" /> {t.weather.humidity}
                  </span>
                  <p className="text-xl font-bold text-white">{weather.humidity}%</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-emerald-400" /> {t.weather.windSpeed}
                  </span>
                  <p className="text-xl font-bold text-white">{weather.wind_speed} km/h</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <CloudSun className="w-4 h-4 text-teal-400" /> {t.weather.rainProbability}
                  </span>
                  <p className="text-xl font-bold text-emerald-400">{weather.rain_probability}%</p>
                  <div className="text-[10px] text-slate-500">{weather.precipitation_mm || 0} mm precip</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-400" /> {t.weather.uvIndex}
                  </span>
                  <p className="text-xl font-bold text-white">{weather.uv_index} / 10</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    🌧️ Rain Vol.
                  </span>
                  <p className="text-xl font-bold text-cyan-300">{weather.precipitation_mm || 0} mm</p>
                </div>
              </div>

              {/* AGRICULTURAL WARNINGS (LEGACY) */}
              {weather.agricultural_warnings && weather.agricultural_warnings.length > 0 && (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{t.weather.warnings}</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {weather.agricultural_warnings.map((warn, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span>{warn}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* AGROGUARD SAYS... WEATHER INTELLIGENCE DECISION PANEL */}
          {weather.agroguard_intelligence && weather.agroguard_intelligence.length > 0 && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-emerald-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-emerald-950/20">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t.weather.agroguardSays}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {t.weather.agroguardIntelligenceTitle}
                  </h2>
                </div>

                {/* FARM MEMORY SUMMARY CONTEXT BADGE */}
                {weather.farm_context_summary && (
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-3">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Active Farm Memory</span>
                      <span className="font-semibold text-emerald-400">
                        {weather.farm_context_summary.crop} • Stage: {weather.farm_context_summary.growth_stage}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ADVISORY DECISION CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {weather.agroguard_intelligence.map((adv: WeatherAdvisory, idx: number) => (
                  <div 
                    key={idx} 
                    className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400">
                          {adv.category.replace("_", " ")}
                        </span>
                        <div className={`px-2.5 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${getStatusBadgeStyle(adv.status)}`}>
                          {getStatusIcon(adv.status)}
                          <span>{adv.status}</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-white leading-snug">
                        {adv.title}
                      </h3>

                      <ul className="space-y-2 text-xs text-slate-300">
                        {adv.recommendations.map((rec, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* REASON / DETERMINISTIC LOGIC EXPLANATION */}
                    {adv.reasons && adv.reasons.length > 0 && (
                      <div className="pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 space-y-1">
                        <span className="font-semibold text-slate-500 block">Why this decision:</span>
                        {adv.reasons.map((reason, rIdx) => (
                          <p key={rIdx} className="italic text-slate-400">
                            • {reason}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5-DAY FORECAST */}
          {!weather.is_unavailable && weather.forecast && weather.forecast.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span>{t.weather.forecast}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                {weather.forecast.map((day, idx) => (
                  <div key={idx} className="glass-card p-5 rounded-2xl text-center space-y-3">
                    <span className="text-xs font-bold text-emerald-400 uppercase block">{day.day}</span>
                    <CloudSun className="w-8 h-8 text-amber-400 mx-auto" />
                    <div>
                      <span className="text-lg font-bold text-white block">{day.temp_high}°C</span>
                      <span className="text-xs text-slate-400">Night: {day.temp_low}°C</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-1">
                      <Droplets className="w-3 h-3 text-blue-400" />
                      <span>{day.rain_probability}% Rain</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : null}

    </div>
  );
}
