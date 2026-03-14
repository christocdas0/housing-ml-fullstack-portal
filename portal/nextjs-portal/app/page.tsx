/**
 * app/page.tsx
 * =============
 * Home page — shown at route "/"
 * Acts as a landing/portal page with cards linking to both apps.
 */

import Link from "next/link";
import { TrendingUp, BarChart2, ArrowRight, Brain, Zap } from "lucide-react";
import { config } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="space-y-10">

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section className="text-center py-12">
        <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <Brain size={14} />
          ML-Powered Housing Intelligence
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
          Housing ML <span className="text-sky-600">Fullstack Portal</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          A fullstack portal powered by a Linear Regression ML model,
          FastAPI backend, and Next.js frontend for housing price prediction
          and market analysis.
        </p>
      </section>

      {/* ── App Cards ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-slate-700 mb-4">Applications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* App 1 — Estimator */}
          <Link
            href="/estimator"
            className="group bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg hover:border-sky-200 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="bg-sky-100 text-sky-600 p-3 rounded-xl">
                <TrendingUp size={24} />
              </div>
              <ArrowRight
                size={20}
                className="text-slate-300 group-hover:text-sky-500 group-hover:translate-x-1 transition-all"
              />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Property Value Estimator
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Enter property details and get an instant predicted price powered
              by a trained Linear Regression model.
            </p>
            <div className="flex flex-wrap gap-2">
              {["ML Prediction", "Price History", "Charts"].map((tag) => (
                <span key={tag} className="text-xs bg-sky-50 text-sky-600 px-2 py-1 rounded-md font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </Link>

          {/* App 2 — Market Analysis */}
          <Link
            href="/market-analysis"
            className="group bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg hover:border-violet-200 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="bg-violet-100 text-violet-600 p-3 rounded-xl">
                <BarChart2 size={24} />
              </div>
              <ArrowRight
                size={20}
                className="text-slate-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all"
              />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Property Market Analysis
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Explore market trends, average prices, property counts, and
              top locations from the market analysis dashboard.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Market Trends", "Top Locations", "Export CSV"].map((tag) => (
                <span key={tag} className="text-xs bg-violet-50 text-violet-600 px-2 py-1 rounded-md font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </Link>

        </div>
      </section>

      {/* ── Tech Stack ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-slate-700 mb-4">Tech Stack</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: "🐍", label: "Python FastAPI",    desc: "ML Model API"        },
            { icon: "⚛️",  label: "Next.js",          desc: "Frontend Portal"     },
            { icon: "☕",  label: "Java Spring Boot", desc: "Market Analysis API"  },
            { icon: "🐳", label: "Docker",            desc: "Containerisation"    },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-sm font-semibold text-slate-700">{label}</div>
              <div className="text-xs text-slate-400">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quick Start ────────────────────────────────────────────── */}
      <section>
        <div className="bg-slate-900 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className="text-yellow-400" />
            <h2 className="font-bold">API Endpoints</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 mb-1">ML API (FastAPI) — Swagger UI</p>
              <code className="bg-slate-800 px-3 py-1.5 rounded-lg text-sky-300 block">
                {config.mlApiUrl}/docs
              </code>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Market API (Spring Boot)</p>
              <code className="bg-slate-800 px-3 py-1.5 rounded-lg text-violet-300 block">
                {config.marketApiUrl}/market
              </code>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
