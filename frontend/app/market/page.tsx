"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, Search, MapPin, RefreshCw, Filter, ArrowUpRight, ArrowDownRight, Minus, Info, Sparkles 
} from "lucide-react";
import { fetchMarketPrices, MarketData } from "@/lib/api";

export default function MarketPage() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cropFilter, setCropFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const loadPrices = async () => {
    setLoading(true);
    try {
      const data = await fetchMarketPrices(cropFilter, stateFilter);
      setMarketData(data);
    } catch (err) {
      console.error("Error fetching mandi prices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPrices();
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold">
          <TrendingUp className="w-4 h-4" />
          <span>Indian Mandi Price Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Agricultural <span className="bg-gradient-to-r from-teal-400 to-emerald-200 bg-clip-text text-transparent">Market Prices</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Compare wholesale mandi prices across state markets to decide the best time and location to sell your crop yield.
        </p>
      </div>

      {/* FILTER SEARCH BAR */}
      <form onSubmit={handleFilterSubmit} className="glass-panel p-4 sm:p-6 rounded-3xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-slate-400 font-semibold mb-1 block">Filter by Crop</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              placeholder="e.g. Wheat, Basmati, Cotton..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 font-semibold mb-1 block">Filter by State</label>
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
            <span>Apply Market Filters</span>
          </button>
        </div>
      </form>

      {/* MODULAR INTEGRATION BADGE */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{marketData?.status_message || "Demonstration Mandi Data"}</span>
        </div>
        <span className="text-[11px] text-slate-500">Updated: {marketData?.updated_at || "Today"}</span>
      </div>

      {/* MARKET PRICES TABLE & CARDS */}
      {loading ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading Mandi market rates...</p>
        </div>
      ) : marketData && marketData.prices.length > 0 ? (
        <div className="glass-panel rounded-3xl overflow-hidden border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Commodity / Crop</th>
                  <th className="py-4 px-6">Mandi Market</th>
                  <th className="py-4 px-6">Min - Max Price</th>
                  <th className="py-4 px-6">Modal Price</th>
                  <th className="py-4 px-6">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {marketData.prices.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-white block text-base">{item.crop}</span>
                      <span className="text-[11px] text-slate-400">{item.date}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-200 block">{item.mandi}</span>
                      <span className="text-xs text-teal-400">{item.district}, {item.state}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs font-mono">
                      ₹{item.min_price.toLocaleString()} - ₹{item.max_price.toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-lg font-extrabold text-emerald-400">
                        ₹{item.modal_price.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal block">{item.unit}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold ${
                        item.trend === "up"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : item.trend === "down"
                          ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          : "bg-slate-800 text-slate-300"
                      }`}>
                        {item.trend === "up" && <ArrowUpRight className="w-3.5 h-3.5" />}
                        {item.trend === "down" && <ArrowDownRight className="w-3.5 h-3.5" />}
                        {item.trend === "stable" && <Minus className="w-3.5 h-3.5" />}
                        <span>{item.trend.toUpperCase()}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
          <p className="text-base text-slate-300 font-semibold">No mandi prices found matching your filter criteria.</p>
          <button
            onClick={() => { setCropFilter(""); setStateFilter(""); loadPrices(); }}
            className="text-xs text-teal-400 hover:underline font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}

    </div>
  );
}
