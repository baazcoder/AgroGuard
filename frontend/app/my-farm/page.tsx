"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyFarmPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/farm-map");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-300 text-sm font-medium">Redirecting to Interactive Farm Map...</p>
    </div>
  );
}
