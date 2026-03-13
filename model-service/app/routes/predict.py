"""
app/routes/predict.py
=====================
Handles price prediction endpoints.

Endpoints:
  POST /predict        — predict price for a single house
  POST /batch-predict  — predict prices for multiple houses at once

How it works:
  1. Client sends house features as JSON
  2. FastAPI validates the input using schemas.py (auto)
  3. We convert the input to a format sklearn understands (a 2D list)
  4. We call model.predict() to get the predicted price
  5. We return the price as JSON

Author : Christo
"""

import pandas as pd
from fastapi import APIRouter, HTTPException

from app.schemas import (
    HouseFeatures,
    BatchPredictionRequest,
    PredictionResponse,
    BatchPredictionResponse,
    BatchPredictionItem,
)
from app.model_loader import get_model, get_metrics

# APIRouter groups related endpoints together.
# The prefix "/predict" means every route here starts with /predict.
router = APIRouter(
    prefix="/predict",
    tags=["Predictions"],   # groups endpoints in Swagger UI
)

# The feature order MUST match the order used during training in train_model.py
FEATURE_COLUMNS = [
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
]


def house_features_to_dataframe(features: HouseFeatures) -> pd.DataFrame:
    """
    Convert a HouseFeatures Pydantic object into a pandas DataFrame
    that sklearn's predict() method expects.

    sklearn.predict() needs a 2D array: [[f1, f2, f3, ...]]
    We use a DataFrame so column names are preserved and order is explicit.
    """
    data = {
        "square_footage"          : [features.square_footage],
        "bedrooms"                : [features.bedrooms],
        "bathrooms"               : [features.bathrooms],
        "year_built"              : [features.year_built],
        "lot_size"                : [features.lot_size],
        "distance_to_city_center" : [features.distance_to_city_center],
        "school_rating"           : [features.school_rating],
    }
    return pd.DataFrame(data, columns=FEATURE_COLUMNS)


# ─────────────────────────────────────────────────────────────────────────────
# POST /predict  — Single prediction
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=PredictionResponse,
    summary="Predict house price",
    description="""
Submit house features and receive a predicted market price.

**Input fields:**
- `square_footage` — size of the house in sq ft
- `bedrooms` — number of bedrooms
- `bathrooms` — number of bathrooms (0.5 increments ok)
- `year_built` — construction year
- `lot_size` — land area in sq ft
- `distance_to_city_center` — miles from city center
- `school_rating` — nearby school quality (0–10)

**Returns:** predicted price in USD
    """,
)
async def predict_single(features: HouseFeatures) -> PredictionResponse:
    """Predict the price of a single house."""
    try:
        model = get_model()
        input_df = house_features_to_dataframe(features)

        # model.predict() returns a numpy array → take the first (only) element
        predicted_price = float(model.predict(input_df)[0])

        return PredictionResponse(
            predicted_price=round(predicted_price, 2),
            input_features=features,
        )

    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /predict/batch  — Batch prediction
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/batch",
    response_model=BatchPredictionResponse,
    summary="Batch predict house prices",
    description="""
Submit a list of houses and receive predicted prices for all of them in one call.

Useful for comparing multiple properties at once.
    """,
)
async def predict_batch(request: BatchPredictionRequest) -> BatchPredictionResponse:
    """Predict prices for multiple houses in a single request."""
    try:
        model = get_model()

        # Build a single DataFrame with all houses — more efficient than
        # calling predict() once per house
        rows = []
        for house in request.data:
            rows.append({
                "square_footage"          : house.square_footage,
                "bedrooms"                : house.bedrooms,
                "bathrooms"               : house.bathrooms,
                "year_built"              : house.year_built,
                "lot_size"                : house.lot_size,
                "distance_to_city_center" : house.distance_to_city_center,
                "school_rating"           : house.school_rating,
            })

        batch_df = pd.DataFrame(rows, columns=FEATURE_COLUMNS)

        # Predict all at once
        predictions_array = model.predict(batch_df)

        # Build the response list
        results = []
        for i, (house, price) in enumerate(zip(request.data, predictions_array)):
            results.append(
                BatchPredictionItem(
                    index=i,
                    predicted_price=round(float(price), 2),
                    input_features=house,
                )
            )

        return BatchPredictionResponse(
            total=len(results),
            predictions=results,
        )

    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")
