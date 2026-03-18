/**
 * components/ComparisonView.tsx
 * ==============================
 * Side-by-side comparison of up to 4 saved predictions.
 *
 * Shows each property's features and predicted price in columns,
 * with a grouped bar chart comparing prices visually.
 */

"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import { X, GitCompare } from "lucide-react";
import { PredictionRecord } from "@/hooks/usePrediction";

interface ComparisonViewProps {
  comparison: PredictionRecord[];
  onRemove: (id: number) => void;
  onClear: () => void;
}

const formatFull = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const CARD_COLORS = ["#0ea5e9", "#7c3aed", "#10b981", "#f59e0b"];

const FEATURE_LABELS: { key: keyof PredictionRecord["features"]; label: string; format: (v: number) => string }[] = [
  { key: "square_footage",          label: "Sq Ft",           format: (v) => v.toLocaleString() },
  { key: "bedrooms",                label: "Bedrooms",        format: (v) => `${v}` },
  { key: "bathrooms",               label: "Bathrooms",       format: (v) => `${v}` },
  { key: "year_built",              label: "Year Built",      format: (v) => `${v}` },
  { key: "lot_size",                label: "Lot Size",        format: (v) => `${v.toLocaleString()} sq ft` },
  { key: "distance_to_city_center", label: "Distance",        format: (v) => `${v} mi` },
  { key: "school_rating",           label: "School Rating",   format: (v) => `${v} / 10` },
];

export default function ComparisonView({ comparison, onRemove, onClear }: ComparisonViewProps) {
  if (comparison.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 text-center">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <GitCompare size={28} className="text-sky-300" />
          <p className="text-sm font-medium text-slate-600">No properties added yet</p>
          <p className="text-xs text-slate-400">
            Predict a price above, then click <strong className="text-sky-600">Add to Compare</strong> to add it here.
            <br />You can compare up to 4 properties side by side.
          </p>
        </div>
      </div>
    );
  }

  // Chart data — one bar per property
  const chartData = comparison.map((rec, i) => ({
    name: `Prop ${i + 1}`,
    price: Math.round(rec.predicted_price),
    color: CARD_COLORS[i % CARD_COLORS.length],
  }));

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-sky-100 text-sky-600 p-2 rounded-lg">
            <GitCompare size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Property Comparison</h3>
            <p className="text-xs text-slate-400">{comparison.length} of 4 properties • side-by-side</p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-rose-500 hover:text-rose-700 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          Clear All
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Price bar chart */}
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
            <YAxis
              tickFormatter={(v) => typeof v === "number" ? `$${(v / 1000).toFixed(0)}k` : String(v)}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
            />
            <Tooltip
              formatter={(v) => [typeof v === "number" ? formatFull(v) : String(v ?? ""), "Predicted Price"]}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", color: "#1e293b" }}
            />
            <Bar dataKey="price" radius={[6, 6, 0, 0]} maxBarSize={80}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
              <LabelList
                dataKey="price"
                position="top"
                formatter={(v) => typeof v === "number" ? `$${(v / 1000).toFixed(0)}k` : String(v)}
                style={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Property columns */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${comparison.length}, minmax(0, 1fr))` }}>
          {comparison.map((rec, i) => {
            const color = CARD_COLORS[i % CARD_COLORS.length];
            const isHighest = rec.predicted_price === Math.max(...comparison.map((r) => r.predicted_price));
            return (
              <div
                key={rec.id}
                className="relative rounded-xl border-2 overflow-hidden"
                style={{ borderColor: color }}
              >
                {/* Column header */}
                <div
                  className="flex items-center justify-between px-3 py-2 text-white text-xs font-semibold"
                  style={{ backgroundColor: color }}
                >
                  <span>Property {i + 1}</span>
                  <div className="flex items-center gap-1.5">
                    {isHighest && comparison.length > 1 && (
                      <span className="bg-white/25 px-1.5 py-0.5 rounded-full text-[10px]">Highest</span>
                    )}
                    <button
                      onClick={() => onRemove(rec.id)}
                      className="hover:bg-white/20 rounded p-0.5 transition-colors"
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>

                {/* Predicted price */}
                <div className="px-3 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Predicted Price</p>
                  <p className="text-lg font-extrabold text-slate-800">{formatFull(rec.predicted_price)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{rec.timestamp}</p>
                </div>

                {/* Feature rows */}
                <div className="divide-y divide-slate-50">
                  {FEATURE_LABELS.map(({ key, label, format }) => (
                    <div key={key} className="flex justify-between items-center px-3 py-2">
                      <span className="text-[11px] text-slate-500">{label}</span>
                      <span className="text-[11px] font-semibold text-slate-700">{format(rec.features[key])}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
