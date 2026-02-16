/**
 * Hotel Zone Clustering — IQR-based outlier filtering
 *
 * Problem: A single far-away favorited POI (e.g., on the other side of Singapore)
 * can skew the hotel zone to cover half the island. We need to find the "main cluster"
 * of favorites and ignore outliers.
 *
 * Approach:
 * 1. Use spatial median (robust to outliers) instead of arithmetic mean
 * 2. Calculate distances from median center to each favorite
 * 3. Use IQR (Interquartile Range) to detect outliers: distance > Q3 + 1.5*IQR
 * 4. Recalculate centroid using only inliers
 * 5. Set radius from the inlier set, with reasonable min/max bounds
 */

interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface HotelZoneResult {
  /** Center latitude of the ideal hotel zone */
  centerLat: number;
  /** Center longitude of the ideal hotel zone */
  centerLng: number;
  /** Radius of the zone in meters */
  radiusMeters: number;
  /** Points that are part of the main cluster (inliers) */
  clusterPoints: GeoPoint[];
  /** Points that were excluded as outliers */
  outlierPoints: GeoPoint[];
  /** Whether clustering was applied (vs just using all points) */
  clusteringApplied: boolean;
}

/**
 * Calculate distance in meters between two geographic points
 * Uses flat-earth approximation (fine for city-scale distances)
 */
export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = (a.latitude - b.latitude) * 111320;
  const dLng = (a.longitude - b.longitude) * 111320 * Math.cos(((a.latitude + b.latitude) / 2) * Math.PI / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Calculate the spatial median (component-wise median)
 * More robust to outliers than arithmetic mean
 */
function spatialMedian(points: GeoPoint[]): GeoPoint {
  const lats = points.map(p => p.latitude).sort((a, b) => a - b);
  const lngs = points.map(p => p.longitude).sort((a, b) => a - b);

  const mid = Math.floor(points.length / 2);

  return {
    latitude: points.length % 2 === 0 ? (lats[mid - 1] + lats[mid]) / 2 : lats[mid],
    longitude: points.length % 2 === 0 ? (lngs[mid - 1] + lngs[mid]) / 2 : lngs[mid],
  };
}

/**
 * IQR-based outlier detection on distances from center
 */
function filterOutliersIQR(points: GeoPoint[], center: GeoPoint): { inliers: GeoPoint[]; outliers: GeoPoint[] } {
  if (points.length <= 3) {
    // With 3 or fewer points, don't filter — not enough data for IQR
    return { inliers: points, outliers: [] };
  }

  const distances = points.map(p => ({
    point: p,
    distance: distanceMeters(p, center),
  }));

  // Sort by distance
  const sorted = distances.map(d => d.distance).sort((a, b) => a - b);

  // Calculate Q1, Q3, IQR
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  // Outlier threshold: Q3 + 1.5 * IQR
  // But use a minimum threshold of 2km so we don't over-filter in tight clusters
  const threshold = Math.max(q3 + 1.5 * iqr, 2000);

  const inliers: GeoPoint[] = [];
  const outliers: GeoPoint[] = [];

  distances.forEach(d => {
    if (d.distance <= threshold) {
      inliers.push(d.point);
    } else {
      outliers.push(d.point);
    }
  });

  // Safety: if filtering removed too many points (>50%), keep all
  if (inliers.length < Math.ceil(points.length / 2)) {
    return { inliers: points, outliers: [] };
  }

  return { inliers, outliers };
}

/**
 * Identify the main cluster of POIs for smart map bounds.
 * Filters out geographic outliers (e.g., offshore islands) so the map
 * zooms to the main nexus of activity rather than stretching to fit everything.
 *
 * @param points - Array of geographic points (all POI stops)
 * @returns Object with inlier points (main cluster) and outlier count
 */
export function getMainClusterBounds(
  points: GeoPoint[]
): { inliers: GeoPoint[]; outlierCount: number } {
  if (points.length <= 3) {
    return { inliers: points, outlierCount: 0 };
  }

  const median = spatialMedian(points);
  const { inliers, outliers } = filterOutliersIQR(points, median);

  return {
    inliers,
    outlierCount: outliers.length,
  };
}

/**
 * Calculate the ideal hotel zone from a set of favorited POI locations.
 *
 * Uses IQR-based outlier filtering to find the main cluster of favorites,
 * then computes a centroid and radius that covers the cluster without being
 * skewed by distant outliers.
 *
 * @param favorites - Array of geographic points (favorited POIs)
 * @returns HotelZoneResult with center, radius, and cluster info
 */
export function calculateHotelZone(favorites: GeoPoint[]): HotelZoneResult | null {
  if (favorites.length < 2) return null;

  // Step 1: Find spatial median (robust center estimate)
  const median = spatialMedian(favorites);

  // Step 2: Filter outliers using IQR on distances from median
  const { inliers, outliers } = filterOutliersIQR(favorites, median);

  const clusteringApplied = outliers.length > 0;

  // Step 3: Calculate centroid of the inlier cluster (use mean of inliers — now safe)
  const clusterCentLat = inliers.reduce((s, p) => s + p.latitude, 0) / inliers.length;
  const clusterCentLng = inliers.reduce((s, p) => s + p.longitude, 0) / inliers.length;

  // Step 4: Calculate radius — max distance from cluster centroid to any inlier + padding
  let maxDist = 0;
  inliers.forEach(p => {
    const dist = distanceMeters(p, { latitude: clusterCentLat, longitude: clusterCentLng });
    if (dist > maxDist) maxDist = dist;
  });

  // Radius: max inlier distance + 20% padding
  // Minimum 400m (walkable neighborhood), Maximum 5km (reasonable city area)
  const radiusMeters = Math.min(5000, Math.max(400, maxDist * 1.2));

  return {
    centerLat: clusterCentLat,
    centerLng: clusterCentLng,
    radiusMeters,
    clusterPoints: inliers,
    outlierPoints: outliers,
    clusteringApplied,
  };
}

/**
 * Filter geographic outliers from any array of items with lat/lng.
 *
 * Generic wrapper around the IQR-based outlier detection used for hotel zones
 * and map bounds. Returns the original typed items split into inliers/outliers,
 * plus the cluster center and threshold distance so callers can test additional
 * candidates against the cluster.
 *
 * @param items - Array of objects with latitude/longitude
 * @returns inliers (main cluster), outliers, cluster center, and threshold
 */
export function filterProximityOutliers<T extends { latitude: number; longitude: number }>(
  items: T[]
): { inliers: T[]; outliers: T[]; clusterCenter: GeoPoint; thresholdMeters: number } {
  if (items.length <= 3) {
    const center = items.length > 0
      ? spatialMedian(items)
      : { latitude: 0, longitude: 0 };
    return { inliers: items, outliers: [], clusterCenter: center, thresholdMeters: Infinity };
  }

  const median = spatialMedian(items);

  // Calculate distances to compute threshold (same logic as filterOutliersIQR)
  const distances = items.map((item, index) => ({
    item,
    index,
    distance: distanceMeters(item, median),
  }));

  const sorted = distances.map(d => d.distance).sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  const threshold = Math.max(q3 + 1.5 * iqr, 2000);

  const inliers: T[] = [];
  const outliers: T[] = [];

  distances.forEach(d => {
    if (d.distance <= threshold) {
      inliers.push(d.item);
    } else {
      outliers.push(d.item);
    }
  });

  // Safety: if filtering removed too many (>50%), keep all
  if (inliers.length < Math.ceil(items.length / 2)) {
    return { inliers: items, outliers: [], clusterCenter: median, thresholdMeters: threshold };
  }

  // Recalculate center from inliers for more accurate backfill testing
  const clusterCenter = spatialMedian(inliers);

  return { inliers, outliers, clusterCenter, thresholdMeters: threshold };
}
