"""
app/main.py
===========
FastAPI application entry point.

This is where:
  - The FastAPI app is created
  - CORS middleware is added (so the Next.js frontend can call this API)
  - All routers (predict, health, model-info) are registered
  - Startup / shutdown events are defined

How to run:
  From the model-service/ directory:
    uvicorn app.main:app --reload --port 8000

Swagger UI (interactive docs):
  http://localhost:8000/docs

ReDoc (alternative docs):
  http://localhost:8000/redoc

Author : Christo
"""

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.model_loader import load_model, load_metrics
from app.routes import predict, health, model_info

# ─────────────────────────────────────────────────────────────────────────────
# ENVIRONMENT VARIABLES
# ─────────────────────────────────────────────────────────────────────────────

# Load variables from .env file (if it exists)
load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# LOGGING SETUP
# ─────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# FASTAPI APP INSTANCE
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Housing Price Prediction API",
    description="""
## Housing Price Prediction — ML Model Service

This API exposes a trained **Linear Regression** model that predicts
house prices based on property features.

### Available Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/predict/` | POST | Predict price for a single house |
| `/predict/batch` | POST | Predict prices for multiple houses |
| `/model-info` | GET | Model type and evaluation metrics |
| `/health` | GET | Service health check |

### How to use
1. Send house features (size, bedrooms, bathrooms, etc.) to `/predict/`
2. Receive the predicted price in USD

### Tech Stack
- **Framework**: FastAPI
- **ML Library**: scikit-learn
- **Model**: Linear Regression
- **Python**: 3.12
    """,
    version="1.0.0",
    contact={
        "name": "Christo",
    },
    license_info={
        "name": "MIT",
    },
)


# ─────────────────────────────────────────────────────────────────────────────
# CORS MIDDLEWARE
# ─────────────────────────────────────────────────────────────────────────────
# CORS = Cross-Origin Resource Sharing
# This allows the Next.js frontend (running on a different port/domain)
# to call this API without the browser blocking the request.

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,   # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],              # allow GET, POST, etc.
    allow_headers=["*"],              # allow all headers
)


# ─────────────────────────────────────────────────────────────────────────────
# STARTUP / SHUTDOWN EVENTS
# ─────────────────────────────────────────────────────────────────────────────
# lifespan is the modern FastAPI way to run code on startup and shutdown.
# The model is loaded ONCE here, then reused for all requests.

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── STARTUP ──
    logger.info("Starting Housing ML Model Service ...")
    try:
        load_model()
        load_metrics()
        logger.info("Model and metrics loaded. API is ready.")
    except FileNotFoundError as e:
        logger.error(str(e))
        logger.error("API will start but /predict will return 503 until model is loaded.")

    yield  # API runs here

    # ── SHUTDOWN ──
    logger.info("Shutting down Housing ML Model Service.")

# Attach lifespan to the app
app.router.lifespan_context = lifespan


# ─────────────────────────────────────────────────────────────────────────────
# REGISTER ROUTERS
# ─────────────────────────────────────────────────────────────────────────────
# Each router is a group of related endpoints defined in routes/

app.include_router(predict.router)       # POST /predict, POST /predict/batch
app.include_router(health.router)        # GET  /health
app.include_router(model_info.router)    # GET  /model-info


# ─────────────────────────────────────────────────────────────────────────────
# ROOT ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Root"], summary="API root")
async def root():
    """Welcome endpoint — confirms the API is running."""
    return {
        "message" : "Housing Price Prediction API is running.",
        "docs"    : "http://localhost:8000/docs",
        "health"  : "http://localhost:8000/health",
        "version" : "1.0.0",
    }
