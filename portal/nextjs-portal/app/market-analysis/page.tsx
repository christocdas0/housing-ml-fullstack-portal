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
import { BarChart2, Download, FileText, MapPin, Home, DollarSign, Zap, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getMarketSummary,
  getTopLocations,
  getMarketProperties,
  marketPredictPrice,
  type MarketSummary,
  type LocationPrice,
  type MarketProperty,
  type HouseFeatures,
} from "@/services/api";
// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA (fallback when Spring Boot API is not running)
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

const DEFAULT_WHAT_IF: HouseFeatures = {
  square_footage: 1500,
  bedrooms: 3,
  bathrooms: 2,
  year_built: 2000,
  lot_size: 6500,
  distance_to_city_center: 4.0,
  school_rating: 7.5,
};

const WHAT_IF_FIELDS: {
  key: keyof HouseFeatures;
  label: string;
  min: number; max: number; step: number;
  format: (v: number) => string;
}[] = [
  { key: "square_footage",          label: "Square Footage",          min: 500,  max: 5000,  step: 50,  format: (v) => `${v.toLocaleString()} sq ft` },
  { key: "bedrooms",                label: "Bedrooms",                min: 1,    max: 10,    step: 1,   format: (v) => `${v}` },
  { key: "bathrooms",               label: "Bathrooms",               min: 1,    max: 6,     step: 0.5, format: (v) => `${v}` },
  { key: "year_built",              label: "Year Built",              min: 1950, max: 2025,  step: 1,   format: (v) => `${v}` },
  { key: "lot_size",                label: "Lot Size",                min: 1000, max: 20000, step: 100, format: (v) => `${v.toLocaleString()} sq ft` },
  { key: "distance_to_city_center", label: "Distance to City Center", min: 0.5,  max: 30,    step: 0.5, format: (v) => `${v} mi` },
  { key: "school_rating",           label: "School Rating",           min: 1,    max: 10,    step: 0.1, format: (v) => `${v} / 10` },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function MarketAnalysisPage() {
  const [summary,    setSummary]    = useState<MarketSummary>(MOCK_SUMMARY);
  const [locations,  setLocations]  = useState<LocationPrice[]>(MOCK_LOCATIONS);
  const [properties, setProperties] = useState<MarketProperty[]>(MOCK_PROPERTIES);
  const [filter, setFilter]         = useState("");
  const [sortKey, setSortKey]       = useState<"price" | "sqft" | "year">("price");
  const [sortDir, setSortDir]       = useState<"asc" | "desc">("desc");
  const [apiStatus, setApiStatus]   = useState<"checking" | "online" | "offline">("checking");

  // What-If tool state
  const [whatIfFeatures, setWhatIfFeatures] = useState<HouseFeatures>(DEFAULT_WHAT_IF);
  const [whatIfPrice,    setWhatIfPrice]    = useState<number | null>(null);
  const [whatIfLoading,  setWhatIfLoading]  = useState(false);
  const [whatIfError,    setWhatIfError]    = useState<string | null>(null);

  // Load real data from Spring Boot API; fall back to mock data if unavailable
  useEffect(() => {
    Promise.all([
      getMarketSummary(),
      getTopLocations(),
      getMarketProperties(),
    ])
      .then(([summaryData, locationsData, propertiesData]) => {
        setSummary(summaryData);
        setLocations(locationsData);
        setProperties(propertiesData);
        setApiStatus("online");
      })
      .catch(() => {
        // API offline — keep mock data already in state
        setApiStatus("offline");
      });
  }, []);

  // Filter + sort
  const displayed = properties
    .filter((p) =>
      filter === "" || p.location.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) =>
      sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]
    );

  // What-If predict — routes through Java Spring Boot → FastAPI (Task 1 integration)
  const runWhatIf = async () => {
    setWhatIfLoading(true);
    setWhatIfError(null);
    try {
      const res = await marketPredictPrice(whatIfFeatures);
      setWhatIfPrice(res.predicted_price);
    } catch {
      setWhatIfError("Could not reach the market API. Make sure Java (port 8080) and FastAPI (port 8000) are both running.");
    } finally {
      setWhatIfLoading(false);
    }
  };

  // Toggle sort
  const handleSort = (key: "price" | "sqft" | "year") => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  // Export to PDF
  const exportPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.setTextColor(109, 40, 217); // violet-700
    doc.text("Property Market Analysis Report", 14, 18);

    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

    // Summary stats
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("Market Summary", 14, 36);
    autoTable(doc, {
      startY: 40,
      head: [["Metric", "Value"]],
      body: [
        ["Average Price", formatFull(summary.average_price)],
        ["Total Properties", summary.property_count.toString()],
        ["Top Location",  summary.top_location],
      ],
      headStyles:  { fillColor: [109, 40, 217] },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      margin: { left: 14, right: 14 },
      tableWidth: 80,
    });

    // Location breakdown
    const afterSummary = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("Price by Location", 14, afterSummary);
    autoTable(doc, {
      startY: afterSummary + 4,
      head: [["Location", "Avg Price", "Properties"]],
      body: locations.map((l) => [l.location, formatFull(l.average_price), l.property_count.toString()]),
      headStyles: { fillColor: [109, 40, 217] },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      margin: { left: 14, right: 14 },
    });

    // Properties table (filtered/sorted)
    const afterLocations = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(`Properties (${displayed.length} shown)`, 14, afterLocations);
    autoTable(doc, {
      startY: afterLocations + 4,
      head: [["Location", "Sq Ft", "Beds", "Baths", "Year", "Price"]],
      body: displayed.map((p) => [
        p.location,
        p.sqft.toLocaleString(),
        p.beds,
        p.baths,
        p.year,
        formatFull(p.price),
      ]),
      headStyles: { fillColor: [109, 40, 217] },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      margin: { left: 14, right: 14 },
    });

    doc.save("market_analysis_report.pdf");
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
            <h1 className="text-2xl font-extrabold text-slate-800">
              Property Market Analysis
            </h1>
          </div>
          <p className="text-slate-600 text-sm ml-11">
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
          { icon: DollarSign, label: "Average Price",    value: formatFull(summary.average_price), iconClass: "bg-violet-100 text-violet-600" },
          { icon: Home,       label: "Total Properties", value: summary.property_count.toString(),  iconClass: "bg-sky-100 text-sky-600"     },
          { icon: MapPin,     label: "Top Location",     value: summary.top_location,               iconClass: "bg-emerald-100 text-emerald-600" },
        ].map(({ icon: Icon, label, value, iconClass }) => (
          <div key={label} className="bg-white rounded-2xl shadow-md border border-slate-100 p-5">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${iconClass}`}>
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
                formatter={(v) => typeof v === "number" ? formatFull(v) : String(v ?? "")}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", color: "#1e293b" }}
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
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", color: "#1e293b" }} />
              <Bar dataKey="property_count" radius={[6, 6, 0, 0]} name="Properties">
                {locations.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── What-If Analysis Tool ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-violet-100 text-violet-600 p-2 rounded-lg">
            <Zap size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">What-If Analysis</h3>
            <p className="text-xs text-slate-400">Adjust property features and compare the predicted price against the market average</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Sliders grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
            {WHAT_IF_FIELDS.map(({ key, label, min, max, step, format }) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-700">{label}</label>
                  <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                    {format(whatIfFeatures[key])}
                  </span>
                </div>
                <input
                  type="range"
                  min={min} max={max} step={step}
                  value={whatIfFeatures[key]}
                  onChange={(e) =>
                    setWhatIfFeatures((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
                  }
                  className="w-full h-2 accent-violet-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                  <span>{format(min)}</span>
                  <span>{format(max)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Action row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex gap-3">
              <button
                onClick={runWhatIf}
                disabled={whatIfLoading}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                {whatIfLoading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                {whatIfLoading ? "Predicting…" : "Run Analysis"}
              </button>
              <button
                onClick={() => { setWhatIfFeatures(DEFAULT_WHAT_IF); setWhatIfPrice(null); setWhatIfError(null); }}
                className="text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Result comparison */}
            {whatIfPrice !== null && (
              <div className="flex flex-wrap items-center gap-4 sm:ml-4">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 uppercase tracking-wide">Predicted Price</span>
                  <span className="text-2xl font-extrabold text-violet-700">{formatFull(whatIfPrice)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 uppercase tracking-wide">Market Average</span>
                  <span className="text-2xl font-extrabold text-slate-700">{formatFull(summary.average_price)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 uppercase tracking-wide">Difference</span>
                  <span className={`flex items-center gap-1 text-xl font-extrabold ${
                    whatIfPrice >= summary.average_price ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {whatIfPrice >= summary.average_price
                      ? <TrendingUp size={18} />
                      : <TrendingDown size={18} />}
                    {whatIfPrice >= summary.average_price ? "+" : "-"}
                    {formatFull(Math.abs(whatIfPrice - summary.average_price))}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {whatIfError && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-2">
              {whatIfError}
            </p>
          )}
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
              CSV
            </button>
            {/* Export PDF */}
            <button
              onClick={exportPDF}
              className="flex items-center gap-1.5 text-sm bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <FileText size={14} />
              PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
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
                  <td className="px-4 py-3 text-slate-700">{p.sqft.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-700">{p.beds}</td>
                  <td className="px-4 py-3 text-slate-700">{p.baths}</td>
                  <td className="px-4 py-3 text-slate-700">{p.year}</td>
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
