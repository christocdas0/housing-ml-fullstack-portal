# API Reference

Complete reference for all HTTP endpoints across both backend services.

---

## Service 1 — ML Model Service (FastAPI)

**Base URL:** `http://localhost:8000`  
**Interactive Docs:** `http://localhost:8000/docs` (Swagger UI)  
**Alternative Docs:** `http://localhost:8000/redoc`

---

### GET /health

Check that the service is running and the model is loaded.

**Request:** No body required.

**Response `200 OK`:**
```json
{
  "status": "ok",
  "model_loaded": true,
  "service": "Housing ML Model Service"
}
```

**Example:**
```bash
curl http://localhost:8000/health
```

---

### GET /model-info

Returns the model type, the features it was trained on, and its evaluation metrics.

**Request:** No body required.

**Response `200 OK`:**
```json
{
  "model_type": "Linear Regression",
  "feature_columns": [
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating"
  ],
  "target_column": "price",
  "training_samples": 40,
  "test_samples": 10,
  "r2_score": 0.9811,
  "mae": 7916.2,
  "mse": 105617715.0,
  "rmse": 10277.05
}
```

**Metric explanations:**
| Metric | Value | Meaning |
|--------|-------|---------|
| R² Score | 0.9811 | Model explains 98.1% of price variance — excellent fit |
| MAE | $7,916 | Average prediction error of ~$8k |
| RMSE | $10,277 | Penalises large errors more — still low relative to price range |

---

### POST /predict

Predict the price of a single property.

**Request Body:**
```json
{
  "square_footage": 1850,
  "bedrooms": 3,
  "bathrooms": 2,
  "year_built": 1998,
  "lot_size": 7500,
  "distance_to_city_center": 5.6,
  "school_rating": 8.2
}
```

**Field Constraints:**

| Field | Type | Constraint | Description |
|-------|------|-----------|-------------|
| `square_footage` | float | > 0 | Total interior square footage |
| `bedrooms` | int | ≥ 1 | Number of bedrooms |
| `bathrooms` | float | > 0 | Number of bathrooms (0.5 increments) |
| `year_built` | int | 1800–2100 | Year the property was built |
| `lot_size` | float | > 0 | Lot size in square feet |
| `distance_to_city_center` | float | ≥ 0 | Distance in miles to city centre |
| `school_rating` | float | 0–10 | Local school quality rating |

**Response `200 OK`:**
```json
{
  "predicted_price": 268432.75,
  "input_features": {
    "square_footage": 1850,
    "bedrooms": 3,
    "bathrooms": 2.0,
    "year_built": 1998,
    "lot_size": 7500,
    "distance_to_city_center": 5.6,
    "school_rating": 8.2
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "square_footage": 1850,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 1998,
    "lot_size": 7500,
    "distance_to_city_center": 5.6,
    "school_rating": 8.2
  }'
```

**Error Responses:**
- `422 Unprocessable Entity` — validation failed (e.g. negative square footage)
- `503 Service Unavailable` — model not loaded at startup

---

### POST /predict/batch

Predict prices for multiple properties in a single request. The entire batch is processed in one `model.predict()` call for efficiency.

**Request Body:**
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

**Response `200 OK`:**
```json
{
  "total": 2,
  "predictions": [
    {
      "index": 0,
      "predicted_price": 241587.50,
      "input_features": { "square_footage": 1550, "bedrooms": 3, ... }
    },
    {
      "index": 1,
      "predicted_price": 348921.00,
      "input_features": { "square_footage": 2200, "bedrooms": 4, ... }
    }
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/predict/batch \
  -H "Content-Type: application/json" \
  -d @datasets/test_prediction_data.csv
```

> Tip: Use the 9 rows in `datasets/test_prediction_data.csv` for batch testing.

---

## Service 2 — Market Analysis API (Spring Boot)

**Base URL:** `http://localhost:8080`

> No Swagger UI. Test with curl or Postman.

---

### GET /market/summary

Returns aggregate statistics for the entire housing dataset.

**Request:** No body required.

**Response `200 OK`:**
```json
{
  "average_price": 283480.0,
  "property_count": 50,
  "top_location": "City Center"
}
```

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `average_price` | double | Mean price across all 50 properties |
| `property_count` | int | Total number of properties in dataset |
| `top_location` | string | Neighbourhood with the highest average price |

**Example:**
```bash
curl http://localhost:8080/market/summary
```

---

### GET /market/average-price

Alias for `/market/summary`. Returns the same response. Used by the frontend as a connectivity ping.

```bash
curl http://localhost:8080/market/average-price
```

---

### GET /market/top-locations

Returns all neighbourhood groups, sorted by average price (highest first).

**Request:** No body required.

**Response `200 OK`:**
```json
[
  {
    "location": "City Center",
    "average_price": 312500.0,
    "property_count": 9
  },
  {
    "location": "Midtown",
    "average_price": 291800.0,
    "property_count": 14
  },
  {
    "location": "Suburbs North",
    "average_price": 278400.0,
    "property_count": 12
  },
  {
    "location": "Suburbs South",
    "average_price": 261200.0,
    "property_count": 11
  },
  {
    "location": "Countryside",
    "average_price": 238700.0,
    "property_count": 4
  }
]
```

**Location Mapping** (derived from `distance_to_city_center`):

| Distance Range | Neighbourhood |
|----------------|--------------|
| < 3 miles | City Center |
| 3 – 6 miles | Midtown |
| 6 – 9 miles | Suburbs North |
| 9 – 12 miles | Suburbs South |
| 12+ miles | Countryside |

**Example:**
```bash
curl http://localhost:8080/market/top-locations
```

---

### GET /market/properties

Returns all 50 individual properties from the dataset.

**Request:** No body required.

**Response `200 OK`** (array of 50 objects):
```json
[
  {
    "id": 1,
    "location": "Midtown",
    "sqft": 1250,
    "beds": 2,
    "baths": 1.0,
    "year": 1985,
    "price": 185000.0
  },
  {
    "id": 2,
    "location": "Suburbs North",
    "sqft": 1850,
    "beds": 3,
    "baths": 2.0,
    "year": 1998,
    "price": 265000.0
  }
  // ... 48 more
]
```

**Example:**
```bash
curl http://localhost:8080/market/properties
```

---

### POST /market/predict

Proxies a house price prediction request through the Java backend to the Python FastAPI ML service.
This endpoint satisfies the interview requirement: **"Java backend: integrate with the ML model from Task 1"**.

The What-If analysis tool on the Market Analysis dashboard uses this endpoint.

**Request Body:** Same 7 house features as `POST /predict` on FastAPI.

```json
{
  "square_footage": 1550,
  "bedrooms": 3,
  "bathrooms": 2.0,
  "year_built": 1997,
  "lot_size": 6800,
  "distance_to_city_center": 4.1,
  "school_rating": 7.6
}
```

**Response `200 OK`:**
```json
{
  "predicted_price": 241587.50,
  "input_features": {
    "square_footage": 1550,
    "bedrooms": 3,
    "bathrooms": 2.0,
    "year_built": 1997,
    "lot_size": 6800,
    "distance_to_city_center": 4.1,
    "school_rating": 7.6
  }
}
```

**Error Responses:**
- `503 Service Unavailable` — FastAPI ML service is not reachable

**Internal flow:**
```
POST /market/predict (Java :8080)
  └─► POST /predict/ (FastAPI :8000)
        └─► sklearn model.predict()
        ◄── { predicted_price: 241587.50 }
  ◄── { predicted_price: 241587.50 }
```

**Docker note:** Inside Docker, Java reaches FastAPI via `http://model-service:8000` (the Docker service name), not `localhost:8000`. This is configured via the `ML_SERVICE_URL` environment variable in `docker-compose.yml`.

**Example:**
```bash
curl -X POST http://localhost:8080/market/predict \
  -H "Content-Type: application/json" \
  -d '{
    "square_footage": 1550,
    "bedrooms": 3,
    "bathrooms": 2.0,
    "year_built": 1997,
    "lot_size": 6800,
    "distance_to_city_center": 4.1,
    "school_rating": 7.6
  }'
```

---

## Dataset Reference

The source data (`datasets/housing_dataset.csv`) has these columns:

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| `id` | int | 1 | Dropped during ML training |
| `square_footage` | int | 1850 | Interior sq ft |
| `bedrooms` | int | 3 | |
| `bathrooms` | float | 2.0 | 0.5 increments |
| `year_built` | int | 1998 | |
| `lot_size` | int | 7500 | Sq ft (not used by Spring Boot, used by ML) |
| `distance_to_city_center` | float | 5.6 | Miles |
| `school_rating` | float | 8.2 | 0–10 scale (not used by Spring Boot, used by ML) |
| `price` | int | 265000 | Target variable |

**Dataset stats:** 50 rows, price range $160,000 – $410,000, no missing values.

---

## Frontend API Functions (services/api.ts)

The Next.js app calls these through the service layer:

```typescript
// FastAPI calls
predictPrice(features: HouseFeatures)    → POST /predict
predictBatch(houses: HouseFeatures[])    → POST /predict/batch
getModelInfo()                           → GET  /model-info
getHealth()                              → GET  /health

// Spring Boot calls
getMarketSummary()                       → GET  /market/average-price
getTopLocations()                        → GET  /market/top-locations
getMarketProperties()                    → GET  /market/properties
```

All functions throw `Error` objects with the API's error message on non-2xx responses.

API base URLs are configured in `portal/nextjs-portal/lib/config.ts` and read from environment variables:
- `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`)
- `NEXT_PUBLIC_MARKET_API_URL` (default: `http://localhost:8080`)
