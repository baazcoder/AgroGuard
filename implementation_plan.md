# Implementation Plan - AgroGuard AI Farming Assistant

AgroGuard is a production-quality MVP web application for an AI-powered agricultural platform designed for hackathon demonstration. It features AI-based crop disease diagnosis using Gemini Vision, local weather insights, market price monitoring, crop advisory, and a conversational AI farming assistant.

## User Review Required

> [!IMPORTANT]
> **Gemini API Key Setup**: For full live testing of image diagnosis and AI chat, `GEMINI_API_KEY` can be set in `backend/.env`. When no key is provided, the backend will return structured fallback response data so all UI features can still be demonstrated smoothly during review/testing.

> [!NOTE]
> **Tech Stack Choice**: Frontend will be built using Next.js 14+ (App Router) with React, TypeScript, Tailwind CSS, Lucide React icons, and Framer Motion. Backend will be built with FastAPI (Python) using `google-genai` SDK, Pydantic schemas, and Uvicorn.

---

## Proposed Architecture & Structure

```
c:\Users\sandh\OneDrive\Documents\Desktop\AgroGuard\
├── frontend/                     # Next.js App Router Frontend
│   ├── app/                      # Next App Pages & Layouts
│   │   ├── page.tsx              # Dashboard
│   │   ├── disease-detection/    # Crop Disease Detection & Diagnosis Page
│   │   ├── weather/              # Agricultural Weather & Forecast Page
│   │   ├── market/               # Mandi Market Prices Page
│   │   ├── crop-advisor/         # AI Crop Planning & Advisory Page
│   │   ├── chat/                 # AI Farming Assistant Chat Page
│   │   ├── layout.tsx            # Navigation Header & Sidebar / Footer Layout
│   │   └── globals.css           # Global Styles & Tailwind Config
│   ├── components/               # UI Components
│   │   ├── Navbar.tsx            # Main Navigation Bar
│   │   ├── Sidebar.tsx           # Mobile / Desktop Navigation
│   │   ├── ImageUploader.tsx     # Drag & Drop Crop Image Selector
│   │   ├── AnalysisResultCard.tsx# Structured Result View (Crop, Disease, Severity, Symptoms, Treatment)
│   │   ├── WeatherWidget.tsx     # Weather Card Component
│   │   ├── MarketTicker.tsx      # Mandi Price Card/Table Component
│   │   └── ChatBox.tsx           # Interactive AI Chat Component
│   ├── lib/                      # API client helpers & utilities
│   │   └── api.ts                # Axios/fetch service connecting to FastAPI backend
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── backend/                      # FastAPI Python Backend
│   ├── app/
│   │   ├── main.py               # FastAPI application entry point & CORS configuration
│   │   ├── config.py             # Settings & Environment Variable loader
│   │   ├── routes/
│   │   │   ├── analyze.py        # POST /api/analyze-crop
│   │   │   ├── weather.py        # GET /api/weather
│   │   │   ├── market.py         # GET /api/market
│   │   │   ├── advisor.py        # POST /api/crop-advisor
│   │   │   └── chat.py           # POST /api/chat
│   │   ├── services/
│   │   │   ├── gemini_service.py # Gemini Vision & Chat Multimodal Integration
│   │   │   ├── weather_service.py# Modular Weather Service (OpenWeather ready)
│   │   │   └── market_service.py # Modular Mandi Price Service
│   │   ├── schemas/              # Pydantic Request & Response Data Models
│   │   │   ├── analysis.py       # Diagnosis Pydantic schema (Crop, Disease, Confidence, Severity, etc.)
│   │   │   ├── weather.py        # Weather response schema
│   │   │   ├── market.py         # Mandi price schema
│   │   │   └── chat.py           # Chat request/response schema
│   │   └── utils/
│   │       └── image_validation.py# Upload file validator (MIME, file size limit)
│   ├── requirements.txt          # fastapi, uvicorn, google-genai, pydantic, python-dotenv, python-multipart
│   └── run.py                    # Server launcher
│
├── .env.example                  # Template for frontend & backend env vars
└── README.md                     # Comprehensive Setup & Architecture Guide
```

---

## Proposed Changes

### Backend (FastAPI)

#### [NEW] [backend/requirements.txt](file:///c:/Users/sandh/OneDrive/Documents/Desktop/AgroGuard/backend/requirements.txt)
- Dependencies: `fastapi`, `uvicorn[standard]`, `google-genai`, `pydantic`, `python-dotenv`, `python-multipart`, `httpx`.

#### [NEW] [backend/app/config.py](file:///c:/Users/sandh/OneDrive/Documents/Desktop/AgroGuard/backend/app/config.py)
- Manages environment variable `GEMINI_API_KEY`, API host, port, and CORS origins.

#### [NEW] [backend/app/schemas/analysis.py](file:///c:/Users/sandh/OneDrive/Documents/Desktop/AgroGuard/backend/app/schemas/analysis.py)
- Pydantic schema for structured output: `crop`, `disease`, `confidence` (`High` | `Medium` | `Low` | `Uncertain`), `severity` (`Mild` | `Moderate` | `Severe` | `Critical` | `None`), `symptoms` (list of strings), `treatment` (list of strings), `prevention` (list of strings), `is_uncertain` (boolean), `summary` (string), `disclaimer` (string).

#### [NEW] [backend/app/services/gemini_service.py](file:///c:/Users/sandh/OneDrive/Documents/Desktop/AgroGuard/backend/app/services/gemini_service.py)
- Implementation of Gemini Vision API call using structured JSON format.
- System prompt enforcing agricultural expert guidelines, strictly forbidding hallucinated diseases when images are blurry/unclear.
- Chat service using Gemini 2.5 / 1.5 model for agricultural context Q&A.

#### [NEW] [backend/app/routes/analyze.py](file:///c:/Users/sandh/OneDrive/Documents/Desktop/AgroGuard/backend/app/routes/analyze.py)
- Endpoint `POST /api/analyze-crop`: receives `UploadFile`, validates MIME type (JPG, PNG, WEBP) and size (<= 10MB), passes image buffer to `gemini_service`, returns Pydantic diagnosis response.

#### [NEW] [backend/app/routes/weather.py](file:///c:/Users/sandh/OneDrive/Documents/Desktop/AgroGuard/backend/app/routes/weather.py), [market.py](file:///c:/Users/sandh/OneDrive/Documents/Desktop/AgroGuard/backend/app/routes/market.py), [advisor.py](file:///c:/Users/sandh/OneDrive/Documents/Desktop/AgroGuard/backend/app/routes/advisor.py), [chat.py](file:///c:/Users/sandh/OneDrive/Documents/Desktop/AgroGuard/backend/app/routes/chat.py)
- Endpoints for agricultural services:
  - `GET /api/weather?lat={lat}&lon={lon}`
  - `GET /api/market?crop={crop}&location={location}`
  - `POST /api/crop-advisor`
  - `POST /api/chat`

#### [NEW] [backend/app/main.py](file:///c:/Users/sandh/OneDrive/Documents/Desktop/AgroGuard/backend/app/main.py)
- FastAPI application initialization, CORS middleware setup allowing `http://localhost:3000` (Next.js), health check endpoint `GET /api/health`, and router inclusions.

---

### Frontend (Next.js 14 / Tailwind CSS)

#### [NEW] [frontend/app/page.tsx](file:///c:/Users/sandh/OneDrive/Documents/Desktop/AgroGuard/frontend/app/page.tsx)
- Modern Dashboard featuring:
  - Hero section with gradient background & primary CTA button for crop analysis.
  - Live geolocation badge & quick weather overview card.
  - Feature highlights grid (Disease Detection, Market Prices, Crop Advisory, AI Chatbot).
  - Sample recent analysis preview.

#### [NEW] [frontend/app/disease-detection/page.tsx](file:///c:/Users/sandh/OneDrive/Documents/Desktop/AgroGuard/frontend/app/disease-detection/page.tsx)
- Disease Detection workspace:
  - File drag-and-drop zone with instant image preview.
  - Sample test images trigger for fast hackathon demo testing.
  - Analyzing state with animated progress and step indicators (Uploading -> Extracting Visual Features -> Gemini Analysis -> Generating Guidance).
  - Diagnosis Result Card displaying Severity badge, Confidence score, Visual Symptoms list, Actionable Treatment steps, Prevention tips, and Expert disclaimer.

#### [NEW] [frontend/app/weather/page.tsx](file:///c:/Users/sandh/OneDrive/Documents/Desktop/AgroGuard/frontend/app/weather/page.tsx)
- Weather Insights Page with Browser Geolocation integration, 5-day agricultural weather forecast, rain probability, wind, humidity, and custom farming advisories.

#### [NEW] [frontend/app/market/page.tsx](file:///c:/Users/sandh/OneDrive/Documents/Desktop/AgroGuard/frontend/app/market/page.tsx)
- Mandi & Market Prices Page with crop search, state/district filters, market price cards, trends indicator, and price comparison table.

#### [NEW] [frontend/app/crop-advisor/page.tsx](file:///c:/Users/sandh/OneDrive/Documents/Desktop/AgroGuard/frontend/app/crop-advisor/page.tsx)
- Crop Planning Advisor UI: season selection, soil type, water availability input -> AI recommendations for optimal crop selection and high yield advice.

#### [NEW] [frontend/app/chat/page.tsx](file:///c:/Users/sandh/OneDrive/Documents/Desktop/AgroGuard/frontend/app/chat/page.tsx)
- AI Farming Assistant Chat interface with quick prompt chips, streaming/formatted responses, code/list rendering, and agricultural context awareness.

---

## Verification Plan

### Automated Verification
1. **Backend Initialization**:
   - Run `python -m uvicorn app.main:app --port 8000` or `python run.py`.
   - Test health check: `curl http://localhost:8000/api/health`.
   - Test analyze crop endpoint via Python script or HTTP POST test with sample image file.
2. **Frontend Build & Execution**:
   - Run `npm run build` inside `frontend/` to ensure zero TypeScript or Next.js build errors.
   - Run `npm run dev` to serve frontend at `http://localhost:3000`.

### Manual Verification Flow
1. Open Dashboard (`http://localhost:3000/`).
2. Navigate to "Disease Detection" (`/disease-detection`).
3. Upload a sample crop leaf image or pick a demo sample image.
4. Click "Analyze Crop" and observe loading states and step animations.
5. Verify response renders cleanly in the Diagnosis Result Card (Crop, Disease, Symptoms, Severity, Treatment, Prevention).
6. Verify Geolocation and Weather Page (`/weather`).
7. Verify Market Mandi Prices Page (`/market`).
8. Test Crop Advisor (`/crop-advisor`) and AI Chat Assistant (`/chat`).
