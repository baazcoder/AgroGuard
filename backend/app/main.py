from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.database import engine, Base
from app.db import models
from app.routes import analyze, weather, market, advisor, chat, profile, economics, decision, farms, auth, satellite

from sqlalchemy import inspect, text

# Create DB tables
Base.metadata.create_all(bind=engine)

def run_migrations():
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        if "farms" in tables:
            cols = {c["name"] for c in inspector.get_columns("farms")}
            with engine.begin() as conn:
                if "is_active" not in cols:
                    conn.execute(text("ALTER TABLE farms ADD COLUMN is_active BOOLEAN DEFAULT 0"))
                if "village_locality" not in cols:
                    conn.execute(text("ALTER TABLE farms ADD COLUMN village_locality VARCHAR DEFAULT ''"))
                if "district" not in cols:
                    conn.execute(text("ALTER TABLE farms ADD COLUMN district VARCHAR DEFAULT ''"))
                if "state" not in cols:
                    conn.execute(text("ALTER TABLE farms ADD COLUMN state VARCHAR DEFAULT ''"))
                if "country" not in cols:
                    conn.execute(text("ALTER TABLE farms ADD COLUMN country VARCHAR DEFAULT 'India'"))
                if "area_unit" not in cols:
                    conn.execute(text("ALTER TABLE farms ADD COLUMN area_unit VARCHAR DEFAULT 'acre'"))
        if "fields" in tables:
            cols = {c["name"] for c in inspector.get_columns("fields")}
            with engine.begin() as conn:
                if "farm_id" not in cols:
                    conn.execute(text("ALTER TABLE fields ADD COLUMN farm_id INTEGER DEFAULT 1"))
        if "farmer_profiles" in tables:
            cols = {c["name"] for c in inspector.get_columns("farmer_profiles")}
            with engine.begin() as conn:
                if "user_id" not in cols:
                    conn.execute(text("ALTER TABLE farmer_profiles ADD COLUMN user_id INTEGER"))
    except Exception as e:
        print(f"Migration check exception: {e}")

run_migrations()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AgroGuard AI Agricultural Intelligence Platform API"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(farms.router)
app.include_router(decision.router)
app.include_router(profile.router)
app.include_router(economics.router)
app.include_router(analyze.router)
app.include_router(weather.router)
app.include_router(market.router)
app.include_router(advisor.router)
app.include_router(chat.router)
app.include_router(satellite.router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint for checking backend server status."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "gemini_api_configured": bool(settings.GEMINI_API_KEY)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
