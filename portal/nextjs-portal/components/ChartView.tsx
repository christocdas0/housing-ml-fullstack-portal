/**
 * components/ChartView.tsx
 * =========================
 * Visualizes prediction history as a bar chart using Recharts.
 *
 * Shows predicted prices for the last 8 predictions side by side.
 * Also shows a feature impact bar chart for the current prediction.
 */

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { PredictionRecord } from "@/hooks/usePrediction";

interface ChartViewProps {
  history: PredictionRecord[];
}

const formatCurrency = (value: number) =>
  `$${(value / 1000).toFixed(0)}k`;

// Colours for bars
const COLORS = [
  "#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd",
  "#0284c7", "#0369a1", "#075985", "#0c4a6e",
];

export default function ChartView({ history }: ChartViewProps) {
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100 text-center">
        <p className="text-slate-400 text-sm">
          Chart will appear after your first prediction.
        </p>
      </div>
    );
  }

  // Take the last 8 predictions (most recent first, reverse for chart left-to-right)
  const chartData = [...history]
    .slice(0, 8)
    .reverse()
    .map((record, index) => ({
      name: `#${index + 1}`,
      price: Math.round(record.predicted_price),
      sqft: record.features.square_footage,
      beds: record.features.bedrooms,
    }));

  // Feature comparison for latest prediction
  const latest = history[0];
  const featureData = [
    { feature: "Sq Ft",    value: latest.features.square_footage,           max: 5000  },
    { feature: "Lot Size", value: latest.features.lot_size,                 max: 20000 },
    { feature: "Year",     value: latest.features.year_built - 1950,        max: 75    },
    { feature: "School",   value: latest.features.school_rating * 100,      max: 1000  },
    { feature: "Distance", value: latest.features.distance_to_city_center,  max: 30    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Predicted Price History Bar Chart ─────────────────────── */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-1">Price History</h3>
        <p className="text-xs text-slate-400 mb-4">Last {chartData.length} predictions</p>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
              }
              contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
            <Bar dataKey="price" radius={[6, 6, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Price Trend Line Chart ─────────────────────────────────── */}
      {history.length >= 2 && (
        <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-1">Price Trend</h3>
          <p className="text-xs text-slate-400 mb-4">How predictions changed over time</p>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip
                formatter={(value: number) =>
                  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
                }
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: "#0ea5e9", r: 4 }}
                activeDot={{ r: 6 }}
                name="Predicted Price"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}
