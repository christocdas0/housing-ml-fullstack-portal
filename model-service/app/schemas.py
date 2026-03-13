"""
app/schemas.py
==============
Pydantic models that define the shape of API request and response data.

Think of schemas as "contracts":
  - They describe exactly what JSON the API expects (request)
  - They describe exactly what JSON the API returns (response)
  - FastAPI uses them to auto-validate incoming data and auto-generate Swagger docs

Author : Christo
"""

from pydantic import BaseModel, Field
from typing import List


# ─────────────────────────────────────────────────────────────────────────────
# REQUEST SCHEMAS  (what the client sends TO the API)
# ─────────────────────────────────────────────────────────────────────────────

class HouseFeatures(BaseModel):
    """
    Input features for a single house price prediction.

    Every field has:
      - A type (float / int)
      - A description (shown in Swagger UI)
      - An example value
    """

    square_footage: float = Field(
        ...,
        gt=0,
        description="Total living area of the house in square feet.",
        examples=[1550],
    )
    bedrooms: int = Field(
        ...,
        ge=1,
        description="Number of bedrooms.",
        examples=[3],
    )
    bathrooms: float = Field(
        ...,
        gt=0,
        description="Number of bathrooms (0.5 increments allowed, e.g. 1.5 = 1 full + 1 half).",
        examples=[2],
    )
    year_built: int = Field(
        ...,
        ge=1800,
        le=2100,
        description="The year the house was built.",
        examples=[1997],
    )
    lot_size: float = Field(
        ...,
        gt=0,
        description="Size of the lot (land) in square feet.",
        examples=[6800],
    )
    distance_to_city_center: float = Field(
        ...,
        ge=0,
        description="Distance from the house to the city center in miles.",
        examples=[4.1],
    )
    school_rating: float = Field(
        ...,
        ge=0,
        le=10,
        description="Rating of the nearest school (0 = lowest, 10 = highest).",
        examples=[7.6],
    )

    # Swagger example shown in the docs UI
    model_config = {
        "json_schema_extra": {
            "example": {
                "square_footage": 1550,
                "bedrooms": 3,
                "bathrooms": 2,
                "year_built": 1997,
                "lot_size": 6800,
                "distance_to_city_center": 4.1,
                "school_rating": 7.6,
            }
        }
    }


class BatchPredictionRequest(BaseModel):
    """
    Request body for batch predictions — send multiple houses at once.
    """

    data: List[HouseFeatures] = Field(
        ...,
        description="A list of house feature objects to predict prices for.",
        min_length=1,
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "data": [
                    {
                        "square_footage": 1550,
                        "bedrooms": 3,
                        "bathrooms": 2,
                        "year_built": 1997,
                        "lot_size": 6800,
                        "distance_to_city_center": 4.1,
                        "school_rating": 7.6,
                    },
                    {
                        "square_footage": 2200,
                        "bedrooms": 4,
                        "bathrooms": 2.5,
                        "year_built": 2008,
                        "lot_size": 9600,
                        "distance_to_city_center": 7.0,
                        "school_rating": 8.8,
                    },
                ]
            }
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# RESPONSE SCHEMAS  (what the API sends BACK to the client)
# ─────────────────────────────────────────────────────────────────────────────

class PredictionResponse(BaseModel):
    """
    Response for a single house price prediction.
    """

    predicted_price: float = Field(
        ...,
        description="Predicted house price in USD.",
        examples=[238500.00],
    )
    input_features: HouseFeatures = Field(
        ...,
        description="The input features that were used to generate this prediction.",
    )


class BatchPredictionItem(BaseModel):
    """
    A single item inside a batch prediction response.
    """

    index: int = Field(..., description="Zero-based index of this item in the batch.")
    predicted_price: float = Field(..., description="Predicted house price in USD.")
    input_features: HouseFeatures


class BatchPredictionResponse(BaseModel):
    """
    Response for a batch prediction request.
    """

    total: int = Field(..., description="Total number of predictions returned.")
    predictions: List[BatchPredictionItem]


class ModelInfoResponse(BaseModel):
    """
    Response for the GET /model-info endpoint.
    """

    model_type: str = Field(..., description="Type/name of the ML model.")
    feature_columns: List[str] = Field(..., description="Features the model was trained on.")
    target_column: str = Field(..., description="The column the model predicts.")
    training_samples: int = Field(..., description="Number of samples used for training.")
    test_samples: int = Field(..., description="Number of samples used for evaluation.")
    r2_score: float = Field(..., description="R² score — how well the model fits (1.0 = perfect).")
    mae: float = Field(..., description="Mean Absolute Error in USD.")
    mse: float = Field(..., description="Mean Squared Error.")
    rmse: float = Field(..., description="Root Mean Squared Error in USD.")


class HealthResponse(BaseModel):
    """
    Response for the GET /health endpoint.
    """

    status: str = Field(..., description="'ok' if the service is healthy.", examples=["ok"])
    model_loaded: bool = Field(..., description="True if the ML model is loaded in memory.")
    service: str = Field(..., description="Name of this service.", examples=["Housing ML Model Service"])
