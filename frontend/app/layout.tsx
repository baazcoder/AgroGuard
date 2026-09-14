import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LanguageProvider } from "@/context/LanguageContext";
import { ActiveFarmProvider } from "@/context/ActiveFarmContext";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgroGuard | AI-Powered Crop Disease Diagnosis & Farm Assistant",
  description: "Production-quality AI farming platform providing instant crop leaf disease analysis via Gemini Vision API, weather alerts, market prices, and farming advice.",
  keywords: ["AgroGuard", "Agriculture AI", "Crop Disease Detection", "Gemini Vision", "Smart Farming", "Mandi Prices", "AgriTech"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.className} min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-white`}>
        <AuthProvider>
          <LanguageProvider>
            <ActiveFarmProvider>
              {/* Background Ambient Glow */}
              <div className="fixed inset-0 pointer-events-none radial-glow -z-10" />
              
              <Navbar />
              <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
                {children}
              </main>
              <Footer />
            </ActiveFarmProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
