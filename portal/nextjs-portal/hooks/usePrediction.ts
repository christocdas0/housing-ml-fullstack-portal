/**
 * hooks/usePrediction.ts
 * =======================
 * Custom React hook that manages all prediction state.
 *
 * What is a custom hook?
 *   A custom hook is just a function that starts with "use" and uses
 *   React's built-in hooks (useState, useEffect) inside it.
 *   It lets us keep all prediction logic OUT of the UI components,
 *   making components cleaner and the logic reusable.
 *
 * This hook manages:
 *   - Form submission
 *   - Loading state (while waiting for API)
 *   - Error state (if API fails)
 *   - Prediction history (all past predictions in this session)
 */

"use client";

import { useState } from "react";
import { predictPrice, HouseFeatures, PredictionResponse } from "@/services/api";

// ─────────────────────────────────────────────────────────────────────────────
// TYPE — a single entry in the prediction history
// ─────────────────────────────────────────────────────────────────────────────

export interface PredictionRecord {
  id: number;                      // unique id (timestamp-based)
  timestamp: string;               // when the prediction was made
  features: HouseFeatures;         // input values used
  predicted_price: number;         // price returned by the model
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT FORM VALUES
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_FEATURES: HouseFeatures = {
  square_footage: 1500,
  bedrooms: 3,
  bathrooms: 2,
  year_built: 2000,
  lot_size: 6500,
  distance_to_city_center: 4.0,
  school_rating: 7.5,
};

// ─────────────────────────────────────────────────────────────────────────────
// THE HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function usePrediction() {
  // Form input values
  const [features, setFeatures] = useState<HouseFeatures>(DEFAULT_FEATURES);

  // Latest single prediction result
  const [result, setResult] = useState<PredictionResponse | null>(null);

  // All predictions made in this session (for the history table)
  const [history, setHistory] = useState<PredictionRecord[]>([]);

  // True while we are waiting for the API response
  const [loading, setLoading] = useState(false);

  // Error message if API call fails
  const [error, setError] = useState<string | null>(null);

  // ── Update a single form field ──────────────────────────────────────────────
  const updateFeature = (key: keyof HouseFeatures, value: number) => {
    setFeatures((prev) => ({ ...prev, [key]: value }));
  };

  // ── Submit prediction ──────────────────────────────────────────────────────
  const predict = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await predictPrice(features);
      setResult(response);

      // Add to history
      const record: PredictionRecord = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        features: { ...features },
        predicted_price: response.predicted_price,
      };
      setHistory((prev) => [record, ...prev]); // newest first

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  // ── Reset form ─────────────────────────────────────────────────────────────
  const reset = () => {
    setFeatures(DEFAULT_FEATURES);
    setResult(null);
    setError(null);
  };

  // ── Clear history ──────────────────────────────────────────────────────────
  const clearHistory = () => setHistory([]);

  return {
    features,
    result,
    history,
    loading,
    error,
    updateFeature,
    predict,
    reset,
    clearHistory,
  };
}
