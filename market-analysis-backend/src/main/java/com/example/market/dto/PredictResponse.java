package com.example.market.dto;

/**
 * PredictResponse
 * ===============
 * Response body returned from POST /market/predict.
 * Mirrors the PredictionResponse Pydantic schema in the Python FastAPI service.
 *
 * Example:
 * {
 *   "predicted_price": 287500.00,
 *   "input_features": { ... }
 * }
 */
public record PredictResponse(
        double         predicted_price,
        PredictRequest input_features
) {}
