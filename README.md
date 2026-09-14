# 🌾 AgroGuard — AI-Powered Intelligence for Smarter Farming

AgroGuard is a production-quality MVP web application built for university hackathon demonstration. It provides farmers with instant AI-powered crop leaf disease diagnosis via **Google Gemini Vision API**, hyper-local agricultural weather alerts, live mandi market price tracking, crop advisory, and a conversational AI farming assistant.

---

## 🌟 Key Features

1. **Crop Disease Detection (`/disease-detection`)**:
   - Upload leaf photos via drag & drop or built-in test sample triggers.
   - Powered by Gemini 2.5 Vision multimodal zero-shot pathology analysis.
   - Structured diagnostic output: Crop Name, Disease, Confidence Score, Severity Rating, Visible Symptoms, Recommended Remedies, and Long-Term Prevention tips.
   - Handles blurry/unclear images with an explicit "Uncertain Diagnosis" warning.

2. **Dashboard (`/`)**:
   - Hero welcome banner and instant CTA for crop analysis.
   - Live location & farm microclimate status badge.
   - Core service cards and Mandi market snapshot table.

3. **Agricultural Weather & Forecast (`/weather`)**:
   - One-click browser geolocation (`navigator.geolocation`) or manual city search.
   - Microclimate parameters: Temperature, Humidity, Wind speed, Rain probability, UV index.
   - Agricultural risk advisories (dew point fungal spore germination warnings, spray window advice).
   - 5-Day forecast cards.

4. **Mandi Market Prices (`/market`)**:
   - State and crop search filter for Indian commodity mandis.
   - Displays Min Price, Max Price, Modal Price (₹/Quintal), Price Trends (UP, DOWN, STABLE), and date.

5. **AI Crop Advisor (`/crop-advisor`)**:
   - Input farm region, season (Rabi, Kharif, Zaid), soil texture, and water availability.
   - AI generates tailored crop recommendation cards with suitability scores and market outlooks.

6. **AI Farming Assistant Chat (`/chat`)**:
   - Conversational Q&A interface for agricultural queries.
   - Quick prompt chips for fast access to common farmer questions.

7. **My Farm Satellite Monitoring (`/my-farm`)**:
   - Interactive GIS map for drawing custom farm boundaries (GeoJSON polygons) or picking pre-configured farm locations.
   - Dual imagery visualizer: High-res Esri World Imagery Satellite True Color overlay & Sentinel-2 NDVI vegetation heatmap.
   - Sentinel-2 Process API integration calculating real-time NDVI vegetation index score `(NIR - RED) / (NIR + RED)`.
   - Comprehensive vegetation analytics: Mean, Min, Max NDVI, Farm Health status, Cloud Coverage %, observation timestamp, and risk alerts.
   - AgroGuard AI Farm Intelligence engine generating tailored farming action items based on satellite observations.

---

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS v4, Leaflet GIS (`react-leaflet`, `leaflet-draw`), Lucide React Icons, Framer Motion.
- **Backend**: Python 3.13, FastAPI, Uvicorn, Pydantic v2 schemas, REST API architecture.
- **AI & Remote Sensing Engine**: Google Gemini API (`google-genai` SDK & `google-generativeai` fallback) and Sentinel Hub OAuth Process API.

---

## 📁 Project Structure

```
AgroGuard/
├── frontend/                     # Next.js App Router Frontend
│   ├── app/                      # Next.js Pages & Layouts
│   │   ├── page.tsx              # Dashboard Page
│   │   ├── my-farm/              # Satellite Farm Monitoring & Boundary Drawing Page
│   │   ├── farm-map/             # Interactive Farm Mapping Page
│   │   ├── disease-detection/    # Crop Disease Detection & Result Page
│   │   ├── weather/              # Agricultural Weather & Alert Page
│   │   ├── market/               # Mandi Market Prices Page
│   │   ├── crop-advisor/         # AI Crop Planning Page
│   │   ├── chat/                 # AI Assistant Chat Page
│   │   ├── layout.tsx            # Navigation Header & Footer Layout
│   │   └── globals.css           # Global Styling & Glassmorphic Utilities
│   ├── components/               # Navbar, Footer & Satellite Map Components
│   ├── lib/                      # REST API client (`api.ts`)
│   └── package.json
│
├── backend/                      # FastAPI Python Backend
│   ├── app/
│   │   ├── main.py               # FastAPI App & CORS Setup
│   │   ├── config.py             # Settings Loader
│   │   ├── routes/               # REST Endpoints (/api/analyze-crop, /api/satellite, etc.)
│   │   ├── services/             # Gemini Vision, Weather, Mandi & Satellite Services
│   │   ├── schemas/              # Pydantic Response Validation Models
│   │   └── utils/                # Image Upload File Validator
│   ├── requirements.txt          # Python Dependencies
│   └── run.py                    # Server Entrypoint Launcher
│
├── .env.example                  # Template for Environment Configuration
└── README.md                     # Documentation Guide
```

---

## ⚙️ Quick Setup & Execution Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

---

### Step 1: Start Backend (FastAPI)

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. (Optional) Configure Gemini & Sentinel Hub API Keys:
   Create a `.env` file inside `backend/` directory:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   SENTINEL_HUB_CLIENT_ID=your_sentinel_hub_client_id_here
   SENTINEL_HUB_CLIENT_SECRET=your_sentinel_hub_client_secret_here
   PORT=8000
   ```
   *Note: If Sentinel Hub credentials are unconfigured or if a cloud-free satellite pass is unavailable, the backend automatically enters **Graceful Demo Fallback Mode** with deterministic satellite imagery and vegetation health analytics so all UI flows remain operational.*

4. Launch the FastAPI server:
   ```bash
   python run.py
   ```
   The backend REST API will start at **`http://localhost:8000`**. You can verify API status by opening **`http://localhost:8000/api/health`**.

---

### Step 2: Start Frontend (Next.js)

1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Launch the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open **`http://localhost:3000`** in your web browser.

---

## 📡 REST API Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend status & API readiness |
| `POST` | `/api/analyze-crop` | Upload leaf image for Gemini Vision diagnosis |
| `POST` | `/api/satellite` | GeoJSON polygon farm satellite NDVI & vegetation health analysis |
| `GET` | `/api/weather` | Fetch farm microclimate weather & warnings |
| `GET` | `/api/market` | Fetch regional Mandi commodity prices |
| `POST` | `/api/crop-advisor` | Receive AI crop planning recommendations |
| `POST` | `/api/chat` | Conversational Q&A with AI Farming Assistant |

---

## 🛡️ License

MIT License — Built for Hackathon demonstration.

