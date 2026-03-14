/**
 * services/api.ts
 * ================
 * All HTTP calls to the FastAPI ML backend are centralized here.
 * This means if the API URL changes, we only update it in ONE place.
 *
 * The FastAPI backend runs at: http://localhost:8000
 */

// ─────────────────────────────────────────────────────────────────────────────
// BASE URL  — sourced from lib/config.ts (reads from .env.local)
// ─────────────────────────────────────────────────────────────────────────────

import { config } from "@/lib/config";

const API_BASE_URL = config.mlApiUrl;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — match the FastAPI schemas exactly
// ─────────────────────────────────────────────────────────────────────────────

export interface HouseFeatures {
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
}

export interface PredictionResponse {
  predicted_price: number;
  input_features: HouseFeatures;
}

export interface BatchPredictionItem {
  index: number;
  predicted_price: number;
  input_features: HouseFeatures;
}

export interface BatchPredictionResponse {
  total: number;
  predictions: BatchPredictionItem[];
}

export interface ModelInfoResponse {
  model_type: string;
  feature_columns: string[];
  target_column: string;
  training_samples: number;
  test_samples: number;
  r2_score: number;
  mae: number;
  mse: number;
  rmse: number;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  service: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /predict
 * Send one house's features, receive predicted price.
 */
export async function predictPrice(
  features: HouseFeatures
): Promise<PredictionResponse> {
  const response = await fetch(`${API_BASE_URL}/predict/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(features),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Prediction failed.");
  }

  return response.json();
}

/**
 * POST /predict/batch
 * Send multiple houses, receive predictions for all.
 */
export async function predictBatch(
  houses: HouseFeatures[]
): Promise<BatchPredictionResponse> {
  const response = await fetch(`${API_BASE_URL}/predict/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: houses }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Batch prediction failed.");
  }

  return response.json();
}

/**
 * GET /model-info
 * Returns model type and evaluation metrics.
 */
export async function getModelInfo(): Promise<ModelInfoResponse> {
  const response = await fetch(`${API_BASE_URL}/model-info`);

  if (!response.ok) {
    throw new Error("Failed to fetch model info.");
  }

  return response.json();
}

/**
 * GET /health
 * Check if the API is alive.
 */
export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("Health check failed.");
  }

  return response.json();
}
