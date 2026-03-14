/**
 * components/Navbar.tsx
 * ======================
 * Top navigation bar shown on every page.
 * Uses Next.js <Link> for client-side navigation (no full page reload).
 * Active link is highlighted based on the current URL path.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, TrendingUp } from "lucide-react";

// Navigation links definition
const NAV_LINKS = [
  { href: "/",                label: "Home",            icon: Home        },
  { href: "/estimator",       label: "Estimator",       icon: TrendingUp  },
  { href: "/market-analysis", label: "Market Analysis", icon: BarChart2   },
];

export default function Navbar() {
  // usePathname returns the current URL path e.g. "/estimator"
  const pathname = usePathname();

  return (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand / Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-sky-400 hover:text-sky-300 transition-colors">
            🏠 <span>Housing Portal</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              // Mark link as active if current path matches
              const isActive = pathname === href;

              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sky-600 text-white"           // active style
                      : "text-slate-300 hover:bg-slate-700 hover:text-white" // default style
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </div>

        </div>
      </div>
    </nav>
  );
}
