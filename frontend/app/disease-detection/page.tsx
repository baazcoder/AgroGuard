"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { 
  Upload, Image as ImageIcon, X, Sparkles, AlertCircle, ShieldAlert, 
  CheckCircle2, AlertTriangle, RefreshCw, Info, Leaf, Stethoscope, ShieldCheck, Download
} from "lucide-react";
import { analyzeCropImage, DiagnosisResult } from "@/lib/api";

// Sample Demo Images as Data URLs for instant Hackathon Testing
const DEMO_SAMPLES = [
  {
    name: "Wheat Yellow Rust Sample",
    url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "Tomato Blight Sample",
    url: "https://images.unsplash.com/photo-1592417817098-8f3d6eb231fc?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "Healthy Rice Leaves",
    url: "https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&q=80&w=600",
  }
];

export default function DiseaseDetectionPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    "Uploading Crop Image to Secure Endpoint...",
    "Extracting Leaf Morphology & Pathology Patterns...",
    "Querying Google Gemini Vision AI...",
    "Synthesizing Treatment & Prevention Guidelines..."
  ];

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size exceeds 10MB limit.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setResult(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const loadSampleImage = async (url: string) => {
    try {
      setError(null);
      setResult(null);
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], "sample_crop.jpg", { type: "image/jpeg" });
      handleFileChange(file);
    } catch (err) {
      console.error("Failed to load sample image:", err);
      // Fallback
      setPreviewUrl(url);
      setSelectedFile(new File(["dummy"], "sample_crop.jpg", { type: "image/jpeg" }));
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    setError(null);
    setResult(null);
    setAnalysisStep(0);

    // Simulate step sequence for polished UX demo
    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 600);

    try {
      const data = await analyzeCropImage(selectedFile);
      clearInterval(stepInterval);
      setResult(data);
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err.message || "Failed to complete crop analysis. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-4 h-4" />
          <span>Gemini Vision AI Pathology</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Crop Disease <span className="bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">Diagnosis</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Upload a clear photo of an affected leaf or plant section to receive instant AI identification, severity analysis, and recommended remedies.
        </p>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* UPLOAD WORKSPACE CARD */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl space-y-6">
        
        {!previewUrl ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-14 text-center cursor-pointer transition-all ${
              isDragOver
                ? "border-emerald-400 bg-emerald-500/10 scale-[1.01]"
                : "border-slate-800 hover:border-emerald-500/50 bg-slate-900/40 hover:bg-slate-900/70"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">
              Drag & Drop your crop image here
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Supports JPG, PNG, WEBP up to 10MB
            </p>

            <button
              type="button"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 inline-flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Browse File</span>
            </button>
          </div>
        ) : (
          /* PREVIEW STATE */
          <div className="space-y-6">
            <div className="relative max-w-md mx-auto aspect-video rounded-2xl overflow-hidden border border-emerald-500/30 bg-slate-900 group">
              <img
                src={previewUrl}
                alt="Selected crop leaf preview"
                className="w-full h-full object-contain"
              />
              <button
                onClick={handleClearImage}
                disabled={analyzing}
                className="absolute top-3 right-3 p-2 rounded-xl bg-slate-950/80 text-slate-300 hover:text-white hover:bg-rose-600 transition-colors"
                title="Remove image"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleStartAnalysis}
                disabled={analyzing}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-base shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 transition-all"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Analyzing Image...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Analyze Crop Health</span>
                  </>
                )}
              </button>

              <button
                onClick={handleClearImage}
                disabled={analyzing}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 font-semibold text-sm"
              >
                Choose Different Image
              </button>
            </div>
          </div>
        )}

        {/* DEMO QUICK PRESET SAMPLES */}
        {!analyzing && !result && (
          <div className="pt-4 border-t border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400 block mb-3 text-center sm:text-left">
              Or test with sample images for quick demo:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DEMO_SAMPLES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => loadSampleImage(sample.url)}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/30 text-left text-xs text-slate-300 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative bg-slate-950">
                    <img src={sample.url} alt={sample.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="font-medium group-hover:text-white truncate">{sample.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ANIMATED ANALYZING PROGRESS BAR */}
      {analyzing && (
        <div className="glass-panel p-8 rounded-3xl text-center space-y-6 animate-in fade-in duration-300">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-emerald-400">
              <Leaf className="w-8 h-8 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">AI Visual Pathology in Progress</h3>
            <p className="text-xs text-emerald-400 font-semibold">{steps[analysisStep]}</p>
          </div>

          <div className="w-full max-w-md mx-auto bg-slate-900 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
              style={{ width: `${((analysisStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* DIAGNOSIS RESULT CARD */}
      {result && (
        <div className="glass-panel p-6 sm:p-10 rounded-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 border-emerald-500/30">
          
          {/* TOP SUMMARY HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20">
                  {result.crop}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  result.confidence === "High" ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30" :
                  result.confidence === "Medium" ? "bg-amber-950 text-amber-300 border border-amber-500/30" :
                  "bg-rose-950 text-rose-300 border border-rose-500/30"
                }`}>
                  Confidence: {result.confidence}
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {result.disease}
              </h2>
            </div>

            {/* SEVERITY BADGE */}
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-sm font-extrabold ${
                result.severity === "Severe" || result.severity === "Critical"
                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                  : result.severity === "Moderate"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              }`}>
                <ShieldAlert className="w-5 h-5" />
                <span>Severity: {result.severity}</span>
              </div>
            </div>
          </div>

          {/* UNCERTAIN DIAGNOSIS WARNING */}
          {result.is_uncertain ? (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-3 text-amber-400 font-bold text-base">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <span>Unable to confidently identify the disease from this image.</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The image provided may be blurry, poorly lit, or does not clearly show characteristic symptoms on the leaf. Please capture a close-up photo under natural daylight or consult a qualified agricultural extension officer.
              </p>
            </div>
          ) : (
            /* DETAILED ANALYSIS CONTENT */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Visible Symptoms */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-amber-400" />
                  <span>Visible Symptoms</span>
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {result.symptoms.map((symptom, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{symptom}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Treatment */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-emerald-400" />
                  <span>Recommended Remedies</span>
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {result.treatment.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Long Term Prevention */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                  <span>Prevention & Control</span>
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {result.prevention.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}

          {/* DIAGNOSTIC SUMMARY & EXPERT DISCLAIMER */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <span className="font-bold text-white block mb-1">Diagnostic Summary:</span>
              <p>{result.summary}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 text-slate-400 text-xs flex items-center gap-3 border border-slate-800">
              <Info className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{result.disclaimer}</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
