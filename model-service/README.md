# Housing Price Prediction — ML Model Service

A **Python FastAPI** microservice that serves a **Linear Regression** model trained to predict house prices based on property features.

---

## Table of Contents

- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Setup — Step by Step](#setup--step-by-step)
- [API Endpoints](#api-endpoints)
- [Running with Docker](#running-with-docker)
- [How the Model Works](#how-the-model-works)
- [Dataset](#dataset)

---

## Architecture

```
Client (Next.js)
      │
      │  HTTP JSON requests
      ▼
┌─────────────────────────────┐
│   FastAPI Application       │
│   app/main.py               │
│                             │
│  ┌─────────────────────┐    │
│  │ POST /predict       │    │
│  │ POST /predict/batch │    │
│  │ GET  /model-info    │    │
│  │ GET  /health        │    │
│  └─────────────────────┘    │
│           │                 │
│           ▼                 │
│   model_loader.py           │
│   (loads model.pkl once)    │
│           │                 │
│           ▼                 │
│   LinearRegression Model    │
│   (scikit-learn)            │
└─────────────────────────────┘
```

---

## Folder Structure

```
model-service/
│
├── train_model.py          ← Run this first to train and save the model
├── model.pkl               ← Generated after running train_model.py
├── metrics.json            ← Generated after running train_model.py
├── requirements.txt        ← Python dependencies
├── Dockerfile              ← Docker container definition
├── .env                    ← Environment variables (local dev)
├── .gitignore
│
└── app/
    ├── __init__.py
    ├── main.py             ← FastAPI app entry point
    ├── model_loader.py     ← Loads model.pkl into memory at startup
    ├── schemas.py          ← Pydantic request/response models
    │
    └── routes/
        ├── __init__.py
        ├── predict.py      ← POST /predict, POST /predict/batch
        ├── health.py       ← GET /health
        └── model_info.py   ← GET /model-info
```

---

## Prerequisites

- Python 3.10 or higher installed
- pip (comes with Python)

---

## Setup — Step by Step

### Step 1 — Navigate to model-service folder

```bash
cd model-service
```

### Step 2 — Create a virtual environment

A virtual environment keeps this project's dependencies isolated from other Python projects on your machine.

```bash
# Create the virtual environment
python -m venv venv

# Activate it (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Activate it (Mac / Linux)
source venv/bin/activate
```

You will see `(venv)` in your terminal prompt when it is active.

### Step 3 — Install dependencies

```bash
pip install -r requirements.txt
```

### Step 4 — Train the model

This reads the dataset, trains the model, and saves `model.pkl` and `metrics.json`.

```bash
python train_model.py
```

Expected output:
```
============================================================
  Housing Price Prediction — Model Training
============================================================

[1/6] Loading dataset ...
[2/6] Validating data ...
[3/6] Preparing features and target ...
[4/6] Splitting data into train and test sets ...
[5/6] Training Linear Regression model ...
[6/6] Evaluating model on test set ...

      R² Score  : 0.9998  (1.0 = perfect, >0.85 = good)
      MAE       : $xxx.xx
      RMSE      : $xxx.xx

      Model saved → model.pkl
      Metrics saved → metrics.json

============================================================
  Training complete! You can now start the API.
  Run: uvicorn app.main:app --reload --port 8000
============================================================
```

### Step 5 — Start the API

```bash
uvicorn app.main:app --reload --port 8000
```

- `--reload` means the server automatically restarts when you change code (development mode)
- Remove `--reload` in production

### Step 6 — Open Swagger UI

Open your browser at: [http://localhost:8000/docs](http://localhost:8000/docs)

You will see an interactive API documentation page where you can test every endpoint.

---

## API Endpoints

### `GET /health`

Check if the service is running.

**Response:**
```json
{
  "status": "ok",
  "model_loaded": true,
  "service": "Housing ML Model Service"
}
```

---

### `GET /model-info`

Returns model details and evaluation metrics.

**Response:**
```json
{
  "model_type": "Linear Regression",
  "feature_columns": ["square_footage", "bedrooms", "bathrooms", "year_built", "lot_size", "distance_to_city_center", "school_rating"],
  "target_column": "price",
  "training_samples": 40,
  "test_samples": 10,
  "r2_score": 0.9998,
  "mae": 450.20,
  "mse": 312400.0,
  "rmse": 559.0
}
```

---

### `POST /predict`

Predict the price of a single house.

**Request body:**
```json
{
  "square_footage": 1550,
  "bedrooms": 3,
  "bathrooms": 2,
  "year_built": 1997,
  "lot_size": 6800,
  "distance_to_city_center": 4.1,
  "school_rating": 7.6
}
```

**Response:**
```json
{
  "predicted_price": 238500.00,
  "input_features": { ... }
}
```

---

### `POST /predict/batch`

Predict prices for multiple houses in one request.

**Request body:**
```json
{
  "data": [
    {
      "square_footage": 1550,
      "bedrooms": 3,
      "bathrooms": 2,
      "year_built": 1997,
      "lot_size": 6800,
      "distance_to_city_center": 4.1,
      "school_rating": 7.6
    },
    {
      "square_footage": 2200,
      "bedrooms": 4,
      "bathrooms": 2.5,
      "year_built": 2008,
      "lot_size": 9600,
      "distance_to_city_center": 7.0,
      "school_rating": 8.8
    }
  ]
}
```

**Response:**
```json
{
  "total": 2,
  "predictions": [
    { "index": 0, "predicted_price": 238500.00, "input_features": { ... } },
    { "index": 1, "predicted_price": 372000.00, "input_features": { ... } }
  ]
}
```

---

## Running with Docker

Make sure Docker Desktop is installed and running.

### Build the Docker image

```bash
# Run from the housing-ml-fullstack-portal/ root directory
# -f points to the Dockerfile location
# . (dot) sets the build context to the project root so Docker can see both
#   datasets/ and model-service/ folders
docker build -t housing-model-api -f model-service/Dockerfile .
```

### Run the container

```bash
docker run -p 8000:8000 housing-model-api
```

### Access the API

[http://localhost:8000/docs](http://localhost:8000/docs)

---

## How the Model Works

### Algorithm — Linear Regression

Linear Regression finds the best-fit line (or hyperplane in multiple dimensions) through the training data.

The model learns the formula:
```
price = (w1 × square_footage) + (w2 × bedrooms) + ... + (w7 × school_rating) + intercept
```

Where `w1, w2, ... w7` are **weights (coefficients)** learned from the training data.

### Why Linear Regression?

- Simple, fast, and interpretable
- Works well when features have a roughly linear relationship with the target
- A good **baseline model** before trying complex algorithms

### Evaluation Metrics

| Metric | Meaning |
|--------|---------|
| **R²** | How much variance the model explains. 1.0 = perfect. |
| **MAE** | Average dollar error per prediction |
| **RMSE** | Like MAE but penalises large errors more heavily |

---

## Dataset

Located at: `datasets/housing_dataset.csv`

| Column | Description |
|--------|-------------|
| `square_footage` | Total living area in sq ft |
| `bedrooms` | Number of bedrooms |
| `bathrooms` | Number of bathrooms |
| `year_built` | Year the house was constructed |
| `lot_size` | Land area in sq ft |
| `distance_to_city_center` | Miles from city center |
| `school_rating` | Nearby school quality score (0–10) |
| `price` | **Target** — house price in USD |

---

*Part of the Housing ML Fullstack Portal project.*
