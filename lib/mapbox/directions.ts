/**
 * Mapbox Directions API client — walking routes between waypoints
 *
 * Used to show walking routes on the package step mini-map and
 * walk-time/distance connectors between consecutive itinerary stops.
 *
 * API docs: https://docs.mapbox.com/api/navigation/directions/
 */

export interface DirectionsLeg {
  /** Distance in meters */
  distance: number;
  /** Duration in seconds */
  duration: number;
}

export interface DirectionsResult {
  /** Encoded polyline (polyline6 precision) for the full route */
  geometry: string;
  /** One leg per consecutive pair of waypoints */
  legs: DirectionsLeg[];
  /** Total route distance in meters */
  totalDistance: number;
  /** Total route duration in seconds */
  totalDuration: number;
}

interface MapboxDirectionsResponse {
  code: string;
  routes: Array<{
    geometry: string;
    legs: Array<{
      distance: number;
      duration: number;
      summary: string;
    }>;
    distance: number;
    duration: number;
  }>;
}

const DIRECTIONS_BASE_URL = 'https://api.mapbox.com/directions/v5/mapbox/walking';

/**
 * Get walking directions between an ordered list of waypoints.
 *
 * @param waypoints - 2-25 points in order of travel
 * @returns Route geometry + per-leg distance/duration
 * @throws Error if API call fails or returns no routes
 */
export async function getWalkingDirections(
  waypoints: { latitude: number; longitude: number }[]
): Promise<DirectionsResult> {
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('MAPBOX_ACCESS_TOKEN is required');
  }

  if (waypoints.length < 2) {
    throw new Error('At least 2 waypoints are required for directions');
  }

  if (waypoints.length > 25) {
    throw new Error('Mapbox Directions API supports max 25 waypoints');
  }

  // Mapbox expects coordinates as longitude,latitude semicolon-separated
  const coordinates = waypoints
    .map((wp) => `${wp.longitude},${wp.latitude}`)
    .join(';');

  const url = `${DIRECTIONS_BASE_URL}/${coordinates}?access_token=${accessToken}&overview=full&geometries=polyline6&steps=false`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Directions API failed: ${response.statusText}`);
  }

  const data: MapboxDirectionsResponse = await response.json();

  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error('No walking route found between waypoints');
  }

  const route = data.routes[0];

  return {
    geometry: route.geometry,
    legs: route.legs.map((leg) => ({
      distance: leg.distance,
      duration: leg.duration,
    })),
    totalDistance: route.distance,
    totalDuration: route.duration,
  };
}

/**
 * Decode a polyline6 encoded string into [lat, lng] pairs.
 * Used client-side to render the route on a Mapbox GL map.
 *
 * polyline6 uses 1e6 precision (vs standard polyline's 1e5).
 */
export function decodePolyline6(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    // Decode latitude
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    // Decode longitude
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push([lat / 1e6, lng / 1e6]);
  }

  return coords;
}
