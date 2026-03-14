/**
 * lib/config.ts
 * ==============
 * Central place for all environment-based configuration.
 *
 * Industry standard: never scatter process.env calls across files.
 * Instead, read ALL env vars here and export typed constants.
 *
 * NEXT_PUBLIC_ prefix = accessible in the browser (client-side).
 * Variables WITHOUT that prefix are server-side only.
 */

export const config = {
  /** FastAPI ML model service base URL */
  mlApiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",

  /** Java Spring Boot market analysis service base URL */
  marketApiUrl: process.env.NEXT_PUBLIC_MARKET_API_URL ?? "http://localhost:8080",
} as const;
