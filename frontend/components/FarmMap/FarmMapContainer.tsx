"use client";

import dynamic from "next/dynamic";
import React from "react";

// Dynamic import with SSR disabled to ensure Leaflet window object is only initialized on browser
const LeafletMap = dynamic(
  () => import("./LeafletMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[450px] sm:h-[550px] rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-medium">Loading Interactive Farm Map...</span>
      </div>
    )
  }
);

export default LeafletMap;
