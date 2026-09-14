"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, Leaf, CloudSun, TrendingUp, Compass, MessageSquare, 
  ArrowRight, Sparkles, CheckCircle2, AlertTriangle, Thermometer, Droplets, Wind, MapPin
} from "lucide-react";
import { fetchWeather, fetchMarketPrices, WeatherData, MarketData } from "@/lib/api";

export default function Dashboard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [wData, mData] = await Promise.all([
          fetchWeather().catch(() => null),
          fetchMarketPrices().catch(() => null)
        ]);
        setWeather(wData);
        setMarket(mData);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-10">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900/90 to-slate-950 p-8 sm:p-12 border border-emerald-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide">
            <Sparkles className="w-4 h-4" />
            <span>Next-Gen Agricultural Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            AI-powered intelligence for <span className="bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">smarter farming.</span>
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed">
            Diagnose crop leaf diseases instantly using Gemini Vision AI, monitor local mandi prices, receive hyper-local weather risk alerts, and talk to your personal AI farming advisor.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/disease-detection"
              className="inline-flex items-center gap-3 px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-base shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Leaf className="w-5 h-5" />
              <span>Analyze Your Crop</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/chat"
              className="inline-flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-base transition-all"
            >
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <span>Ask AI Assistant</span>
            </Link>
          </div>
        </div>
      </section>

      {/* QUICK STATUS BAR & WEATHER PREVIEW */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Weather Preview Widget */}
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CloudSun className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Live Local Weather</h3>
                <p className="text-lg font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  {weather?.location || "Punjab Agricultural Zone"}
                </p>
              </div>
            </div>
            <Link href="/weather" className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1">
              View Forecast <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Temperature</span>
              <div className="flex items-center gap-1.5 text-xl font-bold text-white">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <span>{weather ? `${weather.temperature}°C` : "28°C"}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Condition</span>
              <span className="text-base font-bold text-white block truncate">
                {weather?.condition || "Partly Cloudy"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Humidity</span>
              <div className="flex items-center gap-1.5 text-xl font-bold text-white">
                <Droplets className="w-4 h-4 text-blue-400" />
                <span>{weather ? `${weather.humidity}%` : "65%"}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Rain Risk</span>
              <div className="flex items-center gap-1.5 text-xl font-bold text-emerald-400">
                <Wind className="w-4 h-4" />
                <span>{weather ? `${weather.rain_probability}%` : "30%"}</span>
              </div>
            </div>
          </div>

          {weather?.agricultural_warnings?.[0] && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{weather.agricultural_warnings[0]}</span>
            </div>
          )}
        </div>

        {/* Quick Diagnostics Stats Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">AI Accuracy</h3>
                <p className="text-xl font-bold text-white">Gemini 2.5 Vision</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Multimodal zero-shot diagnosis trained on thousands of plant pathology cases with strict uncertain diagnosis verification.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Supported Crops:</span>
              <span className="font-semibold text-emerald-400">Wheat, Rice, Cotton, Tomato, Potato +</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Analysis Speed:</span>
              <span className="font-semibold text-white">&lt; 2.5 Seconds</span>
            </div>
          </div>
        </div>
      </section>

      {/* PRIMARY FEATURE MODULES GRID */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Core Farming Services</h2>
            <p className="text-sm text-slate-400">Everything you need to safeguard and grow your harvest.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Disease Detection */}
          <Link
            href="/disease-detection"
            className="group glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between border-emerald-500/20 hover:border-emerald-500/50 transition-all"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                Disease Detection
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Upload or snap a leaf photo. Get instant disease identification, severity rating, and recommended treatments.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-emerald-400 pt-4 group-hover:translate-x-1 transition-transform">
              <span>Start Analysis</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          {/* Card 2: Mandi Market Prices */}
          <Link
            href="/market"
            className="group glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between transition-all"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-teal-400 transition-colors">
                Mandi Commodity Prices
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Track real-time modal prices for Wheat, Basmati Rice, Cotton, and Vegetables across regional mandis.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-teal-400 pt-4 group-hover:translate-x-1 transition-transform">
              <span>View Mandi Prices</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          {/* Card 3: AI Crop Advisor */}
          <Link
            href="/crop-advisor"
            className="group glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between transition-all"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                Crop Advisory
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Not sure what to sow next? Input your soil type, season, and water access to receive AI crop recommendations.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-blue-400 pt-4 group-hover:translate-x-1 transition-transform">
              <span>Get Crop Guidance</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

        </div>
      </section>

      {/* MANDI MARKET SNAPSHOT TABLE PREVIEW */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Mandi Market Snapshot</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Live commodity pricing in primary agricultural hubs.</p>
          </div>
          <Link
            href="/market"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
          >
            Explore All Commodities →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Crop</th>
                <th className="py-3 px-4">Mandi & State</th>
                <th className="py-3 px-4">Modal Price</th>
                <th className="py-3 px-4">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {market?.prices.slice(0, 4).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">{item.crop}</td>
                  <td className="py-3 px-4 text-xs text-slate-400">{item.mandi}, {item.state}</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">₹{item.modal_price.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">/ Qtl</span></td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                      item.trend === "up" ? "bg-emerald-500/10 text-emerald-400" :
                      item.trend === "down" ? "bg-rose-500/10 text-rose-400" : "bg-slate-800 text-slate-300"
                    }`}>
                      {item.trend.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
