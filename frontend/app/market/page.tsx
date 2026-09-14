"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, Search, MapPin, RefreshCw, Filter, ArrowUpRight, ArrowDownRight, Minus, Info, Sparkles, AlertTriangle, Building2, Calendar, Navigation, Clock, ShieldAlert
} from "lucide-react";
import { fetchMarketIntelligence, MarketIntelligenceResponse, MarketPriceItem } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { useActiveFarm } from "@/context/ActiveFarmContext";
import { AuthGuard } from "@/components/AuthGuard";

function MarketContent() {
  const { t } = useLanguage();
  const { activeFarm } = useActiveFarm();

  const [marketData, setMarketData] = useState<MarketIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cropFilter, setCropFilter] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<string>("");

  const loadMarketIntelligence = async (farmId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const targetFarmId = farmId !== undefined ? farmId : activeFarm?.farm_id;
      const data = await fetchMarketIntelligence(cropFilter, stateFilter, false, targetFarmId);
      setMarketData(data);
    } catch (err: any) {
      setError("Unable to load market intelligence data for the active farm.");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch market intelligence whenever active farm changes (and invalidate stale Farm A data)
  useEffect(() => {
    setMarketData(null); // Clear stale data immediately on farm switch
    loadMarketIntelligence(activeFarm?.farm_id);
  }, [activeFarm?.farm_id]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMarketIntelligence(activeFarm?.farm_id);
  };

  const getTrendStyle = (trend: string) => {
    const tLower = trend.toLowerCase();
    if (tLower === "up" || tLower.includes("increas")) {
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
    if (tLower === "down" || tLower.includes("decreas")) {
      return "bg-rose-500/20 text-rose-300 border-rose-500/40";
    }
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

  const getTrendIcon = (trend: string) => {
    const tLower = trend.toLowerCase();
    if (tLower === "up" || tLower.includes("increas")) return <ArrowUpRight className="w-4 h-4 text-emerald-400" />;
    if (tLower === "down" || tLower.includes("decreas")) return <ArrowDownRight className="w-4 h-4 text-rose-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold">
          <TrendingUp className="w-4 h-4" />
          <span>{t.market.badge}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {t.market.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Proximity-ranked Mandi discovery and verified market prices calculated from your active farm location.
        </p>
      </div>

      {/* ACTIVE FARM LOCATION BANNER */}
      {activeFarm && (
        <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-teal-500/30 bg-gradient-to-r from-teal-950/30 via-slate-900/90 to-emerald-950/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30 shrink-0">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold text-teal-400 tracking-wider">Active Farm Proximity</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{activeFarm.name}</span>
                <span className="text-xs font-normal text-slate-400">
                  ({activeFarm.village_locality ? `${activeFarm.village_locality}, ` : ""}{activeFarm.district || "Punjab"})
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300 bg-slate-950/60 px-3 py-2 rounded-2xl border border-slate-800">
            <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Farm Coords: <strong className="text-white">{activeFarm.latitude.toFixed(4)}° N, {activeFarm.longitude.toFixed(4)}° E</strong></span>
          </div>
        </div>
      )}

      {/* FILTER SEARCH BAR */}
      <form onSubmit={handleFilterSubmit} className="glass-panel p-4 sm:p-6 rounded-3xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-slate-400 font-semibold mb-1 block">{t.market.selectCrop}</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              placeholder="e.g. Wheat, Basmati, Mustard, Cotton..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 font-semibold mb-1 block">{t.market.selectState}</label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              placeholder="e.g. Punjab, Haryana, Rajasthan..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
            <span>{t.common.search}</span>
          </button>
        </div>
      </form>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CONTENT DISPLAY */}
      {loading ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Discovering nearby mandis and computing distance from active farm...</p>
        </div>
      ) : marketData ? (
        <div className="space-y-8">

          {/* MARKET SERVICE UNAVAILABLE BANNER */}
          {marketData.is_unavailable && (
            <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-base text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <span>{t.market.marketUnavailable}</span>
              </div>
              <p className="text-xs text-rose-300/80">
                {marketData.status_message || "Live mandi market prices could not be retrieved at this time."}
              </p>
            </div>
          )}

          {/* AGROGUARD INSIGHT AI EXPLANATION PANEL */}
          {marketData.agroguard_insight && !marketData.is_unavailable && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4 border border-teal-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-teal-950/20">
              <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      {t.market.agroguardInsightTitle}
                    </h2>
                    <span className="text-[11px] text-slate-400">{t.market.sellingConsiderations}</span>
                  </div>
                </div>

                {marketData.farm_context_summary && (
                  <div className="text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800 hidden sm:block">
                    Active Crop: <span className="font-bold text-teal-400">{marketData.farm_context_summary.crop}</span>
                  </div>
                )}
              </div>

              <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-line">
                {marketData.agroguard_insight}
              </p>

              <div className="pt-2 text-[11px] text-slate-500 italic flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Note: Market prices fluctuate daily based on moisture content, crop grade quality, and local mandi arrivals.</span>
              </div>
            </div>
          )}

          {/* TOP 5 NEARBY MANDIS SECTION */}
          {!marketData.is_unavailable && marketData.prices.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-teal-400" />
                  <span>📍 Top 5 Mandies Nearby (Ranked by Proximity)</span>
                </h2>
                <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                  Calculated from active farm coordinates
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {marketData.prices.slice(0, 5).map((mandi, rIdx) => {
                  const hasDist = mandi.distance_km !== undefined && mandi.distance_km !== null && mandi.distance_km < 90000;
                  return (
                    <div 
                      key={rIdx}
                      className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-teal-500/30 space-y-2 relative overflow-hidden shadow-lg hover:border-teal-400/60 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 font-extrabold text-xs flex items-center justify-center border border-teal-500/40">
                          #{rIdx + 1}
                        </span>
                        {hasDist && (
                          <span className="text-[10px] font-bold text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded-full border border-teal-500/30">
                            {mandi.distance_km} km
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-white text-sm truncate">{mandi.mandi}</h4>
                        <p className="text-[10px] text-slate-400 truncate">{mandi.district}, {mandi.state}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 truncate max-w-[70px]">{mandi.crop}</span>
                        <span className="text-sm font-extrabold text-emerald-400">₹{mandi.modal_price.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MAIN COMMODITY CARDS */}
          {!marketData.is_unavailable && marketData.prices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {marketData.prices.map((item: MarketPriceItem, idx: number) => {
                const isUnavailable = !item.is_price_available || item.price_status === "Price data unavailable";
                const hasDistance = item.distance_km !== undefined && item.distance_km !== null && item.distance_km < 90000;

                return (
                  <div 
                    key={idx} 
                    className="glass-panel p-6 rounded-3xl space-y-5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      
                      {/* CARD HEADER WITH DISTANCE BADGE */}
                      <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">{item.state} • {item.district}</span>
                            
                            {/* DYNAMIC DISTANCE BADGE */}
                            {hasDistance && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300">
                                <Navigation className="w-3 h-3 text-teal-400" />
                                {item.distance_km} km away
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl font-extrabold text-white mt-0.5">{item.crop}</h3>
                          
                          <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>{item.mandi}</span>
                          </span>
                        </div>

                        {/* TREND BADGE */}
                        {!isUnavailable ? (
                          <div className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 shrink-0 ${getTrendStyle(item.trend)}`}>
                            {getTrendIcon(item.trend)}
                            <span>{item.trend_display || item.trend.toUpperCase()}</span>
                          </div>
                        ) : (
                          <div className="px-3 py-1.5 rounded-full border text-xs font-bold bg-rose-500/10 text-rose-300 border-rose-500/30 shrink-0">
                            Price Unavailable
                          </div>
                        )}
                      </div>

                      {/* PRICE METRICS OR UNAVAILABLE STATE */}
                      {!isUnavailable ? (
                        <>
                          {/* PRICE METRICS GRID */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
                              <span className="text-[11px] text-slate-400 block font-semibold">{t.market.modalPrice}</span>
                              <p className="text-2xl font-extrabold text-emerald-400">₹{item.modal_price.toLocaleString()}</p>
                              <span className="text-[10px] text-slate-500 block">Range: ₹{item.min_price} - ₹{item.max_price}</span>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
                              <span className="text-[11px] text-slate-400 block font-semibold">{t.market.sevenDayTrend}</span>
                              <p className={`text-2xl font-extrabold ${
                                (item.seven_day_change_pct || 0) > 0 ? "text-emerald-400" : (item.seven_day_change_pct || 0) < 0 ? "text-rose-400" : "text-slate-300"
                              }`}>
                                {(item.seven_day_change_pct || 0) > 0 ? `+${item.seven_day_change_pct}%` : `${item.seven_day_change_pct || 0}%`}
                              </p>
                              <span className="text-[10px] text-slate-500 block">7-day change rate</span>
                            </div>
                          </div>

                          {/* BEST OBSERVED NEARBY MARKET COMPARISON */}
                          {item.best_nearby_market && (
                            <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between gap-3 text-xs">
                              <div className="space-y-0.5">
                                <span className="text-[10px] uppercase font-extrabold text-teal-400 tracking-wider block">
                                  {t.market.bestNearbyMarket}
                                </span>
                                <span className="font-bold text-white">
                                  {item.best_nearby_market.mandi} ({item.best_nearby_market.district})
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-sm font-extrabold text-emerald-400 block">
                                  ₹{item.best_nearby_market.price.toLocaleString()}/Qtl
                                </span>
                                <span className="text-[10px] text-teal-300 font-semibold">
                                  +{item.best_nearby_market.difference_pct}% higher
                                </span>
                              </div>
                            </div>
                          )}

                          {/* 7-DAY HISTORICAL PRICE SPARKLINE */}
                          {item.historical_prices && item.historical_prices.length > 0 && (
                            <div className="pt-2 space-y-2">
                              <span className="text-[11px] text-slate-400 font-semibold block">7-Day Price History:</span>
                              <div className="flex items-end justify-between gap-1 h-12 pt-2 px-1 border-b border-slate-800">
                                {item.historical_prices.map((pt, pIdx) => {
                                  const minP = Math.min(...item.historical_prices!.map(h => h.price));
                                  const maxP = Math.max(...item.historical_prices!.map(h => h.price));
                                  const range = (maxP - minP) || 1;
                                  const barHeightPct = Math.max(20, Math.min(100, ((pt.price - minP) / range) * 100));
                                  
                                  return (
                                    <div key={pIdx} className="flex-1 flex flex-col items-center gap-1 group relative">
                                      <div 
                                        style={{ height: `${barHeightPct}%` }} 
                                        className={`w-full rounded-t-sm transition-all ${
                                          pIdx === item.historical_prices!.length - 1 
                                            ? "bg-teal-400" 
                                            : "bg-slate-700 group-hover:bg-teal-500/60"
                                        }`} 
                                      />
                                      <span className="text-[9px] text-slate-500 block truncate w-full text-center">{pt.date}</span>
                                      
                                      {/* Tooltip */}
                                      <div className="absolute -top-8 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                        ₹{pt.price}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
                          <ShieldAlert className="w-6 h-6 text-slate-400 mx-auto" />
                          <p className="text-sm font-bold text-rose-400">Price data unavailable</p>
                          <p className="text-xs text-slate-400">
                            No verified mandi records were found for <strong className="text-white">{item.crop}</strong> in this region today.
                          </p>
                        </div>
                      )}

                    </div>

                    {/* DATA SOURCE & TIMESTAMP FOOTER */}
                    <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
                      <span className="truncate">Source: {item.data_source || "AGMARKNET"}</span>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        {item.updated_minutes_ago !== undefined && (
                          <span className="inline-flex items-center gap-1 text-teal-400/90 font-medium">
                            <Clock className="w-3 h-3 text-teal-400" />
                            <span>Updated {item.updated_minutes_ago} mins ago</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{item.date}</span>
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : !marketData.is_unavailable ? (
            <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
              <p className="text-base text-slate-300 font-semibold">No mandi prices found matching your filter criteria.</p>
              <button
                onClick={() => { setCropFilter(""); setStateFilter(""); loadMarketIntelligence(activeFarm?.farm_id); }}
                className="text-xs text-teal-400 hover:underline font-semibold"
              >
                Reset Filters
              </button>
            </div>
          ) : null}

        </div>
      ) : null}

    </div>
  );
}

export default function MarketPage() {
  return (
    <AuthGuard>
      <MarketContent />
    </AuthGuard>
  );
}

