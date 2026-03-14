/**
 * app/market-analysis/page.tsx
 * =============================
 * Property Market Analysis dashboard — route "/market-analysis"
 *
 * This page connects to the Java Spring Boot backend (port 8080).
 * It shows:
 *   - Summary stat cards (average price, property count, top location)
 *   - Average price by location bar chart
 *   - Properties by bedroom count bar chart
 *   - Sortable, filterable properties table with CSV export
 *
 * While Spring Boot is not yet running, it uses realistic mock data
 * so the UI is fully visible and testable.
 */

"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { BarChart2, Download, MapPin, Home, DollarSign } from "lucide-react";
import { config } from "@/lib/config";
// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface MarketSummary {
  average_price: number;
  property_count: number;
  top_location: string;
}

interface LocationPrice {
  location: string;
  average_price: number;
  property_count: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA (used when Spring Boot API is not running)
// Replace with real API calls once Spring Boot is ready
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_SUMMARY: MarketSummary = {
  average_price: 287500,
  property_count: 50,
  top_location: "Lakewood",
};

const MOCK_LOCATIONS: LocationPrice[] = [
  { location: "Lakewood",    average_price: 342000, property_count: 12 },
  { location: "Riverside",   average_price: 298000, property_count: 10 },
  { location: "Greenfield",  average_price: 275000, property_count: 9  },
  { location: "Maplewood",   average_price: 261000, property_count: 8  },
  { location: "Brookside",   average_price: 245000, property_count: 11 },
];

const MOCK_PROPERTIES = [
  { id: 1, location: "Lakewood",   sqft: 2100, beds: 4, baths: 2.5, price: 345000, year: 2005 },
  { id: 2, location: "Riverside",  sqft: 1850, beds: 3, baths: 2,   price: 265000, year: 1998 },
  { id: 3, location: "Greenfield", sqft: 1420, beds: 3, baths: 2,   price: 210000, year: 1992 },
  { id: 4, location: "Maplewood",  sqft: 1700, beds: 3, baths: 2,   price: 275000, year: 2001 },
  { id: 5, location: "Brookside",  sqft: 980,  beds: 2, baths: 1,   price: 165000, year: 1978 },
  { id: 6, location: "Lakewood",   sqft: 2400, beds: 4, baths: 3,   price: 410000, year: 2010 },
  { id: 7, location: "Riverside",  sqft: 1600, beds: 3, baths: 1.5, price: 225000, year: 1995 },
  { id: 8, location: "Greenfield", sqft: 2200, beds: 4, baths: 2.5, price: 375000, year: 2008 },
];

const COLORS = ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];
const formatCurrency = (v: number) => `$${(v / 1000).toFixed(0)}k`;
const formatFull = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function MarketAnalysisPage() {
  const [summary]    = useState<MarketSummary>(MOCK_SUMMARY);
  const [locations]  = useState<LocationPrice[]>(MOCK_LOCATIONS);
  const [properties, setProperties] = useState(MOCK_PROPERTIES);
  const [filter, setFilter]         = useState("");
  const [sortKey, setSortKey]       = useState<"price" | "sqft" | "year">("price");
  const [sortDir, setSortDir]       = useState<"asc" | "desc">("desc");
  const [apiStatus, setApiStatus]   = useState<"checking" | "online" | "offline">("checking");

  // Check if Spring Boot API is reachable
  useEffect(() => {
    fetch(`${config.marketApiUrl}/market/average-price`)
      .then(() => setApiStatus("online"))
      .catch(() => setApiStatus("offline"));
  }, []);

  // Filter + sort
  const displayed = properties
    .filter((p) =>
      filter === "" || p.location.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) =>
      sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]
    );

  // Toggle sort
  const handleSort = (key: "price" | "sqft" | "year") => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  // Export to CSV
  const exportCSV = () => {
    const headers = ["ID", "Location", "Sq Ft", "Bedrooms", "Bathrooms", "Year", "Price"];
    const rows = displayed.map((p) =>
      [p.id, p.location, p.sqft, p.beds, p.baths, p.year, p.price].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "market_data.csv"; a.click();
  };

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-violet-100 text-violet-600 p-2 rounded-lg">
              <BarChart2 size={20} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Property Market Analysis
            </h1>
          </div>
          <p className="text-slate-500 text-sm ml-11">
            Market insights powered by the Java Spring Boot backend.
          </p>
        </div>

        {/* API status badge */}
        <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
          apiStatus === "online"    ? "bg-green-100 text-green-700"  :
          apiStatus === "offline"   ? "bg-amber-100 text-amber-700"  :
                                      "bg-slate-100 text-slate-500"
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            apiStatus === "online"  ? "bg-green-500" :
            apiStatus === "offline" ? "bg-amber-500" : "bg-slate-400"
          }`} />
          {apiStatus === "online" ? "Spring Boot API Online" :
           apiStatus === "offline" ? "Using Mock Data (Spring Boot offline)" :
           "Checking API..."}
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: DollarSign, label: "Average Price",    value: formatFull(summary.average_price), color: "violet" },
          { icon: Home,       label: "Total Properties", value: summary.property_count.toString(),  color: "sky"    },
          { icon: MapPin,     label: "Top Location",     value: summary.top_location,               color: "emerald"},
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-md border border-slate-100 p-5">
            <div className={`inline-flex p-2 rounded-lg mb-3 bg-${color}-100 text-${color}-600`}>
              <Icon size={18} />
            </div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Average Price by Location */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 mb-4">Average Price by Location</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={locations} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis type="category" dataKey="location" tick={{ fontSize: 12, fill: "#64748b" }} width={90} />
              <Tooltip
                formatter={(v: number) => formatFull(v)}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
              />
              <Bar dataKey="average_price" radius={[0, 6, 6, 0]} name="Avg Price">
                {locations.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Property Count by Location */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 mb-4">Property Count by Location</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={locations}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="location" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
              <Bar dataKey="property_count" radius={[6, 6, 0, 0]} name="Properties">
                {locations.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Properties Table ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800">Properties</h3>
            <p className="text-xs text-slate-400">{displayed.length} properties shown</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {/* Filter */}
            <input
              type="text"
              placeholder="Filter by location..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 sm:w-52 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            {/* Export CSV */}
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3 cursor-pointer hover:text-violet-600" onClick={() => handleSort("sqft")}>
                  Sq Ft {sortKey === "sqft" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
                <th className="px-4 py-3">Beds</th>
                <th className="px-4 py-3">Baths</th>
                <th className="px-4 py-3 cursor-pointer hover:text-violet-600" onClick={() => handleSort("year")}>
                  Year {sortKey === "year" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
                <th className="px-4 py-3 text-right cursor-pointer hover:text-violet-600" onClick={() => handleSort("price")}>
                  Price {sortKey === "price" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700">{p.location}</td>
                  <td className="px-4 py-3">{p.sqft.toLocaleString()}</td>
                  <td className="px-4 py-3">{p.beds}</td>
                  <td className="px-4 py-3">{p.baths}</td>
                  <td className="px-4 py-3">{p.year}</td>
                  <td className="px-4 py-3 text-right font-bold text-violet-700">{formatFull(p.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
