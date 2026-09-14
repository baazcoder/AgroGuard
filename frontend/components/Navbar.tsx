"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  ShieldCheck, Leaf, MapPin, TrendingUp, MessageSquare, User, Menu, X, Globe, ChevronDown, LogOut, LogIn, UserPlus, Trash2 
} from "lucide-react";
import { useLanguage, Language } from "@/context/LanguageContext";
import { useActiveFarm } from "@/context/ActiveFarmContext";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [farmDropdownOpen, setFarmDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { language, setLanguage, t } = useLanguage();
  const { activeFarm, farmsList, selectActiveFarm, deleteFarmById } = useActiveFarm();
  const { user, logout } = useAuth();

  const navItems = [
    { name: "HOME", path: "/", icon: ShieldCheck },
    { name: "MY FARM", path: "/farm-map", icon: MapPin, highlight: true },
    { name: "DISEASE SCAN", path: "/disease-detection", icon: Leaf },
    { name: "MARKET", path: "/market", icon: TrendingUp },
    { name: "AI ASSISTANT", path: "/chat", icon: MessageSquare },
    { name: "PROFILE", path: "/profile", icon: User },
  ];

  const languages: Array<{ code: Language; label: string; flag: string }> = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "hi", label: "हिंदी (Hindi)", flag: "🇮🇳" },
    { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)", flag: "🇮🇳" },
    { code: "bho", label: "भोजपुरी (Bhojpuri)", flag: "🇮🇳" },
    { code: "hr", label: "हरियाणवी (Haryanvi)", flag: "🇮🇳" },
  ];

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  const getUserInitials = (name?: string) => {
    if (!name) return "AG";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/85 border-b border-emerald-500/10 transition-all shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
              <Leaf className="w-4 h-4 text-emerald-200 absolute -bottom-1 -right-1" />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
                AgroGuard
              </span>
              <span className="block text-[10px] uppercase tracking-widest font-bold text-emerald-400/90 -mt-1">
                AI Farm Protection
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-inner"
                      : item.highlight
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-900/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : ""}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* Active Farm Switcher Dropdown (If logged in) */}
            {user && (
              farmsList.length > 0 && activeFarm && activeFarm.farm_id !== 0 ? (
                <div className="relative">
                  <button
                    onClick={() => {
                      setFarmDropdownOpen(!farmDropdownOpen);
                      setLangDropdownOpen(false);
                      setUserDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-xs font-bold text-emerald-300 shadow-sm transition-all"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="max-w-[130px] truncate">🚜 {activeFarm.name}</span>
                    <ChevronDown className="w-3 h-3 text-emerald-400" />
                  </button>

                  {farmDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
                      <span className="block px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        Select Active Farm:
                      </span>
                      {farmsList.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => {
                            selectActiveFarm(f.id);
                            setFarmDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                            activeFarm.farm_id === f.id
                              ? "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <div className="text-left">
                            <div className="font-semibold">{f.name}</div>
                            <div className="text-[10px] text-slate-400">{f.area_acres} acres</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {activeFarm.farm_id === f.id && <span className="text-emerald-400 text-xs font-bold">✓ Active</span>}
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete "${f.name}"?`)) {
                                  await deleteFarmById(f.id);
                                }
                              }}
                              title="Delete Farm"
                              className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </button>
                      ))}
                      <div className="border-t border-slate-800 pt-1 mt-1">
                        <Link
                          href="/farm-map"
                          onClick={() => setFarmDropdownOpen(false)}
                          className="block text-center text-xs font-bold text-cyan-400 hover:text-cyan-300 py-1.5 rounded-xl hover:bg-slate-800"
                        >
                          + Manage Farms
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/farm-map"
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-xs font-bold text-emerald-300 shadow-sm transition-all"
                >
                  <span>🚜 + Map Your Farm</span>
                </Link>
              )
            )}

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setLangDropdownOpen(!langDropdownOpen);
                  setFarmDropdownOpen(false);
                  setUserDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-white shadow-sm transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentLangObj.flag} {currentLangObj.code.toUpperCase()}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <span className="block px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Select Language
                  </span>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        language === lang.code
                          ? "bg-emerald-500/20 text-emerald-400 font-bold"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                      {language === lang.code && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Auth Section */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setFarmDropdownOpen(false);
                    setLangDropdownOpen(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:bg-slate-800 border border-emerald-500/30 text-white transition-all shadow-sm"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow">
                    {getUserInitials(user.full_name)}
                  </div>
                  <span className="text-xs font-semibold max-w-[100px] truncate">{user.full_name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-xs font-bold text-white">{user.full_name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email_or_phone}</p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-emerald-400" />
                      <span>Farmer Profile & Settings</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Log In</span>
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-semibold text-white shadow-md shadow-emerald-900/20 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}

          </div>

          {/* Mobile Actions (Language + Hamburger) */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Mobile Auth Button */}
            {user ? (
              <Link
                href="/profile"
                className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow"
              >
                {getUserInitials(user.full_name)}
              </Link>
            ) : (
              <Link
                href="/login"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400 flex items-center gap-1"
              >
                <LogIn className="w-4 h-4" />
              </Link>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-6 space-y-2 bg-slate-950/95 border-b border-emerald-500/20 animate-in slide-in-from-top duration-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Icon className="w-5 h-5 text-emerald-400" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-slate-800 space-y-2">
            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20"
              >
                <LogOut className="w-5 h-5" />
                <span>Log Out ({user.full_name})</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-slate-200 font-semibold text-sm border border-slate-800"
                >
                  <LogIn className="w-4 h-4 text-emerald-400" />
                  <span>Log In</span>
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
