// Climate data utility for destination cards
// Uses static monthly averages - honest about limitations of long-range forecasting

import climateData from '@/data/climate.json';

export type WeatherCondition = 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'mild';

export interface ClimateInfo {
  high: number;        // Celsius
  low: number;         // Celsius
  condition: WeatherCondition;
  rainfall: number;    // mm per month
  description: string; // Human-readable summary
  icon: string;        // Emoji for quick visual
}

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const CONDITION_ICONS: Record<WeatherCondition, string> = {
  'sunny': '☀️',
  'partly-cloudy': '⛅',
  'cloudy': '☁️',
  'rainy': '🌧️',
  'stormy': '⛈️',
  'snowy': '❄️',
  'mild': '🌤️',
};

const CONDITION_DESCRIPTIONS: Record<WeatherCondition, string> = {
  'sunny': 'sunny',
  'partly-cloudy': 'partly cloudy',
  'cloudy': 'overcast',
  'rainy': 'rainy',
  'stormy': 'stormy',
  'snowy': 'snowy',
  'mild': 'mild',
};

/**
 * Get climate info for a destination and date
 * @param destinationId - Destination slug (e.g., 'paris', 'new-york')
 * @param date - Date to get climate for (uses month)
 * @returns Climate info or null if not found
 */
export function getClimate(destinationId: string, date: Date | string): ClimateInfo | null {
  const normalizedId = normalizeDestinationId(destinationId);
  const cityData = (climateData as Record<string, any>)[normalizedId];

  if (!cityData || normalizedId === '_meta') {
    return null;
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const monthIndex = dateObj.getMonth();
  const monthKey = MONTH_NAMES[monthIndex];
  const monthData = cityData[monthKey];

  if (!monthData) {
    return null;
  }

  const condition = monthData.condition as WeatherCondition;
  const description = buildDescription(monthData.high, monthData.low, condition);

  return {
    high: monthData.high,
    low: monthData.low,
    condition,
    rainfall: monthData.rainfall,
    description,
    icon: CONDITION_ICONS[condition] || '🌡️',
  };
}

/**
 * Get climate for a date range (e.g., a trip spanning multiple days/months)
 * Returns the climate for the middle of the trip
 */
export function getClimateForTrip(
  destinationId: string,
  startDate: Date | string,
  endDate: Date | string
): ClimateInfo | null {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // Use the middle of the trip
  const midpoint = new Date((start.getTime() + end.getTime()) / 2);
  return getClimate(destinationId, midpoint);
}

/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9/5) + 32);
}

/**
 * Format temperature for display
 * @param celsius - Temperature in Celsius
 * @param unit - 'C' for Celsius, 'F' for Fahrenheit
 */
export function formatTemp(celsius: number, unit: 'C' | 'F' = 'C'): string {
  if (unit === 'F') {
    return `${celsiusToFahrenheit(celsius)}°F`;
  }
  return `${celsius}°C`;
}

/**
 * Get a short climate summary for display
 * e.g., "24°C, Sunny" or "15°C, Rainy"
 */
export function getClimateShort(destinationId: string, date: Date | string, unit: 'C' | 'F' = 'C'): string | null {
  const climate = getClimate(destinationId, date);
  if (!climate) return null;

  const temp = unit === 'F' ? celsiusToFahrenheit(climate.high) : climate.high;
  const unitLabel = unit === 'F' ? '°F' : '°C';
  const conditionLabel = climate.condition.charAt(0).toUpperCase() + climate.condition.slice(1).replace('-', ' ');

  return `${temp}${unitLabel}, ${conditionLabel}`;
}

/**
 * Build a human-readable description
 */
function buildDescription(high: number, low: number, condition: WeatherCondition): string {
  const conditionText = CONDITION_DESCRIPTIONS[condition];

  if (high >= 30) {
    return `Hot and ${conditionText}. Expect highs around ${high}°C.`;
  } else if (high >= 20) {
    return `Warm and ${conditionText}. Highs around ${high}°C.`;
  } else if (high >= 10) {
    return `Mild and ${conditionText}. Temperatures around ${high}°C.`;
  } else if (high >= 0) {
    return `Cold and ${conditionText}. Highs near ${high}°C.`;
  } else {
    return `Very cold and ${conditionText}. Temperatures below freezing.`;
  }
}

/**
 * Normalize destination ID to match climate data keys
 */
function normalizeDestinationId(id: string): string {
  return id
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Check if we have climate data for a destination
 */
export function hasClimateData(destinationId: string): boolean {
  const normalizedId = normalizeDestinationId(destinationId);
  return normalizedId in climateData && normalizedId !== '_meta';
}

/**
 * Get all destinations we have climate data for
 */
export function getDestinationsWithClimate(): string[] {
  return Object.keys(climateData).filter(key => key !== '_meta');
}

/**
 * Get packing suggestion based on climate
 */
export function getPackingSuggestion(climate: ClimateInfo): string {
  const suggestions: string[] = [];

  if (climate.high >= 30) {
    suggestions.push('Light, breathable clothing');
  } else if (climate.high >= 20) {
    suggestions.push('Light layers');
  } else if (climate.high >= 10) {
    suggestions.push('Warm layers, jacket');
  } else {
    suggestions.push('Heavy coat, warm layers');
  }

  if (climate.condition === 'rainy' || climate.rainfall > 100) {
    suggestions.push('Rain gear, umbrella');
  }

  if (climate.condition === 'sunny' && climate.high >= 20) {
    suggestions.push('Sunscreen, sunglasses');
  }

  if (climate.condition === 'snowy') {
    suggestions.push('Waterproof boots, gloves');
  }

  return suggestions.join('. ');
}
