from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config import settings
from backend.api.routes import homes, appliances, maintenance, agent

app = FastAPI(
    title="HomeManager API",
    description="AI-powered home maintenance management platform",
    version="0.1.0",
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(homes.router, prefix="/api/v1")
app.include_router(appliances.router, prefix="/api/v1")
app.include_router(maintenance.router, prefix="/api/v1")
app.include_router(agent.router, prefix="/api/v1")


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "0.1.0"}
