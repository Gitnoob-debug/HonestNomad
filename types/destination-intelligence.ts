// Destination Intelligence System — Scalable, data-driven trip prep
// Replaces AI-generated Magic Package with precomputed facts + deterministic logic

// === META ===
export interface FactSheetMeta {
  dataVersion: string;        // e.g., "2026-Q1"
  lastVerified: string;       // ISO date
  lastUpdated: string;        // ISO date
  generatedBy: string;        // e.g., "script-v1" or "human"
  reviewStatus: 'auto-generated' | 'human-verified';
}

// === COUNTRY FACTS ===
export interface CountryFacts {
  countryName: string;
  currencyName: string;       // e.g., "Euro"
  currencyCode: string;       // e.g., "EUR"
  currencySymbol: string;     // e.g., "€"
  plugTypes: string[];        // e.g., ["Type C", "Type E"]
  voltage: string;            // e.g., "230V / 50Hz"
  emergencyNumber: string;    // e.g., "112"
  tippingNorm: string;        // General description, NOT specific percentages
  visaInfo: string;           // General e.g., "Schengen zone, visa-free for most Western passports up to 90 days"
  languages: string[];        // e.g., ["French", "English (in tourist areas)"]
  drivingSide: 'left' | 'right';
  _meta: FactSheetMeta;
}

// Single file: data/country-facts.json — keyed by country name as in destinations.ts
export type CountryFactsMap = Record<string, CountryFacts>;

// === MONTHLY WEATHER ===
export type RainLevel = 'low' | 'moderate' | 'high';
export type HumidityLevel = 'low' | 'moderate' | 'high';

export interface MonthlyWeather {
  month: number;              // 1-12
  avgHighC: number;
  avgLowC: number;
  rainProbability: RainLevel;
  humidity: HumidityLevel;
  description: string;        // e.g., "Hot and humid with afternoon thunderstorms"
}

// === DESTINATION FACT SHEET ===
export type SafetyLevel = 'very-safe' | 'safe' | 'exercise-caution' | 'exercise-increased-caution';
export type CostLevel = 'budget' | 'moderate' | 'expensive' | 'very-expensive';
export type WaterSafety = 'tap-safe' | 'bottled-recommended' | 'bottled-required';

export interface DestinationFactSheet {
  destinationId: string;      // Matches destination.id from destinations.ts
  city: string;
  country: string;            // Key into country-facts.json

  // City-level facts
  transportAdvice: string;    // General, no specific app names
  safetyLevel: SafetyLevel;
  waterSafety: WaterSafety;
  costLevel: CostLevel;
  timeZone: string;           // e.g., "UTC+1" or "UTC+5:30"

  // Monthly weather (12 entries, one per month)
  weather: MonthlyWeather[];

  _meta: FactSheetMeta;
}

// === PACKING ENGINE ===
export type PackingCategory = 'clothing' | 'gear' | 'tech' | 'health' | 'documents' | 'comfort';

export interface PackingItem {
  item: string;
  reason: string;             // Why — tied to weather/vibe/activity
  category: PackingCategory;
}

export interface PackingList {
  essentials: PackingItem[];
  niceToHave: PackingItem[];
}

// === TRIP INTELLIGENCE OUTPUT (assembled per-trip) ===
export interface TripIntelligence {
  // Destination prep (country + city facts for this trip)
  destinationPrep: {
    weather: MonthlyWeather;
    currency: { name: string; code: string; symbol: string };
    plugTypes: string[];
    voltage: string;
    emergencyNumber: string;
    tippingNorm: string;
    visaInfo: string;
    languages: string[];
    drivingSide: 'left' | 'right';
    transportAdvice: string;
    safetyLevel: SafetyLevel;
    waterSafety: WaterSafety;
    costLevel: CostLevel;
    timeZone: string;
  };

  // Packing section (deterministic from weather + vibe + activities)
  packing: PackingList;

  // Stops overview — no longer used (distance info moved to day cards)
  stopsOverview?: StopClusterSummary[];
}

/** @deprecated No longer assembled — hotel distances shown in day cards instead */
export interface StopClusterSummary {
  label: string;
  stops: StopBrief[];
  walkFromHotelMinutes?: number;
}

/** @deprecated No longer assembled — hotel distances shown in day cards instead */
export interface StopBrief {
  name: string;
  category: string;
  rating?: number;
  duration?: string;
  bestTimeOfDay?: string;
  distanceFromHotelMeters?: number;
  isFavorite?: boolean;
}
