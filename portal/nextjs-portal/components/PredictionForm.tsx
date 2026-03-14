/**
 * components/PredictionForm.tsx
 * ==============================
 * Form component with 7 input fields for house features.
 * Receives state and handlers from the usePrediction hook via props.
 *
 * Each slider + number input is kept in sync with each other.
 */

"use client";

import { HouseFeatures } from "@/services/api";
import { Loader2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// FIELD CONFIG — defines every form field in one place
// ─────────────────────────────────────────────────────────────────────────────

const FIELDS: {
  key: keyof HouseFeatures;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  description: string;
}[] = [
  {
    key: "square_footage",
    label: "Square Footage",
    unit: "sq ft",
    min: 500,
    max: 5000,
    step: 50,
    description: "Total living area of the house",
  },
  {
    key: "bedrooms",
    label: "Bedrooms",
    unit: "rooms",
    min: 1,
    max: 10,
    step: 1,
    description: "Number of bedrooms",
  },
  {
    key: "bathrooms",
    label: "Bathrooms",
    unit: "rooms",
    min: 1,
    max: 6,
    step: 0.5,
    description: "Number of bathrooms (0.5 = half bath)",
  },
  {
    key: "year_built",
    label: "Year Built",
    unit: "year",
    min: 1950,
    max: 2025,
    step: 1,
    description: "Year the house was constructed",
  },
  {
    key: "lot_size",
    label: "Lot Size",
    unit: "sq ft",
    min: 1000,
    max: 20000,
    step: 100,
    description: "Size of the land/lot",
  },
  {
    key: "distance_to_city_center",
    label: "Distance to City Center",
    unit: "miles",
    min: 0.5,
    max: 30,
    step: 0.5,
    description: "Miles from the city center",
  },
  {
    key: "school_rating",
    label: "School Rating",
    unit: "/ 10",
    min: 1,
    max: 10,
    step: 0.1,
    description: "Nearby school quality score",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface PredictionFormProps {
  features: HouseFeatures;
  loading: boolean;
  onUpdate: (key: keyof HouseFeatures, value: number) => void;
  onSubmit: () => void;
  onReset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function PredictionForm({
  features,
  loading,
  onUpdate,
  onSubmit,
  onReset,
}: PredictionFormProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Property Details</h2>
      <p className="text-sm text-slate-500 mb-6">
        Adjust the sliders to match the property you want to value.
      </p>

      <div className="space-y-5">
        {FIELDS.map(({ key, label, unit, min, max, step, description }) => (
          <div key={key}>
            {/* Label row */}
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold text-slate-700">
                {label}
                <span className="ml-1 text-xs font-normal text-slate-400">
                  — {description}
                </span>
              </label>
              {/* Current value badge */}
              <span className="text-sm font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                {features[key]} {unit}
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={features[key]}
              onChange={(e) => onUpdate(key, parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-full accent-sky-500 cursor-pointer"
            />

            {/* Min / Max labels */}
            <div className="flex justify-between text-xs text-slate-400 mt-0.5">
              <span>{min}</span>
              <span>{max}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Predicting...
            </>
          ) : (
            "Predict Price"
          )}
        </button>

        <button
          onClick={onReset}
          disabled={loading}
          className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
