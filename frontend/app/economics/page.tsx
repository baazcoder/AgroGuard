"use client";

import React, { useState, useEffect } from "react";
import { 
  Coins, Layers, TrendingUp, ShieldAlert, Sparkles, ChevronDown, ChevronUp, 
  CheckCircle2, AlertTriangle, RefreshCw, Info, Calculator, CheckCheck, HelpCircle, ArrowUpRight
} from "lucide-react";
import { fetchFarmEconomics, calculateFarmEconomics, FarmEconomicsResponse } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

const CROP_OPTIONS = [
  "Wheat",
  "Paddy",
  "Cotton",
  "Mustard",
  "Maize",
  "Potato",
  "Tomato",
  "Soybean"
];

const DEFAULT_DISCLAIMER = "IMPORTANT SAFETY DISCLAIMER: All figures are estimated based on supplied agricultural standards and market reference prices. Actual production, costs, and revenues vary depending on microclimate, weather anomalies, pest attacks, soil fertility, and local mandi price fluctuations. Profit is never guaranteed.";

export default function FarmEconomicsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<FarmEconomicsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [showFormulaBreakdown, setShowFormulaBreakdown] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Simulator Form State
  const [selectedCrop, setSelectedCrop] = useState("Wheat");
  const [landAreaInput, setLandAreaInput] = useState<number | string>(4.0);
  const [landUnitInput, setLandUnitInput] = useState("acre");
  const [customPriceInput, setCustomPriceInput] = useState<string>("");

  useEffect(() => {
    async function loadEconomics() {
      try {
        setLoading(true);
        const result = await fetchFarmEconomics();
        if (result) {
          setData(result);
          setSelectedCrop(result.crop_name.split(" ")[0] || "Wheat");
          setLandAreaInput(result.land_area || 4.0);
          setLandUnitInput(result.land_unit || "acre");
          if (result.market_price_per_qtl > 0) {
            setCustomPriceInput(result.market_price_per_qtl.toString());
          }
        }
      } catch (err: any) {
        console.error("Error loading farm economics:", err);
        setErrorMessage("Failed to load initial farm economics. Ensure backend server is running.");
      } finally {
        setLoading(false);
      }
    }
    loadEconomics();
  }, []);

  const handleRecalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    const area = typeof landAreaInput === "string" ? parseFloat(landAreaInput) || 0 : landAreaInput;
    if (area < 0) {
      setErrorMessage("Land area cannot be negative.");
      return;
    }

    try {
      setCalculating(true);
      setErrorMessage(null);
      const customPrice = customPriceInput.trim() ? parseFloat(customPriceInput) : undefined;
      
      const result = await calculateFarmEconomics({
        crop: selectedCrop,
        land_area: area,
        land_unit: landUnitInput,
        custom_market_price: customPrice
      });

      setData(result);
    } catch (err: any) {
      console.error("Recalculation error:", err);
      setErrorMessage(err.message || "Failed to calculate farm economics.");
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-emerald-400">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="text-sm font-medium">{t.common.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      
      {/* HEADER SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-950 p-6 sm:p-10 border border-emerald-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide">
            <Sparkles className="w-4 h-4" />
            <span>{t.economics.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.economics.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
            {t.economics.subtitle}
          </p>

          {data && (
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold">
              <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-emerald-400 border border-emerald-500/30">
                {t.economics.landBadge}: <strong className="text-white">{data.land_area} {data.land_unit}</strong> ({data.land_area_acres} Acres / {data.land_area_hectares} Ha / {data.land_area_sqm.toLocaleString()} sq.m)
              </span>
              <span className={`px-3 py-1.5 rounded-xl border font-bold ${
                data.data_status === "VERIFIED DATA"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : data.data_status === "PARTIAL DATA"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/40"
              }`}>
                {data.data_status}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ERROR ALERT */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-sm font-semibold flex items-center gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* MAIN FINANCIAL CARDS GRID */}
      {data && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Estimated Input Cost */}
          <div className="glass-panel p-6 rounded-3xl space-y-3 border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t.economics.estimatedCost}
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">
                ₹{data.total_input_cost.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Range: ₹{data.cost_range.min.toLocaleString()} - ₹{data.cost_range.max.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Card 2: Expected Production */}
          <div className="glass-panel p-6 rounded-3xl space-y-3 border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t.economics.expectedProduction}
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">
                {data.expected_production_qtl.toLocaleString()} <span className="text-sm font-medium text-slate-400">Qtl</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                ({data.expected_production_kg.toLocaleString()} kg total)
              </p>
            </div>
          </div>

          {/* Card 3: Potential Gross Revenue */}
          <div className="glass-panel p-6 rounded-3xl space-y-3 border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t.economics.potentialRevenue}
              </span>
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-teal-400">
                ₹{data.gross_revenue.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                @ ₹{data.market_price_per_qtl.toLocaleString()}/Qtl ({data.market_price_source})
              </p>
            </div>
          </div>

          {/* Card 4: Estimated Profit Margin */}
          <div className="glass-panel p-6 rounded-3xl space-y-3 border-emerald-500/30 bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {t.economics.estimatedMargin}
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                ₹{data.estimated_margin.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-300/80 mt-1">
                Potential Profit (Gross Rev - Total Cost)
              </p>
            </div>
          </div>

        </section>
      )}

      {/* INTERACTIVE LAND & CROP SIMULATOR FORM */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <span>{t.economics.simulatorTitle}</span>
        </h2>

        <form onSubmit={handleRecalculate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          
          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {t.economics.customCrop}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-base"
            >
              {CROP_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Land Size */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {t.economics.customArea}
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              required
              value={landAreaInput}
              onChange={(e) => setLandAreaInput(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-white font-bold focus:outline-none focus:border-emerald-500 text-base"
            />
          </div>

          {/* Land Unit */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {t.economics.customUnit}
            </label>
            <select
              value={landUnitInput}
              onChange={(e) => setLandUnitInput(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-base"
            >
              <option value="acre">Acre / एकड़ / ਏਕੜ</option>
              <option value="hectare">Hectare / हेक्टेयर / ਹੈਕਟੇਅਰ</option>
              <option value="sqm">Square Meter (sq.m)</option>
            </select>
          </div>

          {/* Recalculate Button */}
          <div>
            <button
              type="submit"
              disabled={calculating}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {calculating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  <span>{t.economics.recalculateBtn}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </section>

      {/* ITEMIZED COST BREAKDOWN TABLE */}
      {data && data.cost_breakdown && data.cost_breakdown.length > 0 && (
        <section className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{t.economics.costBreakdownTitle}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Quantities scaled precisely for {data.land_area} {data.land_unit} ({data.land_area_acres} Acres).
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold w-fit">
              <CheckCheck className="w-3.5 h-3.5" />
              <span>PAU / ICAR Verified Quantities</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Item & Description</th>
                  <th className="py-3.5 px-4">Total Quantity</th>
                  <th className="py-3.5 px-4">Cost / Unit</th>
                  <th className="py-3.5 px-4">Total Input Cost (₹)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {data.cost_breakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">{item.category}</td>
                    <td className="py-3.5 px-4 text-white font-medium">{item.item_name}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      {item.quantity.toLocaleString()} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      ₹{item.cost_per_unit.toLocaleString()} / {item.unit}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      ₹{item.total_cost.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {t.economics.verifiedDataTag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900/90 font-bold border-t border-slate-700">
                <tr>
                  <td colSpan={4} className="py-4 px-4 text-right uppercase tracking-wider text-slate-300">
                    Total Farm Input Cost:
                  </td>
                  <td className="py-4 px-4 text-xl text-emerald-400 font-extrabold">
                    ₹{data.total_input_cost.toLocaleString()}
                  </td>
                  <td className="py-4 px-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* EXPANDABLE "HOW WAS THIS CALCULATED?" ACCORDION */}
      {data && (
        <section className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <button
            onClick={() => setShowFormulaBreakdown(!showFormulaBreakdown)}
            className="w-full p-6 text-left flex items-center justify-between bg-slate-900/60 hover:bg-slate-900 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {t.economics.howCalculatedBtn}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Expand to view exact agricultural formulas, land conversions, and per-acre baseline assumptions.
                </p>
              </div>
            </div>
            {showFormulaBreakdown ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showFormulaBreakdown && (
            <div className="p-6 border-t border-slate-800 bg-slate-950 space-y-4 animate-in fade-in">
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                {t.economics.howCalculatedTitle}
              </h4>

              <ul className="space-y-2.5 text-xs font-mono text-emerald-300 leading-relaxed">
                {data.calculation_breakdown.map((line, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              {data.missing_fields && data.missing_fields.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Unverified / Missing Data Fields:
                  </span>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {data.missing_fields.map((mf, i) => (
                      <li key={i}>{mf}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* SAFETY & FINANCIAL DISCLAIMER BOX */}
      <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{t.economics.disclaimerTitle}</span>
        </div>

        <p className="leading-relaxed">
          {data?.disclaimer || DEFAULT_DISCLAIMER}
        </p>
      </section>

    </div>
  );
}
