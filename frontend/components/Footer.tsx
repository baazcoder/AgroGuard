import React from "react";
import Link from "next/link";
import { ShieldCheck, Leaf, Heart, Cpu } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-emerald-500/10 bg-slate-950/90 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-600 text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">AgroGuard</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              AI-powered intelligence for smarter farming. Helping farmers identify crop diseases early, protect yield, and optimize farm productivity using Gemini Vision.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-500/20 px-3 py-1.5 rounded-lg w-fit">
              <Cpu className="w-4 h-4" />
              <span>Powered by Google Gemini 2.5 Multimodal API</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Core Modules</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/disease-detection" className="hover:text-emerald-400 transition-colors">Crop Disease Detection</Link></li>
              <li><Link href="/weather" className="hover:text-emerald-400 transition-colors">Agricultural Weather</Link></li>
              <li><Link href="/market" className="hover:text-emerald-400 transition-colors">Mandi Commodity Prices</Link></li>
              <li><Link href="/crop-advisor" className="hover:text-emerald-400 transition-colors">AI Crop Advisor</Link></li>
              <li><Link href="/chat" className="hover:text-emerald-400 transition-colors">AI Farming Assistant</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Hackathon Info</h4>
            <p className="text-xs text-slate-400 mb-3">
              Built for University Hackathon Demonstration. Clean modular REST API + Next.js architecture.
            </p>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
              <span className="block font-semibold text-emerald-400 mb-1">Disclaimer</span>
              AI-assisted diagnostic guidance. Consult local Krishi Vigyan Kendra for critical crop loss.
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} AgroGuard AI Platform. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Designed with</span>
            <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
            <span>for Sustainable Agriculture</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
