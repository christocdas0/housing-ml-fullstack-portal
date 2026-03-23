# Housing ML Fullstack Portal

A full-stack housing analytics platform combining machine learning, a Python microservice, a Java REST API, and a unified Next.js portal

---

## What This Project Does

Two independent apps live under one Next.js portal:

| Application | What It Does | Backend |
|-------------|-------------|---------|
| **Property Value Estimator** | Enter property details via 7 sliders → instant ML price prediction → bar/line charts + history table | Python FastAPI (port 8000) |
| **Property Market Analysis** | Interactive dashboard → market stats, location charts, filterable/sortable table, CSV export | Java Spring Boot (port 8080) |

Both connect to a **scikit-learn Linear Regression model** trained on housing data (R² = 0.98).

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    Browser  (port 3000)                          │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │               Next.js Portal  (App Router)               │   │
│   │                                                          │   │
│   │   /                → Home / Landing Page                 │   │
│   │   /estimator       → Property Value Estimator            │   │
│   │   /market-analysis → Property Market Analysis            │   │
│   └──────────┬──────────────────────────┬────────────────────┘   │
└──────────────┼──────────────────────────┼────────────────────────┘
               │ fetch()                   │ fetch()
               ▼                           ▼
  ┌─────────────────────────┐   ┌──────────────────────────────┐
  │  Python FastAPI         │   │  Java Spring Boot            │
  │  ML Model Service       │   │  Market Analysis API         │
  │  port 8000              │   │  port 8080                   │
  │                         │   │                              │
  │  POST /predict          │   │  GET /market/summary         │
  │  POST /predict/batch    │   │  GET /market/top-locations   │
  │  GET  /model-info       │   │  GET /market/properties      │
  │  GET  /health           │   │  GET /market/average-price   │
  │                         │   │  POST /market/predict ───┐   │
  │  LinearRegression model │   │  In-memory CSV processing │   │
  └──────────▲──────────────┘   └──────────────────────────┼──┘
             │ Trained on                  proxies to       │
  ┌──────────────────────┐                                  │
  │  housing_dataset.csv │◄─────────────────────────────────┘
  │  50 properties       │  (Java calls FastAPI internally)
  └──────────────────────┘
```

**How a prediction works (Estimator):**
1. User moves sliders in the Estimator → frontend calls `POST /predict` on FastAPI directly
2. FastAPI runs `sklearn model.predict()` → returns `predicted_price`
3. Frontend displays the price and adds it to the history chart

**How market data works:**
1. Spring Boot reads `housing_dataset.csv` at startup → holds 50 properties in memory
2. Frontend calls `/market/properties`, `/summary`, `/top-locations`
3. Dashboard renders Recharts charts + a filterable, sortable table

**How What-If analysis works (Market page):**
1. User adjusts sliders → frontend calls `POST /market/predict` on **Java Spring Boot**
2. Java receives the request and proxies it to `POST /predict` on FastAPI internally
3. FastAPI runs the ML model → returns price → Java forwards it back to the frontend
4. This satisfies the requirement: *"Java backend: integrate with the ML model from Task 1"*

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js | 16.1.6 |
| Frontend | React | 19.2.3 |
| Styling | Tailwind CSS | 4 |
| Charts | Recharts | 3 |
| Icons | Lucide React | latest |
| ML / Python backend | Python | 3.12+ |
| ML / Python backend | FastAPI + Uvicorn | 0.111+ |
| ML / Python backend | scikit-learn | 1.4+ |
| Market / Java backend | Java | 21 |
| Market / Java backend | Spring Boot | 3.5.x |
| Containerisation | Docker | any recent |

---

## Project Structure

```
housing-ml-fullstack-portal/
│
├── datasets/
│   ├── housing_dataset.csv          ← 50 properties, used for training + market API
│   └── test_prediction_data.csv     ← 9 rows without price (for batch prediction testing)
│
├── model-service/                   ← Task 1: Python FastAPI + ML model
│   ├── Dockerfile                   ← Build from repo ROOT (see Quick Start)
│   ├── requirements.txt
│   ├── train_model.py               ← Trains model, saves model.pkl + metrics.json
│   ├── metrics.json                 ← Auto-generated: R²=0.9811, MAE=$7,916
│   └── app/
│       ├── main.py                  ← FastAPI app, CORS, startup model loading
│       ├── model_loader.py          ← Singleton: loads model once at startup
│       ├── schemas.py               ← Pydantic v2 request/response models
│       └── routes/
│           ├── predict.py           ← POST /predict, POST /predict/batch
│           ├── model_info.py        ← GET /model-info
│           └── health.py            ← GET /health
│
├── market-analysis-backend/         ← Task 3: Java Spring Boot REST API
│   ├── pom.xml                      ← Spring Boot 3.5, Java 21
│   └── src/main/java/com/example/market/
│       ├── MarketAnalysisApplication.java
│       ├── controller/MarketController.java    ← 4 GET endpoints
│       ├── service/MarketService.java          ← CSV parsing + aggregation
│       └── dto/
│           ├── PropertyDto.java     ← id, location, sqft, beds, baths, year, price
│           ├── MarketSummary.java   ← avg price, count, top location
│           └── LocationPrice.java  ← location, avg price, property count
│
├── portal/nextjs-portal/            ← Task 2: Next.js Multi-App Portal
│   ├── app/
│   │   ├── layout.tsx               ← Root layout: Navbar + max-width wrapper
│   │   ├── page.tsx                 ← Landing page: hero + app cards + tech stack
│   │   ├── estimator/page.tsx       ← Property Value Estimator
│   │   └── market-analysis/page.tsx ← Market Analysis Dashboard
│   ├── components/
│   │   ├── Navbar.tsx               ← Sticky dark nav, active link highlight
│   │   ├── PredictionForm.tsx       ← 7 slider inputs for all model features
│   │   ├── PredictionTable.tsx      ← Scrollable history table (newest first)
│   │   └── ChartView.tsx            ← Bar chart + line trend chart (Recharts)
│   ├── hooks/
│   │   └── usePrediction.ts         ← Custom hook: all prediction state + logic
│   ├── lib/
│   │   └── config.ts                ← API base URLs (env-configurable)
│   └── services/
│       └── api.ts                   ← All HTTP calls to FastAPI + Spring Boot
│
├── docs/
│   ├── SETUP_GUIDE.md               ← Step-by-step run instructions (local + Docker)
│   ├── API_REFERENCE.md             ← All endpoints with request/response examples
│
├── docker-compose.yml               ← One-command startup for all 3 services
└── README.md                        ← This file
```

---

## Quick Start

> **You need:** Python 3.12+, Java 21, Node.js 18+

Open **3 terminals** and run one command in each:

**Terminal 1 — ML Model Service**
```bash
cd model-service
pip install -r requirements.txt
python train_model.py
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Market Analysis API**
```bash
cd market-analysis-backend

# Windows
mvnw.cmd spring-boot:run

# macOS / Linux
./mvnw spring-boot:run
```

**Terminal 3 — Next.js Portal**
```bash
cd portal/nextjs-portal
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Running Everything with Docker

The repo includes Dockerfiles for all three services and a `docker-compose.yml` at the root for one-command startup.

### Option A — All services at once (recommended)

```bash
# From the repo root
docker compose up --build
```

- `--build` rebuilds images from source (required on first run or after code changes)
- Omit `--build` on subsequent runs to reuse cached images (faster)
- The portal will wait until both backends pass their health checks before starting

```bash
# Run in the background
docker compose up --build -d

# Stop everything
docker compose down

# View logs
docker compose logs -f

# View logs for one service
docker compose logs -f portal
```

### Option B — Build each service manually

```bash
# ML model service (must run from repo root — needs datasets/ folder)
docker build -t housing-model-service -f model-service/Dockerfile .
docker run -d -p 8000:8000 --name housing-model-service housing-model-service

# Spring Boot market API
docker build -t housing-market-api ./market-analysis-backend
docker run -d -p 8080:8080 --name housing-market-api housing-market-api

# Next.js portal
docker build -t housing-portal \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 \
  --build-arg NEXT_PUBLIC_MARKET_API_URL=http://localhost:8080 \
  ./portal/nextjs-portal
docker run -d -p 3000:3000 --name housing-portal housing-portal
```

> **Note:** The first build takes 5–10+ minutes (Maven downloads, Node modules, model training). Subsequent builds use Docker layer cache and are much faster.

---

## Service URLs

| Service | Local URL | API Docs |
|---------|-----------|----------|
| Next.js Portal | http://localhost:3000 | — |
| FastAPI ML Service | http://localhost:8000 | http://localhost:8000/docs |
| Spring Boot Market API | http://localhost:8080 | — |

---

## Live Demo Guide

Recommended order for a demo:

1. **Show the repo structure** — explain the three-service architecture
2. **FastAPI Swagger** → http://localhost:8000/docs
   - `GET /health` → confirm model is loaded
   - `GET /model-info` → show R²=0.9811, features, metrics
   - `POST /predict` → enter a house, get a price
   - `POST /predict/batch` → submit multiple houses
3. **Next.js Portal** → http://localhost:3000
   - Landing page: architecture overview
   - `/estimator`: move sliders → "Predict Price" → see result, chart, table
   - Do 3–4 predictions → watch bar chart + trend line update
   - `/market-analysis`: see real data from Spring Boot
   - Filter table by location → sort by price → "Export CSV"

---

## Detailed Documentation

| Document | What It Covers |
|----------|---------------|
| [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) | Full setup for local, Docker, env vars, port conflicts, troubleshooting |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Every endpoint — request body, response shape, curl examples, field constraints |


---

## Key Design Decisions

- Used Linear Regression as a baseline model for fast training and interpretability.
- Separated ML model service from frontend to follow microservice architecture.
- Used FastAPI for high performance async API handling.
- Implemented Spring Boot service to simulate a secondary backend with independent responsibilities.
- Used Next.js App Router for better routing and server/client component separation.

---

## Future Improvements

- Replace Linear Regression with advanced models (e.g. Random Forest)
- Add database instead of in-memory dataset
- Add authentication and role-based access
- Deploy services using Kubernetes
- Add caching (Redis) for market analytics

---

