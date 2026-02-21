// ── Trip Narrative Types ──
// AI-generated day-by-day narrative for the package step.

export interface NarrativeStopInput {
  name: string;
  type: string;
  category?: string;
  rating?: number;
  duration?: string;
  bestTimeOfDay?: string;
  isFavorite: boolean;
  walkMinFromHotel?: number;
}

export interface NarrativeDayInput {
  dayIndex: number;
  zoneLabel: string;
  stops: NarrativeStopInput[];
  totalHours: number;
  walkMinFromHotel?: number;
}

export interface TripNarrativeRequest {
  destinationId: string;
  destinationCity: string;
  destinationCountry: string;
  departureDate: string;
  days: NarrativeDayInput[];
  hotel?: {
    name: string;
    stars: number;
  };
  travelerType: string;
  pathType: string;
  favoriteNames: string[];
}

export interface TripNarrativeResponse {
  dayNarratives: Record<number, string>;
}
