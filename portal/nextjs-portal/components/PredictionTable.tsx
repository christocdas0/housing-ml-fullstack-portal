/**
 * components/PredictionTable.tsx
 * ================================
 * Displays the history of all predictions made in this session
 * as a sortable, readable table.
 */

"use client";

import { PredictionRecord } from "@/hooks/usePrediction";
import { Trash2 } from "lucide-react";

interface PredictionTableProps {
  history: PredictionRecord[];
  onClear: () => void;
}

// Format a number as USD currency  e.g. 325000 → "$325,000"
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export default function PredictionTable({ history, onClear }: PredictionTableProps) {
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100 text-center">
        <p className="text-slate-400 text-sm">
          No predictions yet. Fill in the form and click <strong>Predict Price</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800">Prediction History</h3>
          <p className="text-xs text-slate-400">{history.length} prediction{history.length !== 1 ? "s" : ""} this session</p>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
        >
          <Trash2 size={14} />
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Sq Ft</th>
              <th className="px-4 py-3">Beds</th>
              <th className="px-4 py-3">Baths</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">School</th>
              <th className="px-4 py-3 text-right text-sky-600">Predicted Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-slate-400">{record.timestamp}</td>
                <td className="px-4 py-3 font-medium">{record.features.square_footage.toLocaleString()}</td>
                <td className="px-4 py-3">{record.features.bedrooms}</td>
                <td className="px-4 py-3">{record.features.bathrooms}</td>
                <td className="px-4 py-3">{record.features.year_built}</td>
                <td className="px-4 py-3">{record.features.school_rating}</td>
                <td className="px-4 py-3 text-right font-bold text-sky-700">
                  {formatCurrency(record.predicted_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
