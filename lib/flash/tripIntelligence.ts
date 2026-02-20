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
  StopClusterSummary,
  StopBrief,
} from '@/types/destination-intelligence';
import { generatePackingList } from './packingEngine';
import { distanceMeters } from './hotelZoneClustering';
import type { GeoCluster } from './hotelZoneClustering';

// ── Types ────────────────────────────────────────────────────────────

export interface TripIntelligenceInput {
  destinationId: string;
  country: string;
  departureDate: string;          // ISO date (YYYY-MM-DD)
  travelerType: string;           // solo, couple, family, group
  pathType: string;               // classic, foodie, adventure, etc.
  vibes: string[];
  nights: number;
  stops: StopInput[];             // All POI stops
  clusters: ClusterInput[];       // From geographic clustering
  hotel?: HotelInput;
  favoriteStopNames?: string[];
}

export interface StopInput {
  name: string;
  type?: string;
  category?: string;
  latitude: number;
  longitude: number;
  googleRating?: number;
  duration?: string;
  suggestedDuration?: string;
  bestTimeOfDay?: string;
}

export interface ClusterInput {
  id: number;
  label: string;
  center: { latitude: number; longitude: number };
  points: { latitude: number; longitude: number }[];
  color: string;
}

export interface HotelInput {
  name: string;
  latitude: number;
  longitude: number;
  stars?: number;
  pricePerNight?: number;
  currency?: string;
  amenities?: string[];
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
    stops,
    clusters,
    hotel,
    favoriteStopNames,
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
  const poiCategories = Array.from(
    new Set(stops.map(s => s.category || s.type || '').filter(Boolean))
  );

  const packing = generatePackingList({
    weather,
    pathType,
    vibes,
    travelerType,
    nights,
    plugTypes: countryFacts.plugTypes,
    poiCategories,
  });

  // 4. Build stops overview by cluster
  const favSet = new Set((favoriteStopNames || []).map(n => n.toLowerCase()));

  const stopsOverview: StopClusterSummary[] = clusters.map(cluster => {
    // Find stops that belong to this cluster (by proximity to cluster points)
    const clusterStops = findStopsInCluster(stops, cluster);

    // Calculate walk time from hotel to cluster center
    let walkFromHotelMinutes: number | undefined;
    if (hotel) {
      const distM = distanceMeters(
        { latitude: hotel.latitude, longitude: hotel.longitude },
        { latitude: cluster.center.latitude, longitude: cluster.center.longitude }
      );
      walkFromHotelMinutes = Math.max(1, Math.round(distM / 80)); // ~80m/min walking
    }

    const stopBriefs: StopBrief[] = clusterStops.map(stop => {
      let distFromHotel: number | undefined;
      if (hotel) {
        distFromHotel = Math.round(
          distanceMeters(
            { latitude: hotel.latitude, longitude: hotel.longitude },
            { latitude: stop.latitude, longitude: stop.longitude }
          )
        );
      }

      return {
        name: stop.name,
        category: stop.category || stop.type || 'activity',
        rating: stop.googleRating,
        duration: stop.suggestedDuration || stop.duration,
        bestTimeOfDay: stop.bestTimeOfDay,
        distanceFromHotelMeters: distFromHotel,
        isFavorite: favSet.has(stop.name.toLowerCase()),
      };
    });

    return {
      label: cluster.label,
      stops: stopBriefs,
      walkFromHotelMinutes,
    };
  });

  // 5. Assemble final object
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
    stopsOverview,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Find stops that belong to a geographic cluster.
 * A stop belongs to a cluster if it's closest to that cluster's center
 * compared to other clusters. Simple nearest-centroid assignment.
 */
function findStopsInCluster(
  stops: StopInput[],
  cluster: ClusterInput,
): StopInput[] {
  // Simple approach: check if stop lat/lng is within the cluster's point set
  // by matching against cluster points (which are the original GeoPoints)
  const clusterPointSet = new Set(
    cluster.points.map(p => `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`)
  );

  return stops.filter(stop => {
    const key = `${stop.latitude.toFixed(5)},${stop.longitude.toFixed(5)}`;
    return clusterPointSet.has(key);
  });
}
