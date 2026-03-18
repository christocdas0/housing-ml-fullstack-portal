# Setup Guide

This guide explains how to run every part of the Housing ML Fullstack Portal on your local machine, either natively or using Docker.

---

## Prerequisites

| Tool | Minimum Version | Check Command |
|------|----------------|---------------|
| Python | 3.12 | `python --version` |
| pip | 23+ | `pip --version` |
| Java | 21 | `java -version` |
| Maven (bundled) | 3.9 | `./mvnw --version` |
| Node.js | 18 | `node --version` |
| npm | 9 | `npm --version` |
| Docker | any recent | `docker --version` (optional) |

---

## Repository Layout (quick reference)

```
housing-ml-fullstack-portal/
├── datasets/                    ← shared CSV data
├── model-service/               ← Python FastAPI + scikit-learn (port 8000)
├── market-analysis-backend/     ← Java Spring Boot (port 8080)
└── portal/nextjs-portal/        ← Next.js frontend (port 3000)
```

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/<your-username>/housing-ml-fullstack-portal.git
cd housing-ml-fullstack-portal
```

---

## Step 2 — Run the ML Model Service (FastAPI)

The ML service provides the prediction API. It must be running before you use the Estimator app.

### Option A — Run Locally

```bash
# From the repo root
cd model-service

# Install Python dependencies
pip install -r requirements.txt

# Train the model (creates model.pkl and metrics.json)
python train_model.py

# Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is now live at **http://localhost:8000**  
Interactive Swagger UI: **http://localhost:8000/docs**

### Option B — Run via Docker

> **Important:** The Docker build must be run from the **repo root**, not from inside `model-service/`. This is because the Dockerfile copies the `datasets/` folder from the repo root.

```bash
# From the repo ROOT
docker build -t housing-model-api -f model-service/Dockerfile .

# Run the container
docker run -d -p 8000:8000 --name housing-model housing-model-api

# Check it's running
curl http://localhost:8000/health
```

To stop and remove:
```bash
docker stop housing-model
docker rm housing-model
```

### Verify It's Working

```bash
# Health check
curl http://localhost:8000/health
# Expected: {"status":"ok","model_loaded":true,"service":"Housing ML Model Service"}

# Model info
curl http://localhost:8000/model-info
# Expected: {"model_type":"Linear Regression","r2_score":0.9811,...}
```

---

## Step 3 — Run the Market Analysis API (Spring Boot)

The Spring Boot service reads the housing CSV at startup and serves market summary data.

```bash
# From the repo root
cd market-analysis-backend

# Windows
mvnw.cmd spring-boot:run

# macOS / Linux
./mvnw spring-boot:run
```

The API is now live at **http://localhost:8080**

### Verify It's Working

```bash
curl http://localhost:8080/market/summary
# Expected: {"average_price":283480.0,"property_count":50,"top_location":"City Center"}
```

> **Note:** The Spring Boot service does not have a Dockerfile yet. It runs locally only.

---

## Step 4 — Run the Next.js Portal

```bash
# From the repo root
cd portal/nextjs-portal

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

The portal is now live at **http://localhost:3000**

---

## Environment Variables (Optional)

By default, the Next.js app talks to `localhost:8000` (FastAPI) and `localhost:8080` (Spring Boot). To override these (e.g. when deploying to a server or using Docker):

Create a file called `.env.local` inside `portal/nextjs-portal/`:

```env
# portal/nextjs-portal/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MARKET_API_URL=http://localhost:8080
```

Change the values to your actual server addresses. This file is **not committed** to git (it's in `.gitignore` by Next.js convention).

---

## Running All Three Services at Once

Open **3 separate terminals** and run each command:

| Terminal | Directory | Command |
|----------|-----------|---------|
| 1 | `model-service/` | `uvicorn app.main:app --reload --port 8000` |
| 2 | `market-analysis-backend/` | `./mvnw spring-boot:run` |
| 3 | `portal/nextjs-portal/` | `npm run dev` |

Then open **http://localhost:3000** in your browser.

---

## Ports Used

| Service | Port | Can Be Changed? |
|---------|------|-----------------|
| Next.js Portal | 3000 | Yes — `npm run dev -- -p 3001` |
| FastAPI ML Service | 8000 | Yes — `--port 8001` in uvicorn command, update `.env.local` |
| Spring Boot Market API | 8080 | Yes — set `server.port=8081` in `application.properties`, update `.env.local` |

---

## Troubleshooting

### "model.pkl not found" when starting FastAPI
Run `python train_model.py` first. The model file is not committed to git.

### FastAPI starts but returns 503
The model failed to load at startup. Check the console logs — usually means `train_model.py` was not run or the CSV path is wrong.

### Spring Boot: "Could not find CSV file"
The CSV must be at `market-analysis-backend/src/main/resources/housing_dataset.csv`. It should already be there. If not, copy it from `datasets/housing_dataset.csv`.

### Next.js shows "API Offline" in Market Analysis
This is expected behaviour when Spring Boot is not running. The page falls back to mock data automatically. Start Spring Boot to see real data.

### Port 8080 is already in use
Check what's using it:
```bash
# Windows
netstat -ano | findstr :8080

# macOS/Linux
lsof -i :8080
```
Then either kill that process or change `server.port` in `application.properties`.

### Docker build fails: "COPY failed: file not found"
Make sure you run `docker build` from the **repo root**, not from `model-service/`:
```bash
# Correct:
docker build -t housing-model-api -f model-service/Dockerfile .

# Incorrect (will fail):
cd model-service && docker build -t housing-model-api .
```

---

## Building for Production

### Next.js

```bash
cd portal/nextjs-portal
npm run build
npm start
```

### FastAPI (Production Uvicorn)

```bash
cd model-service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Spring Boot (JAR)

```bash
cd market-analysis-backend
./mvnw package -DskipTests
java -jar target/market-analysis-0.0.1-SNAPSHOT.jar
```
