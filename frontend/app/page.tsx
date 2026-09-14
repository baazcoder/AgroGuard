"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Sparkles, AlertTriangle, ShieldAlert, CheckCircle2, 
  Leaf, CloudSun, TrendingUp, User, MessageSquare, ArrowRight, 
  RefreshCw, AlertOctagon, MapPin, UserPlus, LogIn, Sprout
} from "lucide-react";
import { fetchFarmDecisionEngine, FarmActionPlanResponse, ActionItem } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { useActiveFarm } from "@/context/ActiveFarmContext";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { t } = useLanguage();
  const { activeFarm } = useActiveFarm();
  const { user } = useAuth();
  const [plan, setPlan] = useState<FarmActionPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"today" | "3days" | "7days">("today");

  const loadActionPlan = async () => {
    setLoading(true);
    try {
      const data = await fetchFarmDecisionEngine(false, activeFarm?.farm_id);
      setPlan(data);
    } catch (err) {
      console.error("Error loading decision engine action plan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActionPlan();
  }, [activeFarm?.farm_id, user?.id]);

  const getPriorityStyle = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === "high") {
      return {
        card: "bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/40 hover:border-rose-500/70",
        badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        icon: <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />,
        label: "🔴 " + (t.dashboard.highPriority || "High Priority")
      };
    }
    if (p === "medium") {
      return {
        card: "bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/40 hover:border-amber-500/70",
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
        label: "🟡 " + (t.dashboard.recommended || "Recommended")
      };
    }
    return {
      card: "bg-slate-900/80 border-slate-800 hover:border-slate-700",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      label: "🟢 " + (t.dashboard.optional || "Optional")
    };
  };

  const renderActionCard = (item: ActionItem, idx: number) => {
    const style = getPriorityStyle(item.priority);
    return (
      <div key={idx} className={`p-5 rounded-2xl border transition-all space-y-3 ${style.card}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            {style.icon}
            <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-extrabold ${style.badge}`}>
              {style.label}
            </span>
            {item.affected_field && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-400" />
                <span>{item.affected_field}</span>
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-semibold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            Data Source: {item.supporting_data_source || item.source_context || "AgroGuard Data"}
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug">
          {item.action}
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
          <span className="font-semibold text-slate-400 block mb-0.5">Agricultural Rationale & Impact:</span>
          {item.reason}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">

      {/* TOP BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-950 p-6 sm:p-8 border border-emerald-500/30 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{user ? `Welcome back, ${user.full_name}!` : "AI Crop Protection & Farm Management"}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t.dashboard.whatShouldIDoToday || "What should I do today?"}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadActionPlan}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh Plan</span>
            </button>
            
            {user ? (
              <Link
                href="/profile"
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <User className="w-4 h-4" />
                <span>My Profile</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </Link>
            )}
          </div>
        </div>

        {/* FARM STATUS SUMMARY CARDS */}
        {plan?.farm_status && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">Active Farm</span>
              <p className="text-base font-extrabold text-white truncate">{plan.farm_status.farm_name || activeFarm?.name || "No Farm Mapped"}</p>
              <span className="text-xs text-emerald-400 font-semibold block">{plan.farm_status.crop} ({plan.farm_status.land_area})</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">Crop Health</span>
              <p className={`text-sm font-extrabold truncate ${
                plan.farm_status.health_status.includes("High") ? "text-rose-400" :
                plan.farm_status.health_status.includes("Moderate") ? "text-amber-400" : "text-emerald-400"
              }`}>
                {plan.farm_status.health_status}
              </p>
              <span className="text-[10px] text-slate-400 block">Pathology Scan</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">Weather Alert</span>
              <p className="text-sm font-bold text-white truncate">{plan.farm_status.weather_summary}</p>
              <span className="text-[10px] text-teal-400 block">Live Forecast</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">Market Rates</span>
              <p className="text-sm font-bold text-emerald-400 truncate">{plan.farm_status.market_summary}</p>
              <span className="text-[10px] text-slate-400 block">AGMARKNET Prices</span>
            </div>

          </div>
        )}
      </section>

      {/* UNMAPPED FARM BANNER */}
      {(activeFarm?.farm_id === 0 || plan?.farm_status?.farm_id === 0) && (
        <section className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No Virtual Farm Boundary Mapped Yet</h3>
              <p className="text-xs text-slate-300">Draw your farm boundary on the GIS map to activate custom satellite weather, leaf diagnostics, and field action plans.</p>
            </div>
          </div>

          <Link
            href="/farm-map"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs text-center shrink-0 transition-all flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            <span>+ Map Your Farm Boundary</span>
          </Link>
        </section>
      )}

      {/* NOT LOGGED IN CTA */}
      {!user && (
        <section className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Save Your Farms & Custom AI Memory</h3>
              <p className="text-xs text-slate-400">Log in or create a free farmer account to bind your farm map boundaries, weather alerts, and diagnosis history.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Link
              href="/login"
              className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs text-center transition-all"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs text-center transition-all flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </Link>
          </div>
        </section>
      )}

      {/* CENTRAL SECTION: "WHAT SHOULD I DO TODAY?" DAILY FARM PLAN */}
      <section className="space-y-6">
        
        {/* SECTION NAVIGATION TABS */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("today")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "today"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              📅 {t.dashboard.todayPlan || "Today's Action Plan"} ({plan?.today_actions?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("3days")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "3days"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              ⏳ {t.dashboard.next3Days || "Next 3 Days"} ({plan?.next_3_days?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("7days")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "7days"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              🗓 {t.dashboard.next7Days || "Next 7 Days"} ({plan?.next_7_days?.length || 0})
            </button>
          </div>

          <span className="text-[11px] text-slate-400 shrink-0 hidden sm:inline">
            Generated: {plan?.generated_at || "Just now"}
          </span>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Synthesizing Profile, Pathology, Weather & Market Data...</p>
          </div>
        ) : plan ? (
          <div className="space-y-6">

            {/* TAB CONTENT: ACTION CARDS */}
            <div className="space-y-4">
              {activeTab === "today" && (
                plan.today_actions.length > 0 ? (
                  plan.today_actions.map((item: ActionItem, idx: number) => renderActionCard(item, idx))
                ) : (
                  <div className="p-8 rounded-2xl bg-slate-900/60 text-center text-xs text-slate-400">
                    No high urgency actions today. Maintain standard field observation.
                  </div>
                )
              )}

              {activeTab === "3days" && (
                plan.next_3_days.map((item: ActionItem, idx: number) => renderActionCard(item, idx))
              )}

              {activeTab === "7days" && (
                plan.next_7_days.map((item: ActionItem, idx: number) => renderActionCard(item, idx))
              )}
            </div>

            {/* WATCH FOR & AVOID WARNING PILLS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              
              {/* WATCH FOR */}
              {plan.watch_for && plan.watch_for.length > 0 && (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>⚠️ Watch For</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {plan.watch_for.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AVOID */}
              {plan.avoid && plan.avoid.length > 0 && (
                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                  <h4 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4" />
                    <span>⛔ Avoid</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {plan.avoid.map((a, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

          </div>
        ) : null}

      </section>

      {/* CORE PRODUCT CORE FEATURES GRID */}
      <section className="space-y-4 pt-4 border-t border-slate-800">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span>Core AgroGuard Features</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Link
            href="/farm-map"
            className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group h-40"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                My Virtual Farm
              </h3>
              <p className="text-xs text-slate-400 mt-1">Interactive GIS polygon mapping & field-level disease tracking.</p>
            </div>
          </Link>

          <Link
            href="/disease-detection"
            className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group h-40"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Leaf className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                AI Disease Scan
              </h3>
              <p className="text-xs text-slate-400 mt-1">Upload leaf photo for instant pathology diagnosis & treatment.</p>
            </div>
          </Link>

          <Link
            href="/market"
            className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group h-40"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-teal-400 transition-colors">
                Mandi Market Rates
              </h3>
              <p className="text-xs text-slate-400 mt-1">Live market prices, 7-day trends & best nearby sell mandis.</p>
            </div>
          </Link>

          <Link
            href="/chat"
            className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 transition-all flex flex-col justify-between group h-40"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                AgroGuard AI Chat
              </h3>
              <p className="text-xs text-slate-400 mt-1">Ask questions in your preferred language using full farm context.</p>
            </div>
          </Link>

        </div>
      </section>

    </div>
  );
}
