"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Leaf, CloudSun, TrendingUp, Compass, MessageSquare, Menu, X, MapPin } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/", icon: ShieldCheck },
    { name: "Disease Detection", path: "/disease-detection", icon: Leaf, highlight: true },
    { name: "Weather", path: "/weather", icon: CloudSun },
    { name: "Market Prices", path: "/market", icon: TrendingUp },
    { name: "Crop Advisor", path: "/crop-advisor", icon: Compass },
    { name: "AI Assistant", path: "/chat", icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-emerald-500/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
              <Leaf className="w-4 h-4 text-emerald-200 absolute -bottom-1 -right-1" />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
                AgroGuard
              </span>
              <span className="block text-[10px] uppercase tracking-widest font-bold text-emerald-400/90 -mt-1">
                AI Farm Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-inner"
                      : item.highlight
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/25"
                      : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : ""}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side Location Badge */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-emerald-500/20 text-xs text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Punjab, India</span>
            </div>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 space-y-2 bg-slate-950/95 border-b border-emerald-500/20 animate-in slide-in-from-top duration-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
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
        </div>
      )}
    </header>
  );
}
