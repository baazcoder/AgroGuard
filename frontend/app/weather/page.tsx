"use client";

import React, { useState, useEffect } from "react";
import { 
  CloudSun, MapPin, Navigation, Droplets, Wind, Sun, AlertTriangle, 
  Search, Thermometer, Calendar, ShieldAlert, Sparkles, RefreshCw 
} from "lucide-react";
import { fetchWeather, WeatherData } from "@/lib/api";

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualCity, setManualCity] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);

  const loadWeather = async (lat?: number, lon?: number, locationStr?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeather(lat, lon, locationStr);
      setWeather(data);
    } catch (err: any) {
      setError("Unable to load weather forecast.");
    } finally {
      setLoading(false);
      setGettingLocation(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, []);

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
        setError("Location permission denied. Please select region manually.");
      }
    );
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCity.trim()) return;
    loadWeather(undefined, undefined, manualCity);
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <CloudSun className="w-4 h-4" />
          <span>Agricultural Microclimate Engine</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Farm Weather & <span className="bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">Spore Warnings</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Get hyper-local temperature, dew point, spray window recommendations, and fungal disease risk warnings tailored for farming.
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
          <span>Use My Current Location</span>
        </button>

        {/* Manual City Search */}
        <form onSubmit={handleManualSearch} className="w-full sm:w-auto flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              placeholder="Enter City / District..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
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
          <p className="text-sm text-slate-400">Fetching farm microclimate data...</p>
        </div>
      ) : weather ? (
        <div className="space-y-8">
          
          {/* CURRENT WEATHER CARD */}
          <div className="glass-panel p-8 sm:p-10 rounded-3xl space-y-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Selected Region</span>
                <h2 className="text-3xl font-extrabold text-white flex items-center gap-2 mt-1">
                  <MapPin className="w-6 h-6 text-emerald-400" />
                  <span>{weather.location}</span>
                </h2>
              </div>
              <div className="text-right">
                <span className="text-4xl font-extrabold text-white">{weather.temperature}°C</span>
                <span className="block text-xs text-slate-400">{weather.condition}</span>
              </div>
            </div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-blue-400" /> Humidity
                </span>
                <p className="text-xl font-bold text-white">{weather.humidity}%</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-emerald-400" /> Wind Speed
                </span>
                <p className="text-xl font-bold text-white">{weather.wind_speed} km/h</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <CloudSun className="w-4 h-4 text-teal-400" /> Rain Chance
                </span>
                <p className="text-xl font-bold text-emerald-400">{weather.rain_probability}%</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-400" /> UV Index
                </span>
                <p className="text-xl font-bold text-white">{weather.uv_index} / 10</p>
              </div>
            </div>

            {/* AGRICULTURAL WARNINGS */}
            {weather.agricultural_warnings && weather.agricultural_warnings.length > 0 && (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Agricultural Risk & Spray Advisory</span>
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

          {/* 5-DAY FORECAST */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>5-Day Agricultural Forecast</span>
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

        </div>
      ) : null}

    </div>
  );
}
