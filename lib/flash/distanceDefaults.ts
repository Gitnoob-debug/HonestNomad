/**
 * Distance-Based Smart Defaults
 *
 * Computes smart check-in/check-out date defaults based on the distance
 * between the user's location and the destination. Short-distance trips
 * get impulse-friendly dates (this weekend), while long-haul trips
 * default further out (4-6 weeks).
 *
 * Distance tiers:
 *   < 500 km  → "impulse"     → this/next weekend, 3 nights
 *   < 2000 km → "short_haul"  → ~10 days out, 4 nights
 *   < 5000 km → "medium_haul" → ~18 days out, 5 nights
 *   5000+ km  → "long_haul"   → ~35 days out, 7 nights
 *
 * All check-in dates snap to Friday for natural weekend alignment.
 */

// ── Types ────────────────────────────────────────────────────────────

export interface DistanceDefaults {
  /** Suggested check-in date (YYYY-MM-DD) */
  checkinDate: string;
  /** Suggested check-out date (YYYY-MM-DD) */
  checkoutDate: string;
  /** Number of nights */
  nights: number;
  /** Distance in km between user and destination */
  distanceKm: number;
  /** Which tier this falls into */
  tier: 'impulse' | 'short_haul' | 'medium_haul' | 'long_haul';
  /** Lead time in days from today */
  leadTimeDays: number;
}

// ── Distance thresholds (km) ─────────────────────────────────────────

const IMPULSE_MAX_KM = 500;
const SHORT_HAUL_MAX_KM = 2000;
const MEDIUM_HAUL_MAX_KM = 5000;

// ── Lead time defaults (days from today) ─────────────────────────────

const SHORT_HAUL_LEAD_DAYS = 10;
const MEDIUM_HAUL_LEAD_DAYS = 18;
const LONG_HAUL_LEAD_DAYS = 35;

// ── Trip duration defaults (nights) ──────────────────────────────────

const IMPULSE_NIGHTS = 3;
const SHORT_HAUL_NIGHTS = 4;
const MEDIUM_HAUL_NIGHTS = 5;
const LONG_HAUL_NIGHTS = 7;

// ── Fallback when distance is unknown ────────────────────────────────

const FALLBACK_LEAD_DAYS = 14;
const FALLBACK_NIGHTS = 5;

// ── Haversine distance ───────────────────────────────────────────────

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/** Haversine distance in km between two lat/lng points. */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Weekend snapping logic ───────────────────────────────────────────

/**
 * For impulse-tier trips, snap to this weekend if early enough in the
 * week (Mon-Thu → this Friday), otherwise next Friday.
 */
function getImpulseCheckin(today: Date): Date {
  const day = today.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat

  // Mon-Thu: this Friday
  if (day >= 1 && day <= 4) {
    const friday = new Date(today);
    friday.setDate(today.getDate() + (5 - day));
    return friday;
  }

  // Fri/Sat/Sun: next Friday
  const nextFriday = new Date(today);
  const daysUntil = (5 - day + 7) % 7 || 7;
  nextFriday.setDate(today.getDate() + daysUntil);
  return nextFriday;
}

/**
 * For non-impulse tiers, add lead days then snap to the nearest Friday.
 * Always ensures the result is at least tomorrow.
 */
function getLeadTimeCheckin(today: Date, leadDays: number): Date {
  const target = new Date(today);
  target.setDate(today.getDate() + leadDays);

  const day = target.getDay();
  const daysUntilFriday = (5 - day + 7) % 7;

  if (daysUntilFriday === 0) {
    // Already a Friday
    return target;
  }

  // Snap to whichever Friday is closer
  if (daysUntilFriday <= 3) {
    // Next Friday is closer
    target.setDate(target.getDate() + daysUntilFriday);
  } else {
    // Previous Friday is closer
    target.setDate(target.getDate() - (7 - daysUntilFriday));
  }

  // Ensure at least tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (target < tomorrow) {
    // Jump to next Friday from tomorrow
    const d = tomorrow.getDay();
    const until = (5 - d + 7) % 7 || 7;
    tomorrow.setDate(tomorrow.getDate() + until);
    return tomorrow;
  }

  return target;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Compute smart date defaults based on distance between user and destination.
 */
export function computeDistanceDefaults(
  userLat: number,
  userLng: number,
  destLat: number,
  destLng: number
): DistanceDefaults {
  const distanceKm = haversineDistanceKm(userLat, userLng, destLat, destLng);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let tier: DistanceDefaults['tier'];
  let nights: number;
  let checkin: Date;

  if (distanceKm < IMPULSE_MAX_KM) {
    tier = 'impulse';
    nights = IMPULSE_NIGHTS;
    checkin = getImpulseCheckin(today);
  } else if (distanceKm < SHORT_HAUL_MAX_KM) {
    tier = 'short_haul';
    nights = SHORT_HAUL_NIGHTS;
    checkin = getLeadTimeCheckin(today, SHORT_HAUL_LEAD_DAYS);
  } else if (distanceKm < MEDIUM_HAUL_MAX_KM) {
    tier = 'medium_haul';
    nights = MEDIUM_HAUL_NIGHTS;
    checkin = getLeadTimeCheckin(today, MEDIUM_HAUL_LEAD_DAYS);
  } else {
    tier = 'long_haul';
    nights = LONG_HAUL_NIGHTS;
    checkin = getLeadTimeCheckin(today, LONG_HAUL_LEAD_DAYS);
  }

  const checkout = new Date(checkin);
  checkout.setDate(checkin.getDate() + nights);

  const leadTimeDays = Math.round(
    (checkin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    checkinDate: formatDate(checkin),
    checkoutDate: formatDate(checkout),
    nights,
    distanceKm: Math.round(distanceKm),
    tier,
    leadTimeDays,
  };
}

/**
 * Fallback defaults when we can't determine distance
 * (e.g., user denied location access and no destination context).
 */
export function getFallbackDefaults(): Pick<
  DistanceDefaults,
  'checkinDate' | 'checkoutDate' | 'nights' | 'leadTimeDays'
> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkin = getLeadTimeCheckin(today, FALLBACK_LEAD_DAYS);
  const checkout = new Date(checkin);
  checkout.setDate(checkin.getDate() + FALLBACK_NIGHTS);

  return {
    checkinDate: formatDate(checkin),
    checkoutDate: formatDate(checkout),
    nights: FALLBACK_NIGHTS,
    leadTimeDays: Math.round(
      (checkin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    ),
  };
}
