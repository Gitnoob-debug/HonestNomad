/**
 * IP Geolocation for Discover Feature
 *
 * Lightweight IP-to-location lookup using free APIs (no npm packages, no API keys).
 * Used to determine the user's approximate location for "Closer Alternative" tiles.
 *
 * Primary: ip-api.com (free, no key, 45 req/min for non-commercial)
 * Fallback: ipapi.co (free tier, 1000 req/day)
 *
 * Results are cached in memory with a 1-hour TTL to avoid repeated lookups.
 */

import { findNearestAirport, type AirportInfo } from '@/lib/flash/airportCoords';

export interface IpLocation {
  lat: number;
  lng: number;
  city: string;
  country: string;
  airport: AirportInfo;
}

// ── In-memory cache (1-hour TTL) ────────────────────────────────────

interface CacheEntry {
  result: IpLocation | null;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const FETCH_TIMEOUT_MS = 3000;

function getCached(ip: string): IpLocation | null | undefined {
  const entry = cache.get(ip);
  if (!entry) return undefined; // not in cache
  if (Date.now() > entry.expiresAt) {
    cache.delete(ip);
    return undefined; // expired
  }
  return entry.result; // could be null (cached failure)
}

function setCache(ip: string, result: IpLocation | null): void {
  cache.set(ip, { result, expiresAt: Date.now() + CACHE_TTL_MS });

  // Prevent unbounded growth — evict oldest entries if cache gets large
  if (cache.size > 500) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

// ── Private/localhost IP detection ───────────────────────────────────

function isPrivateIp(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') ||
    ip.startsWith('172.3') ||
    ip.startsWith('fd') ||
    ip.startsWith('fe80')
  );
}

// ── Fetch with timeout ───────────────────────────────────────────────

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// ── Primary: ip-api.com ──────────────────────────────────────────────

async function tryIpApi(ip: string): Promise<IpLocation | null> {
  try {
    const url = `http://ip-api.com/json/${ip}?fields=status,lat,lon,city,country`;
    const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 'success' || !data.lat || !data.lon) return null;

    const airport = findNearestAirport(data.lat, data.lon);
    return {
      lat: data.lat,
      lng: data.lon,
      city: data.city || '',
      country: data.country || '',
      airport,
    };
  } catch {
    return null;
  }
}

// ── Fallback: ipapi.co ──────────────────────────────────────────────

async function tryIpapiCo(ip: string): Promise<IpLocation | null> {
  try {
    const url = `https://ipapi.co/${ip}/json/`;
    const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.latitude || !data.longitude) return null;

    const airport = findNearestAirport(data.latitude, data.longitude);
    return {
      lat: data.latitude,
      lng: data.longitude,
      city: data.city || '',
      country: data.country_name || '',
      airport,
    };
  } catch {
    return null;
  }
}

// ── Main entry point ─────────────────────────────────────────────────

export async function getLocationFromIp(ip: string | null | undefined): Promise<IpLocation | null> {
  if (!ip) return null;

  // Skip private/localhost IPs
  if (isPrivateIp(ip)) return null;

  // Check cache
  const cached = getCached(ip);
  if (cached !== undefined) return cached;

  // Try primary, then fallback
  let result = await tryIpApi(ip);
  if (!result) {
    result = await tryIpapiCo(ip);
  }

  // Cache result (even null to avoid repeated failed lookups)
  setCache(ip, result);

  return result;
}
