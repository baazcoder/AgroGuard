"use client";

import React, { useState } from "react";
import { 
  Compass, Sparkles, Sprout, Droplets, Calendar, Layers, ArrowRight, CheckCircle2, RefreshCw 
} from "lucide-react";
import { fetchCropAdvice, AdvisorResponse } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

export default function CropAdvisorPage() {
  const { t, getBackendLanguageName } = useLanguage();
  const [region, setRegion] = useState("North India / Punjab");
  const [season, setSeason] = useState("Rabi");
  const [soilType, setSoilType] = useState("Loamy");
  const [water, setWater] = useState("Irrigation");
  
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<AdvisorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const backendLang = getBackendLanguageName();
      const res = await fetchCropAdvice({
        region,
        season,
        soil_type: soilType,
        water_availability: water,
        language: backendLang,
      });
      setAdvice(res);
    } catch (err: any) {
      setError("Failed to generate crop advice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
          <Compass className="w-4 h-4" />
          <span>{t.advisor.badge}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {t.advisor.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          {t.advisor.subtitle}
        </p>
      </div>

      {/* CROP ADVISOR INPUT FORM */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Region */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.advisor.region}</span>
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="North India / Punjab">North India (Punjab / Haryana)</option>
              <option value="Indo-Gangetic Plains (UP / Bihar)">Indo-Gangetic Plains (UP / Bihar)</option>
              <option value="Central India (MP / Chattisgarh)">Central India (MP / CG)</option>
              <option value="Western India (Rajasthan / Gujarat)">Western India (RJ / GJ)</option>
              <option value="Deccan Plateau (Maharashtra / Telangana)">Deccan Plateau (MH / TS)</option>
              <option value="South India (Karnataka / TN / AP)">South India (KA / TN / AP)</option>
            </select>
          </div>

          {/* Season */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.advisor.season}</span>
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Rabi">Rabi (Winter: Nov - April)</option>
              <option value="Kharif">Kharif (Monsoon: June - Oct)</option>
              <option value="Zaid">Zaid (Summer: March - June)</option>
            </select>
          </div>

          {/* Soil Type */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.advisor.soilType}</span>
            </label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Loamy">Alluvial / Loamy Soil</option>
              <option value="Black Cotton">Black Cotton Soil</option>
              <option value="Clay">Heavy Clay Soil</option>
              <option value="Red / Sandy">Red / Sandy Soil</option>
            </select>
          </div>

          {/* Water Availability */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-teal-400" />
              <span>{t.advisor.water}</span>
            </label>
            <select
              value={water}
              onChange={(e) => setWater(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Irrigation">Assured Canal / Tubewell</option>
              <option value="Abundant">Abundant Water / Flooded</option>
              <option value="Rainfed / Limited">Rainfed / Low Irrigation</option>
            </select>
          </div>

        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white font-bold text-base shadow-xl flex items-center justify-center gap-3 transition-all"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>{t.common.loading}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>{t.advisor.submit}</span>
            </>
          )}
        </button>
      </form>

      {/* ERROR MSG */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* RECOMMENDATION RESULTS */}
      {advice && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* AI REASONING CARD */}
          <div className="glass-panel p-6 rounded-3xl border-blue-500/30 space-y-2">
            <h3 className="text-xs uppercase font-bold tracking-wider text-blue-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>AI Agronomic Rationale</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">{advice.ai_reasoning}</p>
          </div>

          {/* RECOMMENDED CROPS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {advice.recommendations.map((crop, idx) => (
              <div key={idx} className="glass-card p-6 rounded-3xl space-y-4 flex flex-col justify-between border-slate-800">
                <div className="space-y-3">
                  
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 font-bold text-xs">
                      {crop.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-extrabold text-xs">
                      {crop.suitability_score}% Match
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-emerald-400" />
                    <span>{crop.crop_name}</span>
                  </h3>

                  <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Duration:</span>
                      <span className="font-semibold text-white">{crop.expected_duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Water Needed:</span>
                      <span className="font-semibold text-teal-400">{crop.water_requirement}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Market Outlook:</span>
                      <span className="font-semibold text-emerald-400">{crop.market_outlook}</span>
                    </div>
                  </div>

                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Key Cultivation Tips:</span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {crop.key_tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
