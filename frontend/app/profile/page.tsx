"use client";

import React, { useState, useEffect } from "react";
import { 
  User as UserIcon, MapPin, Layers, Droplets, Sprout, IndianRupee, 
  CheckCircle2, Sparkles, AlertCircle, Save, Globe, Cpu, RefreshCw, LogOut, Shield, Plus, Trash2 
} from "lucide-react";
import { fetchFarmerProfile, saveFarmerProfile, FarmerProfileData } from "@/lib/api";
import { useLanguage, Language } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useActiveFarm } from "@/context/ActiveFarmContext";
import { AuthGuard } from "@/components/AuthGuard";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SOIL_TYPES = [
  "Alluvial Soil",
  "Black Soil (Regur)",
  "Red & Yellow Soil",
  "Loamy Soil",
  "Sandy Soil",
  "Clay Soil",
  "Silt Soil",
  "Peaty & Marshy Soil"
];

const IRRIGATION_TYPES = [
  "Tube well",
  "Canal Irrigation",
  "Drip Irrigation",
  "Sprinkler System",
  "Rainfed (Monsoon)",
  "River / Pond Pump"
];

const GROWTH_STAGES = [
  "Sowing / Germination",
  "Vegetative Stage",
  "Flowering Stage",
  "Fruiting / Grain Filling",
  "Harvesting Stage",
  "Field Fallow"
];

const SUPPORTED_LANGUAGES: Array<{ code: Language; label: string; nameInBackend: string }> = [
  { code: "en", label: "English", nameInBackend: "English" },
  { code: "hi", label: "हिंदी (Hindi)", nameInBackend: "Hindi" },
  { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)", nameInBackend: "Punjabi" },
  { code: "bho", label: "भोजपुरी (Bhojpuri)", nameInBackend: "Bhojpuri" },
  { code: "hr", label: "हरियाणवी (Haryanvi)", nameInBackend: "Haryanvi" },
];

function ProfileContent() {
  const router = useRouter();
  const { t, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const { activeFarm, farmsList, selectActiveFarm, deleteFarmById } = useActiveFarm();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [form, setForm] = useState<FarmerProfileData>({
    farmer_name: "",
    preferred_language: "English",
    state: "",
    district: "",
    village_location: "",
    land_area: 0.0,
    land_unit: "acre",
    soil_type: "Alluvial Soil",
    irrigation_available: true,
    irrigation_type: "Tube well",
    current_crop: "",
    crop_variety: "",
    crop_growth_stage: "Vegetative Stage",
    sowing_date: "",
    farming_budget: 0,
    farming_experience_years: 0,
    previous_crop: "",
    farm_notes: ""
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const data = await fetchFarmerProfile();
        if (data) {
          setForm({
            farmer_name: data.farmer_name || user?.full_name || "",
            preferred_language: data.preferred_language || "English",
            state: data.state || "",
            district: data.district || "",
            village_location: data.village_location || "",
            land_area: Number(data.land_area) || 0,
            land_unit: data.land_unit || "acre",
            soil_type: data.soil_type || "Alluvial Soil",
            irrigation_available: data.irrigation_available ?? true,
            irrigation_type: data.irrigation_type || "Tube well",
            current_crop: data.current_crop || "",
            crop_variety: data.crop_variety || "",
            crop_growth_stage: data.crop_growth_stage || "Vegetative Stage",
            sowing_date: data.sowing_date || "",
            farming_budget: Number(data.farming_budget) || 0,
            farming_experience_years: Number(data.farming_experience_years) || 0,
            previous_crop: data.previous_crop || "",
            farm_notes: data.farm_notes || ""
          });
        }
      } catch (err) {
        console.error("Error loading farmer profile:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadProfile();
    }
  }, [user]);

  const handleChange = (field: keyof FarmerProfileData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((form.land_area || 0) < 0) {
      setErrorMessage("Land area cannot be negative.");
      return;
    }
    if ((form.farming_budget || 0) < 0) {
      setErrorMessage("Farming budget cannot be negative.");
      return;
    }

    const payload: FarmerProfileData = {
      ...form,
      land_area: Number(form.land_area) || 0,
      farming_budget: Number(form.farming_budget) || 0,
      farming_experience_years: Number(form.farming_experience_years) || 0,
    };

    try {
      setSaving(true);
      setErrorMessage(null);
      const updated = await saveFarmerProfile(payload);
      setForm(updated);
      setSuccessMessage(t.profile.savedSuccess || "Farmer profile saved successfully!");

      const matchingLang = SUPPORTED_LANGUAGES.find(
        l => l.nameInBackend.toLowerCase() === (updated.preferred_language || "").toLowerCase()
      );
      if (matchingLang) {
        setLanguage(matchingLang.code);
      }

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      setErrorMessage(err.message || "Failed to save farm profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleDeleteFarm = async (e: React.MouseEvent, farmId: number, farmName: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${farmName}"? This action cannot be undone.`)) {
      try {
        await deleteFarmById(farmId);
      } catch (err: any) {
        alert(err.message || "Failed to delete farm.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-emerald-400">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="text-sm font-medium">{t.common.loading || "Loading profile..."}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* HEADER SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-950 p-6 sm:p-10 border border-emerald-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide">
              <Sparkles className="w-4 h-4" />
              <span>Verified AgroGuard Account</span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {user?.full_name || "Farmer Profile"}
            </h1>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>{user?.email_or_phone}</span>
            </p>
          </div>
        </div>
      </section>

      {/* MULTI-FARM MANAGEMENT CARD */}
      <section className="bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <span>Your Managed Farms ({farmsList.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Select active farm for live weather, mandi prices, and crop advice</p>
          </div>

          <Link
            href="/farm-map"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Map New Farm</span>
          </Link>
        </div>

        {farmsList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {farmsList.map((farm) => {
              const isActive = activeFarm?.farm_id === farm.id;
              return (
                <div
                  key={farm.id}
                  onClick={() => selectActiveFarm(farm.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isActive
                      ? "bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-950/30"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-100 text-base">{farm.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{farm.location_name || farm.village_locality || "Local Farm"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">Click to select</span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDeleteFarm(e, farm.id, farm.name)}
                        title="Delete Farm"
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-300 pt-3 border-t border-slate-800/60">
                    <span>Land Area: <strong className="text-emerald-400">{farm.area_acres} Acres</strong></span>
                    <span>Fields: <strong className="text-emerald-400">{(farm.fields || []).length}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-300">No Managed Farms Yet</p>
            <p className="text-xs text-slate-400">Map your first farm boundary to enable automated weather alerts, field pathology scans, and mandi prices.</p>
            <Link
              href="/farm-map"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Map Your First Farm</span>
            </Link>
          </div>
        )}
      </section>

      {/* ALERT / CONFIRMATION BADGES */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-3 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-sm font-semibold flex items-center gap-3 shadow-lg animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* FARMER PROFILE FORM */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: PERSONAL & LANGUAGE */}
        <div className="bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <UserIcon className="w-5 h-5 text-emerald-400" />
            <span>Personal & Preference Details</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Farmer Display Name
              </label>
              <input
                type="text"
                value={form.farmer_name}
                onChange={(e) => handleChange("farmer_name", e.target.value)}
                placeholder="e.g. Gurpreet Singh / Ramesh Kumar"
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Preferred Language</span>
              </label>
              <select
                value={form.preferred_language}
                onChange={(e) => handleChange("preferred_language", e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-sm"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.nameInBackend}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: LOCATION */}
        <div className="bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <span>Default Location</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                State
              </label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value)}
                placeholder="e.g. Punjab / Haryana / UP"
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                District
              </label>
              <input
                type="text"
                value={form.district}
                onChange={(e) => handleChange("district", e.target.value)}
                placeholder="e.g. Ludhiana / Karnal"
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Village / Locality
              </label>
              <input
                type="text"
                value={form.village_location}
                onChange={(e) => handleChange("village_location", e.target.value)}
                placeholder="e.g. Gill Village"
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: LAND & SOIL */}
        <div className="bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>Total Land & Soil Profile</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Land Area
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.land_area === 0 ? "" : form.land_area}
                onChange={(e) => handleChange("land_area", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                placeholder="e.g. 5.0"
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Land Unit
              </label>
              <select
                value={form.land_unit}
                onChange={(e) => handleChange("land_unit", e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-sm"
              >
                <option value="acre">Acre / एकड़ / ਏਕੜ</option>
                <option value="hectare">Hectare / हेक्टेयर / ਹੈਕਟੇਅਰ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Soil Type
              </label>
              <select
                value={form.soil_type}
                onChange={(e) => handleChange("soil_type", e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-sm"
              >
                {SOIL_TYPES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 4: IRRIGATION */}
        <div className="bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Droplets className="w-5 h-5 text-blue-400" />
            <span>Water & Irrigation Setup</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <span className="block text-sm font-semibold text-white">
                  Irrigation Available
                </span>
                <span className="text-xs text-slate-400">
                  {form.irrigation_available ? "Active water supply" : "Rainfed crop"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleChange("irrigation_available", !form.irrigation_available)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  form.irrigation_available ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    form.irrigation_available ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Irrigation Source / System
              </label>
              <select
                value={form.irrigation_type}
                onChange={(e) => handleChange("irrigation_type", e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-sm"
              >
                {IRRIGATION_TYPES.map((it) => (
                  <option key={it} value={it}>
                    {it}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 5: CURRENT CROP */}
        <div className="bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sprout className="w-5 h-5 text-emerald-400" />
            <span>Primary Crop Cycle</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Primary Crop
              </label>
              <input
                type="text"
                value={form.current_crop}
                onChange={(e) => handleChange("current_crop", e.target.value)}
                placeholder="e.g. Wheat / Paddy / Cotton / Tomato"
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Crop Variety
              </label>
              <input
                type="text"
                value={form.crop_variety || ""}
                onChange={(e) => handleChange("crop_variety", e.target.value)}
                placeholder="e.g. HD 2967 / PBW 550 / Basmati 1121"
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Growth Stage
              </label>
              <select
                value={form.crop_growth_stage}
                onChange={(e) => handleChange("crop_growth_stage", e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-sm"
              >
                {GROWTH_STAGES.map((gs) => (
                  <option key={gs} value={gs}>
                    {gs}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Sowing Date
              </label>
              <input
                type="date"
                value={form.sowing_date || ""}
                onChange={(e) => handleChange("sowing_date", e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* SECTION 6: FINANCIAL & EXPERIENCE */}
        <div className="bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <IndianRupee className="w-5 h-5 text-amber-400" />
            <span>Farming Economics & Experience</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Seasonal Budget (₹)
              </label>
              <input
                type="number"
                min="0"
                value={form.farming_budget === 0 ? "" : form.farming_budget}
                onChange={(e) => handleChange("farming_budget", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                placeholder="e.g. 150000"
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Farming Experience (Years)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.farming_experience_years === 0 ? "" : form.farming_experience_years}
                onChange={(e) => handleChange("farming_experience_years", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                placeholder="e.g. 10"
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Previous Season Crop
              </label>
              <input
                type="text"
                value={form.previous_crop || ""}
                onChange={(e) => handleChange("previous_crop", e.target.value)}
                placeholder="e.g. Mustard / Pulses"
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Specific Farm Notes
            </label>
            <textarea
              rows={3}
              value={form.farm_notes || ""}
              onChange={(e) => handleChange("farm_notes", e.target.value)}
              placeholder="e.g. Tube well water available 8 hours daily. Soil rich in potassium."
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* SAVE SUBMIT BUTTON */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Farmer Profile</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* FARM MEMORY CONTEXT PREVIEW CARD */}
      <section className="bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-emerald-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Active Farm Context Summary
              </h3>
              <p className="text-xs text-slate-400">
                Automatically fed to AgroGuard Gemini AI Assistant for precise localized advice.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
            Active AI Memory
          </span>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
          <pre>
{JSON.stringify({
  user_id: user?.id,
  user_name: user?.full_name,
  active_farm: activeFarm?.name || "None",
  location: [form.village_location, form.district, form.state].filter(Boolean).join(", ") || "India",
  land_area: `${form.land_area || 0} ${form.land_unit}`,
  soil_type: form.soil_type,
  irrigation: `${form.irrigation_type} (${form.irrigation_available ? "Available" : "Rainfed"})`,
  current_crop: form.current_crop || "Wheat",
  growth_stage: form.crop_growth_stage,
  language: form.preferred_language
}, null, 2)}
          </pre>
        </div>
      </section>

    </div>
  );
}

export default function FarmerProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
