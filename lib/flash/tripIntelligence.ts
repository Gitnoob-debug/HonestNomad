/**
 * Trip Intelligence Assembly
 *
 * Assembles a TripIntelligence object from precomputed destination/country
 * facts + per-trip computed data (distances, packing). Zero external API calls.
 *
 * This replaces the AI-generated Magic Package with deterministic, scalable logic.
 */

import fs from 'fs';
import path from 'path';
import type {
  TripIntelligence,
  DestinationFactSheet,
  CountryFactsMap,
  CountryFacts,
  MonthlyWeather,
} from '@/types/destination-intelligence';
import { generatePackingList } from './packingEngine';

// ── Types ────────────────────────────────────────────────────────────

export interface TripIntelligenceInput {
  destinationId: string;
  country: string;
  departureDate: string;          // ISO date (YYYY-MM-DD)
  travelerType: string;           // solo, couple, family, group
  pathType: string;               // classic, foodie, adventure, etc.
  vibes: string[];
  nights: number;
}

// ── Data loaders ─────────────────────────────────────────────────────

// These run server-side only (API route). We use fs.readFileSync to avoid
// Next.js bundling all 500 destination JSON files into the client build,
// which causes out-of-memory during Vercel builds.

const DATA_DIR = path.join(process.cwd(), 'data');

// Cache country facts in memory — loaded once per cold start
let countryFactsCache: CountryFactsMap | null = null;

export function loadDestinationFacts(
  destinationId: string
): DestinationFactSheet | null {
  try {
    const filePath = path.join(DATA_DIR, 'destination-facts', `${destinationId}.json`);
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as DestinationFactSheet;
  } catch {
    console.warn(`[TripIntelligence] No fact sheet for destination: ${destinationId}`);
    return null;
  }
}

export function loadCountryFacts(): CountryFactsMap {
  if (countryFactsCache) return countryFactsCache;
  try {
    const filePath = path.join(DATA_DIR, 'country-facts.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    countryFactsCache = JSON.parse(raw) as CountryFactsMap;
    return countryFactsCache;
  } catch {
    console.warn('[TripIntelligence] Could not load country facts');
    return {};
  }
}

// ── Assembly ─────────────────────────────────────────────────────────

/**
 * Assemble trip intelligence from precomputed data.
 * Returns null if destination fact sheet is not available.
 */
export async function assembleTripIntelligence(
  input: TripIntelligenceInput
): Promise<TripIntelligence | null> {
  const {
    destinationId,
    country,
    departureDate,
    travelerType,
    pathType,
    vibes,
    nights,
  } = input;

  // 1. Load data (sync fs reads — server-side only)
  const destFacts = loadDestinationFacts(destinationId);
  const countryFactsMap = loadCountryFacts();
  const countryFacts: CountryFacts | null = countryFactsMap[country] || null;

  if (!destFacts || !countryFacts) {
    console.warn(
      `[TripIntelligence] Missing data — dest: ${!!destFacts}, country: ${!!countryFacts}`
    );
    return null;
  }

  // 2. Get weather for travel month
  const travelMonth = new Date(departureDate).getMonth() + 1; // 1-12
  const weather: MonthlyWeather = destFacts.weather.find(
    w => w.month === travelMonth
  ) || destFacts.weather[0]; // Fallback to January if something's off

  // 3. Generate packing list
  const packing = generatePackingList({
    weather,
    pathType,
    vibes,
    travelerType,
    nights,
    plugTypes: countryFacts.plugTypes,
    poiCategories: [],  // POI categories no longer sent from client
  });

  // 4. Assemble final object
  return {
    destinationPrep: {
      weather,
      currency: {
        name: countryFacts.currencyName,
        code: countryFacts.currencyCode,
        symbol: countryFacts.currencySymbol,
      },
      plugTypes: countryFacts.plugTypes,
      voltage: countryFacts.voltage,
      emergencyNumber: countryFacts.emergencyNumber,
      tippingNorm: countryFacts.tippingNorm,
      visaInfo: countryFacts.visaInfo,
      languages: countryFacts.languages,
      drivingSide: countryFacts.drivingSide,
      transportAdvice: destFacts.transportAdvice,
      safetyLevel: destFacts.safetyLevel,
      waterSafety: destFacts.waterSafety,
      costLevel: destFacts.costLevel,
      timeZone: destFacts.timeZone,
    },
    packing,
  };
}
