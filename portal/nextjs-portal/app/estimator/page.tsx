/**
 * app/estimator/page.tsx
 * =======================
 * Property Value Estimator page — route "/estimator"
 *
 * Layout:
 *   Left column  → PredictionForm (input sliders)
 *   Right column → Result card + ChartView + PredictionTable
 *
 * All state is managed by the usePrediction hook.
 */

"use client";

import { usePrediction } from "@/hooks/usePrediction";
import PredictionForm from "@/components/PredictionForm";
import PredictionTable from "@/components/PredictionTable";
import ChartView from "@/components/ChartView";
import { TrendingUp, AlertCircle } from "lucide-react";

// Format number as USD currency
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export default function EstimatorPage() {
  const {
    features,
    result,
    history,
    loading,
    error,
    updateFeature,
    predict,
    reset,
    clearHistory,
  } = usePrediction();

  return (
    <div className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-sky-100 text-sky-600 p-2 rounded-lg">
            <TrendingUp size={20} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Property Value Estimator
          </h1>
        </div>
        <p className="text-slate-500 text-sm ml-11">
          Adjust the property details and click <strong>Predict Price</strong> to get
          an ML-powered price estimate.
        </p>
      </div>

      {/* ── Error Banner ────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <span className="ml-1 text-xs text-red-400">
            (Make sure the FastAPI server is running at localhost:8000)
          </span>
        </div>
      )}

      {/* ── Main Layout: Form | Results ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left — Form */}
        <div>
          <PredictionForm
            features={features}
            loading={loading}
            onUpdate={updateFeature}
            onSubmit={predict}
            onReset={reset}
          />
        </div>

        {/* Right — Result + Chart */}
        <div className="space-y-6">

          {/* Prediction Result Card */}
          {result ? (
            <div className="bg-gradient-to-br from-sky-600 to-sky-700 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-sky-200 text-sm font-medium mb-1">Predicted Price</p>
              <p className="text-4xl font-extrabold tracking-tight mb-4">
                {formatCurrency(result.predicted_price)}
              </p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-sky-200 text-xs">Sq Ft</p>
                  <p className="font-bold">{result.input_features.square_footage.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-sky-200 text-xs">Beds / Baths</p>
                  <p className="font-bold">
                    {result.input_features.bedrooms} / {result.input_features.bathrooms}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-sky-200 text-xs">School Rating</p>
                  <p className="font-bold">{result.input_features.school_rating} / 10</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 text-center">
              <div className="text-4xl mb-3">🏠</div>
              <p className="text-slate-500 text-sm">
                Your predicted price will appear here.
              </p>
            </div>
          )}

          {/* Charts */}
          <ChartView history={history} />
        </div>
      </div>

      {/* ── Prediction History Table ─────────────────────────────────── */}
      <PredictionTable history={history} onClear={clearHistory} />

    </div>
  );
}
