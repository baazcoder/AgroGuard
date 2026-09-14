"use client";

import dynamic from "next/dynamic";
import React from "react";
import { RefreshCw } from "lucide-react";

// Dynamically import LeafletSatelliteMap with SSR disabled to prevent "window is not defined"
const LeafletSatelliteMap = dynamic(
  () => import("./LeafletSatelliteMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[450px] sm:h-[550px] rounded-3xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <span className="text-sm font-semibold">Loading Interactive Satellite GIS Map...</span>
      </div>
    )
  }
);

export default LeafletSatelliteMap;
