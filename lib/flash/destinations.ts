import type { Destination, DestinationVibe } from '@/types/flash';
import destinationsData from '@/data/destinations.json';

// Cast the JSON data to the Destination type
// Data lives in /data/destinations.json — edit there to add/modify destinations
export const DESTINATIONS: Destination[] = destinationsData as Destination[];

// Helper functions
export function getDestinationById(id: string): Destination | undefined {
  return DESTINATIONS.find(d => d.id === id);
}

export function getDestinationsByRegion(region: string): Destination[] {
  return DESTINATIONS.filter(d => d.region === region);
}

export function getDestinationsByVibe(vibe: DestinationVibe): Destination[] {
  return DESTINATIONS.filter(d => d.vibes.includes(vibe));
}

export function getDestinationsForMonth(month: number): Destination[] {
  return DESTINATIONS.filter(d => d.bestMonths.includes(month));
}

export function searchDestinations(query: string): Destination[] {
  const lowerQuery = query.toLowerCase();
  return DESTINATIONS.filter(
    d =>
      d.city.toLowerCase().includes(lowerQuery) ||
      d.country.toLowerCase().includes(lowerQuery) ||
      d.airportCode.toLowerCase().includes(lowerQuery) ||
      d.vibes.some(v => v.includes(lowerQuery))
  );
}
