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

// ─── Geographic POI Clustering (k-means) ───

export interface GeoCluster {
  id: number;
  center: GeoPoint;
  points: GeoPoint[];
  /** Radius in meters from center to farthest point, with padding (min 200m) */
  radiusMeters: number;
  /** Compass direction label: "Central", "North", "South-West", etc. */
  label: string;
  /** Color for map overlay from palette */
  color: string;
}

const CLUSTER_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#f43f5e'];

const COMPASS_LABELS: Array<{ min: number; max: number; label: string }> = [
  { min: -22.5, max: 22.5, label: 'East' },
  { min: 22.5, max: 67.5, label: 'North-East' },
  { min: 67.5, max: 112.5, label: 'North' },
  { min: 112.5, max: 157.5, label: 'North-West' },
  { min: 157.5, max: 180, label: 'West' },
  { min: -180, max: -157.5, label: 'West' },
  { min: -157.5, max: -112.5, label: 'South-West' },
  { min: -112.5, max: -67.5, label: 'South' },
  { min: -67.5, max: -22.5, label: 'South-East' },
];

function getCompassLabel(from: GeoPoint, to: GeoPoint): string {
  const angle = Math.atan2(to.latitude - from.latitude, to.longitude - from.longitude) * 180 / Math.PI;
  for (const dir of COMPASS_LABELS) {
    if (angle >= dir.min && angle < dir.max) return dir.label;
  }
  return 'East';
}

/**
 * Cluster POIs into 2-4 geographic groups using k-means.
 * Useful for suggesting efficient day-trip groupings.
 *
 * @param points - Array of geographic points to cluster
 * @param maxClusters - Maximum number of clusters (default 4)
 * @returns Array of GeoCluster objects sorted by size descending
 */
export function clusterPOIsGeographic(
  points: GeoPoint[],
  maxClusters: number = 4
): GeoCluster[] {
  if (points.length === 0) return [];

  // With 3 or fewer points, return a single cluster
  if (points.length <= 3) {
    const center = spatialMedian(points);
    let maxDist = 0;
    points.forEach(p => {
      const d = distanceMeters(p, center);
      if (d > maxDist) maxDist = d;
    });
    return [{
      id: 0,
      center,
      points: [...points],
      radiusMeters: Math.max(200, maxDist * 1.15),
      label: 'Central',
      color: CLUSTER_COLORS[0],
    }];
  }

  const k = Math.max(2, Math.min(Math.ceil(points.length / 4), maxClusters));

  // Seed selection: farthest-first traversal from spatial median
  const globalCenter = spatialMedian(points);
  const seeds: GeoPoint[] = [];

  // First seed: closest to spatial median (anchor the central cluster)
  let bestDist = Infinity;
  let bestIdx = 0;
  points.forEach((p, i) => {
    const d = distanceMeters(p, globalCenter);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  });
  seeds.push({ latitude: points[bestIdx].latitude, longitude: points[bestIdx].longitude });

  // Remaining seeds: farthest from all existing seeds
  for (let s = 1; s < k; s++) {
    let maxMinDist = -1;
    let maxMinIdx = 0;
    points.forEach((p, i) => {
      const minDist = Math.min(...seeds.map(seed => distanceMeters(p, seed)));
      if (minDist > maxMinDist) { maxMinDist = minDist; maxMinIdx = i; }
    });
    seeds.push({ latitude: points[maxMinIdx].latitude, longitude: points[maxMinIdx].longitude });
  }

  // K-means iteration
  let centroids = seeds.map(s => ({ ...s }));
  let assignments = new Array<number>(points.length).fill(0);

  for (let iter = 0; iter < 20; iter++) {
    // Assign each point to nearest centroid
    let changed = false;
    points.forEach((p, i) => {
      let minD = Infinity;
      let minC = 0;
      centroids.forEach((c, ci) => {
        const d = distanceMeters(p, c);
        if (d < minD) { minD = d; minC = ci; }
      });
      if (assignments[i] !== minC) { assignments[i] = minC; changed = true; }
    });

    if (!changed) break;

    // Recompute centroids
    centroids = centroids.map((_, ci) => {
      const members = points.filter((_, pi) => assignments[pi] === ci);
      if (members.length === 0) return centroids[ci]; // keep old centroid if empty
      return {
        latitude: members.reduce((s, p) => s + p.latitude, 0) / members.length,
        longitude: members.reduce((s, p) => s + p.longitude, 0) / members.length,
      };
    });
  }

  // Build cluster objects
  const clusters: GeoCluster[] = centroids.map((centroid, ci) => {
    const members = points.filter((_, pi) => assignments[pi] === ci);
    let maxDist = 0;
    members.forEach(p => {
      const d = distanceMeters(p, centroid);
      if (d > maxDist) maxDist = d;
    });
    return {
      id: ci,
      center: centroid,
      points: members,
      radiusMeters: Math.max(200, maxDist * 1.15),
      label: '', // filled in below
      color: '', // filled in below
    };
  }).filter(c => c.points.length > 0); // remove empty clusters

  // Sort by size descending and assign colors
  clusters.sort((a, b) => b.points.length - a.points.length);
  clusters.forEach((c, i) => {
    c.id = i;
    c.color = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
  });

  // Assign compass labels
  if (clusters.length === 1) {
    clusters[0].label = 'Central';
  } else {
    // Find which cluster is closest to the global center → "Central"
    let closestIdx = 0;
    let closestDist = Infinity;
    clusters.forEach((c, i) => {
      const d = distanceMeters(c.center, globalCenter);
      if (d < closestDist) { closestDist = d; closestIdx = i; }
    });

    clusters.forEach((c, i) => {
      if (i === closestIdx) {
        c.label = 'Central';
      } else {
        c.label = getCompassLabel(globalCenter, c.center);
      }
    });
  }

  return clusters;
}
