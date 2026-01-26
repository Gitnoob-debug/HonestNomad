// Script to generate climate data for all 423 destinations
// Uses latitude, longitude, and region to determine climate patterns

const fs = require('fs');
const path = require('path');

// Read the destinations file and extract data
const destFile = fs.readFileSync(path.join(__dirname, '../lib/flash/destinations.ts'), 'utf-8');

// Parse destination data using regex - match each destination block
const destinations = [];

// Match each destination block: { id: 'xxx', ... }
const blockRegex = /\{\s*id:\s*'([^']+)'[^}]+country:\s*'([^']+)'[^}]+region:\s*'([^']+)'[^}]+latitude:\s*([\d.-]+)[^}]+longitude:\s*([\d.-]+)/g;

let match;
while ((match = blockRegex.exec(destFile)) !== null) {
  destinations.push({
    id: match[1],
    city: match[1], // Use ID as fallback
    country: match[2],
    latitude: parseFloat(match[4]),
    longitude: parseFloat(match[5]),
    region: match[3]
  });
}

console.log(`Found ${destinations.length} destinations`);

// Climate zone determination based on latitude and geography
function getClimateZone(lat, lon, region, country) {
  const absLat = Math.abs(lat);

  // Special cases first
  if (country === 'Iceland' || region === 'europe' && absLat > 63) return 'subarctic';
  if (country === 'Norway' && absLat > 66) return 'subarctic';
  if (region === 'europe' && absLat > 58 && (country === 'Norway' || country === 'Sweden' || country === 'Finland')) return 'nordic';

  // Tropical
  if (absLat < 15) return 'tropical';
  if (absLat < 23 && (region === 'asia' || region === 'caribbean' || region === 'oceania' || region === 'central-america' || region === 'africa')) return 'tropical';

  // Desert/Arid
  if ((region === 'middle-east' || region === 'africa') && absLat < 35) return 'desert';
  if (country === 'Morocco' || country === 'Egypt') return 'desert-mediterranean';

  // Mediterranean
  if (region === 'europe' && absLat >= 35 && absLat <= 45 && (lon > 0 || country === 'Portugal' || country === 'Spain')) return 'mediterranean';
  if (country === 'Greece' || country === 'Croatia' || country === 'Italy' || country === 'Spain' || country === 'Portugal') return 'mediterranean';
  if (country === 'Turkey' && absLat < 42) return 'mediterranean';
  if (country === 'Israel' || country === 'Lebanon') return 'mediterranean';

  // Subtropical
  if (absLat >= 23 && absLat < 35 && (region === 'north-america' || region === 'asia' || region === 'south-america' || region === 'oceania')) return 'subtropical';

  // Oceanic (marine west coast)
  if (region === 'europe' && (country === 'United Kingdom' || country === 'Ireland' || country === 'Netherlands' || country === 'Belgium')) return 'oceanic';
  if (region === 'oceania' && country === 'New Zealand') return 'oceanic';
  if (region === 'north-america' && lon < -120 && absLat > 40 && absLat < 55) return 'oceanic';

  // Continental
  if (region === 'europe' && absLat > 45 && lon > 10) return 'continental';
  if (region === 'north-america' && absLat > 40 && lon > -100) return 'continental';

  // Nordic
  if (region === 'europe' && absLat > 55) return 'nordic';

  // Temperate (default for mid-latitudes)
  if (absLat >= 35 && absLat < 55) return 'temperate';

  // High altitude adjustments would go here based on elevation data

  return 'temperate';
}

// Climate patterns by zone
const climatePatterns = {
  tropical: {
    jan: { high: 32, low: 24, condition: 'partly-cloudy', rainfall: 150 },
    feb: { high: 33, low: 24, condition: 'partly-cloudy', rainfall: 100 },
    mar: { high: 34, low: 25, condition: 'sunny', rainfall: 80 },
    apr: { high: 34, low: 26, condition: 'partly-cloudy', rainfall: 120 },
    may: { high: 33, low: 26, condition: 'rainy', rainfall: 200 },
    jun: { high: 32, low: 25, condition: 'rainy', rainfall: 250 },
    jul: { high: 31, low: 25, condition: 'rainy', rainfall: 280 },
    aug: { high: 31, low: 25, condition: 'rainy', rainfall: 260 },
    sep: { high: 31, low: 25, condition: 'rainy', rainfall: 220 },
    oct: { high: 31, low: 25, condition: 'rainy', rainfall: 200 },
    nov: { high: 31, low: 24, condition: 'partly-cloudy', rainfall: 150 },
    dec: { high: 31, low: 24, condition: 'partly-cloudy', rainfall: 120 }
  },
  subtropical: {
    jan: { high: 22, low: 12, condition: 'sunny', rainfall: 50 },
    feb: { high: 23, low: 13, condition: 'sunny', rainfall: 55 },
    mar: { high: 26, low: 15, condition: 'sunny', rainfall: 70 },
    apr: { high: 29, low: 18, condition: 'partly-cloudy', rainfall: 80 },
    may: { high: 32, low: 22, condition: 'partly-cloudy', rainfall: 100 },
    jun: { high: 34, low: 25, condition: 'sunny', rainfall: 140 },
    jul: { high: 35, low: 26, condition: 'partly-cloudy', rainfall: 160 },
    aug: { high: 35, low: 26, condition: 'partly-cloudy', rainfall: 180 },
    sep: { high: 33, low: 24, condition: 'partly-cloudy', rainfall: 140 },
    oct: { high: 29, low: 20, condition: 'sunny', rainfall: 80 },
    nov: { high: 25, low: 15, condition: 'sunny', rainfall: 55 },
    dec: { high: 22, low: 12, condition: 'sunny', rainfall: 45 }
  },
  mediterranean: {
    jan: { high: 12, low: 5, condition: 'rainy', rainfall: 80 },
    feb: { high: 14, low: 6, condition: 'rainy', rainfall: 70 },
    mar: { high: 17, low: 8, condition: 'partly-cloudy', rainfall: 50 },
    apr: { high: 20, low: 11, condition: 'partly-cloudy', rainfall: 40 },
    may: { high: 25, low: 15, condition: 'sunny', rainfall: 25 },
    jun: { high: 30, low: 19, condition: 'sunny', rainfall: 10 },
    jul: { high: 33, low: 22, condition: 'sunny', rainfall: 5 },
    aug: { high: 33, low: 22, condition: 'sunny', rainfall: 10 },
    sep: { high: 28, low: 19, condition: 'sunny', rainfall: 30 },
    oct: { high: 23, low: 14, condition: 'partly-cloudy', rainfall: 60 },
    nov: { high: 17, low: 9, condition: 'rainy', rainfall: 80 },
    dec: { high: 13, low: 6, condition: 'rainy', rainfall: 90 }
  },
  oceanic: {
    jan: { high: 7, low: 2, condition: 'rainy', rainfall: 70 },
    feb: { high: 8, low: 2, condition: 'rainy', rainfall: 55 },
    mar: { high: 11, low: 4, condition: 'cloudy', rainfall: 50 },
    apr: { high: 14, low: 6, condition: 'partly-cloudy', rainfall: 45 },
    may: { high: 17, low: 9, condition: 'partly-cloudy', rainfall: 50 },
    jun: { high: 20, low: 12, condition: 'partly-cloudy', rainfall: 50 },
    jul: { high: 22, low: 14, condition: 'partly-cloudy', rainfall: 45 },
    aug: { high: 22, low: 14, condition: 'partly-cloudy', rainfall: 55 },
    sep: { high: 19, low: 12, condition: 'partly-cloudy', rainfall: 55 },
    oct: { high: 15, low: 9, condition: 'cloudy', rainfall: 70 },
    nov: { high: 10, low: 5, condition: 'rainy', rainfall: 75 },
    dec: { high: 8, low: 3, condition: 'rainy', rainfall: 75 }
  },
  continental: {
    jan: { high: 2, low: -5, condition: 'snowy', rainfall: 40 },
    feb: { high: 4, low: -4, condition: 'snowy', rainfall: 35 },
    mar: { high: 10, low: 1, condition: 'cloudy', rainfall: 40 },
    apr: { high: 16, low: 6, condition: 'partly-cloudy', rainfall: 45 },
    may: { high: 22, low: 11, condition: 'partly-cloudy', rainfall: 60 },
    jun: { high: 26, low: 15, condition: 'sunny', rainfall: 70 },
    jul: { high: 28, low: 17, condition: 'sunny', rainfall: 65 },
    aug: { high: 27, low: 16, condition: 'sunny', rainfall: 60 },
    sep: { high: 22, low: 12, condition: 'partly-cloudy', rainfall: 45 },
    oct: { high: 15, low: 7, condition: 'cloudy', rainfall: 40 },
    nov: { high: 8, low: 2, condition: 'cloudy', rainfall: 45 },
    dec: { high: 3, low: -3, condition: 'snowy', rainfall: 45 }
  },
  temperate: {
    jan: { high: 8, low: 1, condition: 'cloudy', rainfall: 60 },
    feb: { high: 10, low: 2, condition: 'cloudy', rainfall: 50 },
    mar: { high: 14, low: 5, condition: 'partly-cloudy', rainfall: 55 },
    apr: { high: 18, low: 8, condition: 'partly-cloudy', rainfall: 50 },
    may: { high: 22, low: 12, condition: 'partly-cloudy', rainfall: 55 },
    jun: { high: 26, low: 16, condition: 'sunny', rainfall: 50 },
    jul: { high: 28, low: 18, condition: 'sunny', rainfall: 45 },
    aug: { high: 28, low: 18, condition: 'sunny', rainfall: 50 },
    sep: { high: 24, low: 14, condition: 'partly-cloudy', rainfall: 55 },
    oct: { high: 18, low: 10, condition: 'cloudy', rainfall: 60 },
    nov: { high: 12, low: 5, condition: 'cloudy', rainfall: 65 },
    dec: { high: 9, low: 2, condition: 'cloudy', rainfall: 65 }
  },
  nordic: {
    jan: { high: -1, low: -7, condition: 'snowy', rainfall: 50 },
    feb: { high: 0, low: -6, condition: 'snowy', rainfall: 40 },
    mar: { high: 4, low: -3, condition: 'cloudy', rainfall: 35 },
    apr: { high: 10, low: 2, condition: 'partly-cloudy', rainfall: 40 },
    may: { high: 16, low: 7, condition: 'partly-cloudy', rainfall: 45 },
    jun: { high: 20, low: 12, condition: 'partly-cloudy', rainfall: 55 },
    jul: { high: 23, low: 14, condition: 'partly-cloudy', rainfall: 65 },
    aug: { high: 21, low: 13, condition: 'partly-cloudy', rainfall: 70 },
    sep: { high: 16, low: 9, condition: 'cloudy', rainfall: 60 },
    oct: { high: 9, low: 4, condition: 'cloudy', rainfall: 55 },
    nov: { high: 4, low: 0, condition: 'snowy', rainfall: 55 },
    dec: { high: 1, low: -5, condition: 'snowy', rainfall: 50 }
  },
  subarctic: {
    jan: { high: -2, low: -8, condition: 'snowy', rainfall: 75 },
    feb: { high: -1, low: -7, condition: 'snowy', rainfall: 65 },
    mar: { high: 2, low: -4, condition: 'snowy', rainfall: 60 },
    apr: { high: 6, low: 0, condition: 'cloudy', rainfall: 50 },
    may: { high: 10, low: 4, condition: 'partly-cloudy', rainfall: 45 },
    jun: { high: 13, low: 8, condition: 'partly-cloudy', rainfall: 50 },
    jul: { high: 15, low: 10, condition: 'cloudy', rainfall: 55 },
    aug: { high: 14, low: 9, condition: 'rainy', rainfall: 70 },
    sep: { high: 10, low: 6, condition: 'cloudy', rainfall: 75 },
    oct: { high: 5, low: 2, condition: 'rainy', rainfall: 85 },
    nov: { high: 2, low: -2, condition: 'snowy', rainfall: 80 },
    dec: { high: 0, low: -5, condition: 'snowy', rainfall: 80 }
  },
  desert: {
    jan: { high: 24, low: 12, condition: 'sunny', rainfall: 5 },
    feb: { high: 26, low: 14, condition: 'sunny', rainfall: 5 },
    mar: { high: 30, low: 17, condition: 'sunny', rainfall: 5 },
    apr: { high: 35, low: 21, condition: 'sunny', rainfall: 2 },
    may: { high: 40, low: 26, condition: 'sunny', rainfall: 0 },
    jun: { high: 42, low: 28, condition: 'sunny', rainfall: 0 },
    jul: { high: 44, low: 30, condition: 'sunny', rainfall: 0 },
    aug: { high: 43, low: 30, condition: 'sunny', rainfall: 0 },
    sep: { high: 40, low: 27, condition: 'sunny', rainfall: 0 },
    oct: { high: 35, low: 22, condition: 'sunny', rainfall: 2 },
    nov: { high: 29, low: 17, condition: 'sunny', rainfall: 5 },
    dec: { high: 25, low: 13, condition: 'sunny', rainfall: 5 }
  },
  'desert-mediterranean': {
    jan: { high: 18, low: 8, condition: 'partly-cloudy', rainfall: 30 },
    feb: { high: 19, low: 9, condition: 'partly-cloudy', rainfall: 25 },
    mar: { high: 22, low: 11, condition: 'sunny', rainfall: 20 },
    apr: { high: 25, low: 14, condition: 'sunny', rainfall: 10 },
    may: { high: 29, low: 17, condition: 'sunny', rainfall: 5 },
    jun: { high: 33, low: 20, condition: 'sunny', rainfall: 0 },
    jul: { high: 37, low: 23, condition: 'sunny', rainfall: 0 },
    aug: { high: 37, low: 23, condition: 'sunny', rainfall: 0 },
    sep: { high: 33, low: 21, condition: 'sunny', rainfall: 5 },
    oct: { high: 28, low: 17, condition: 'sunny', rainfall: 15 },
    nov: { high: 23, low: 12, condition: 'partly-cloudy', rainfall: 25 },
    dec: { high: 19, low: 9, condition: 'partly-cloudy', rainfall: 30 }
  }
};

// Known city overrides for more accurate data
const cityOverrides = {
  // Existing data from climate.json - keep as reference
  'paris': climatePatterns.temperate,
  'london': climatePatterns.oceanic,
  'tokyo': {
    jan: { high: 10, low: 2, condition: 'sunny', rainfall: 50 },
    feb: { high: 11, low: 2, condition: 'sunny', rainfall: 60 },
    mar: { high: 14, low: 5, condition: 'partly-cloudy', rainfall: 100 },
    apr: { high: 19, low: 10, condition: 'partly-cloudy', rainfall: 130 },
    may: { high: 24, low: 15, condition: 'partly-cloudy', rainfall: 140 },
    jun: { high: 26, low: 19, condition: 'rainy', rainfall: 180 },
    jul: { high: 30, low: 23, condition: 'rainy', rainfall: 150 },
    aug: { high: 32, low: 24, condition: 'partly-cloudy', rainfall: 150 },
    sep: { high: 28, low: 21, condition: 'rainy', rainfall: 210 },
    oct: { high: 22, low: 15, condition: 'partly-cloudy', rainfall: 160 },
    nov: { high: 17, low: 9, condition: 'sunny', rainfall: 80 },
    dec: { high: 12, low: 4, condition: 'sunny', rainfall: 50 }
  },
  'dubai': {
    jan: { high: 24, low: 14, condition: 'sunny', rainfall: 10 },
    feb: { high: 25, low: 15, condition: 'sunny', rainfall: 15 },
    mar: { high: 28, low: 18, condition: 'sunny', rainfall: 20 },
    apr: { high: 33, low: 21, condition: 'sunny', rainfall: 5 },
    may: { high: 38, low: 25, condition: 'sunny', rainfall: 0 },
    jun: { high: 40, low: 28, condition: 'sunny', rainfall: 0 },
    jul: { high: 42, low: 30, condition: 'sunny', rainfall: 0 },
    aug: { high: 42, low: 31, condition: 'sunny', rainfall: 0 },
    sep: { high: 39, low: 28, condition: 'sunny', rainfall: 0 },
    oct: { high: 35, low: 24, condition: 'sunny', rainfall: 0 },
    nov: { high: 30, low: 20, condition: 'sunny', rainfall: 5 },
    dec: { high: 26, low: 16, condition: 'sunny', rainfall: 10 }
  },
  'bali': {
    jan: { high: 30, low: 24, condition: 'rainy', rainfall: 350 },
    feb: { high: 30, low: 24, condition: 'rainy', rainfall: 300 },
    mar: { high: 31, low: 24, condition: 'rainy', rainfall: 230 },
    apr: { high: 32, low: 24, condition: 'partly-cloudy', rainfall: 90 },
    may: { high: 31, low: 24, condition: 'sunny', rainfall: 80 },
    jun: { high: 30, low: 23, condition: 'sunny', rainfall: 60 },
    jul: { high: 29, low: 22, condition: 'sunny', rainfall: 50 },
    aug: { high: 30, low: 22, condition: 'sunny', rainfall: 25 },
    sep: { high: 31, low: 23, condition: 'sunny', rainfall: 45 },
    oct: { high: 32, low: 24, condition: 'partly-cloudy', rainfall: 65 },
    nov: { high: 32, low: 24, condition: 'partly-cloudy', rainfall: 180 },
    dec: { high: 31, low: 24, condition: 'rainy', rainfall: 280 }
  },
  'maldives': {
    jan: { high: 30, low: 26, condition: 'sunny', rainfall: 80 },
    feb: { high: 31, low: 26, condition: 'sunny', rainfall: 50 },
    mar: { high: 32, low: 27, condition: 'sunny', rainfall: 60 },
    apr: { high: 32, low: 27, condition: 'partly-cloudy', rainfall: 120 },
    may: { high: 31, low: 27, condition: 'rainy', rainfall: 220 },
    jun: { high: 30, low: 26, condition: 'rainy', rainfall: 190 },
    jul: { high: 30, low: 26, condition: 'rainy', rainfall: 160 },
    aug: { high: 30, low: 26, condition: 'rainy', rainfall: 180 },
    sep: { high: 30, low: 26, condition: 'rainy', rainfall: 200 },
    oct: { high: 30, low: 26, condition: 'rainy', rainfall: 230 },
    nov: { high: 30, low: 26, condition: 'partly-cloudy', rainfall: 170 },
    dec: { high: 30, low: 26, condition: 'partly-cloudy', rainfall: 130 }
  },
  'sydney': {
    jan: { high: 27, low: 20, condition: 'sunny', rainfall: 100 },
    feb: { high: 27, low: 20, condition: 'sunny', rainfall: 120 },
    mar: { high: 26, low: 19, condition: 'sunny', rainfall: 130 },
    apr: { high: 23, low: 15, condition: 'partly-cloudy', rainfall: 130 },
    may: { high: 20, low: 12, condition: 'partly-cloudy', rainfall: 120 },
    jun: { high: 17, low: 9, condition: 'partly-cloudy', rainfall: 130 },
    jul: { high: 17, low: 8, condition: 'partly-cloudy', rainfall: 100 },
    aug: { high: 18, low: 9, condition: 'partly-cloudy', rainfall: 80 },
    sep: { high: 20, low: 11, condition: 'partly-cloudy', rainfall: 70 },
    oct: { high: 22, low: 14, condition: 'partly-cloudy', rainfall: 80 },
    nov: { high: 24, low: 16, condition: 'sunny', rainfall: 80 },
    dec: { high: 26, low: 18, condition: 'sunny', rainfall: 80 }
  },
  'new-york': {
    jan: { high: 4, low: -3, condition: 'snowy', rainfall: 85 },
    feb: { high: 6, low: -2, condition: 'snowy', rainfall: 75 },
    mar: { high: 11, low: 2, condition: 'cloudy', rainfall: 100 },
    apr: { high: 17, low: 7, condition: 'partly-cloudy', rainfall: 100 },
    may: { high: 22, low: 12, condition: 'partly-cloudy', rainfall: 105 },
    jun: { high: 27, low: 18, condition: 'sunny', rainfall: 105 },
    jul: { high: 30, low: 21, condition: 'sunny', rainfall: 115 },
    aug: { high: 29, low: 21, condition: 'sunny', rainfall: 105 },
    sep: { high: 25, low: 17, condition: 'sunny', rainfall: 100 },
    oct: { high: 18, low: 11, condition: 'partly-cloudy', rainfall: 95 },
    nov: { high: 12, low: 5, condition: 'cloudy', rainfall: 100 },
    dec: { high: 6, low: 0, condition: 'snowy', rainfall: 95 }
  },
  'miami': {
    jan: { high: 24, low: 16, condition: 'sunny', rainfall: 50 },
    feb: { high: 25, low: 17, condition: 'sunny', rainfall: 50 },
    mar: { high: 27, low: 19, condition: 'sunny', rainfall: 60 },
    apr: { high: 28, low: 21, condition: 'sunny', rainfall: 80 },
    may: { high: 30, low: 23, condition: 'partly-cloudy', rainfall: 150 },
    jun: { high: 32, low: 25, condition: 'rainy', rainfall: 245 },
    jul: { high: 33, low: 26, condition: 'rainy', rainfall: 165 },
    aug: { high: 33, low: 26, condition: 'rainy', rainfall: 200 },
    sep: { high: 32, low: 25, condition: 'rainy', rainfall: 250 },
    oct: { high: 29, low: 23, condition: 'partly-cloudy', rainfall: 160 },
    nov: { high: 27, low: 20, condition: 'sunny', rainfall: 70 },
    dec: { high: 25, low: 17, condition: 'sunny', rainfall: 50 }
  },
  'singapore': {
    jan: { high: 30, low: 24, condition: 'rainy', rainfall: 250 },
    feb: { high: 31, low: 24, condition: 'partly-cloudy', rainfall: 160 },
    mar: { high: 32, low: 25, condition: 'partly-cloudy', rainfall: 185 },
    apr: { high: 32, low: 25, condition: 'partly-cloudy', rainfall: 180 },
    may: { high: 32, low: 25, condition: 'partly-cloudy', rainfall: 170 },
    jun: { high: 31, low: 25, condition: 'partly-cloudy', rainfall: 165 },
    jul: { high: 31, low: 25, condition: 'partly-cloudy', rainfall: 155 },
    aug: { high: 31, low: 25, condition: 'partly-cloudy', rainfall: 175 },
    sep: { high: 31, low: 24, condition: 'partly-cloudy', rainfall: 170 },
    oct: { high: 31, low: 24, condition: 'rainy', rainfall: 195 },
    nov: { high: 31, low: 24, condition: 'rainy', rainfall: 255 },
    dec: { high: 30, low: 24, condition: 'rainy', rainfall: 270 }
  },
  'hong-kong': {
    jan: { high: 18, low: 13, condition: 'sunny', rainfall: 25 },
    feb: { high: 18, low: 13, condition: 'cloudy', rainfall: 45 },
    mar: { high: 21, low: 16, condition: 'cloudy', rainfall: 75 },
    apr: { high: 25, low: 20, condition: 'rainy', rainfall: 160 },
    may: { high: 28, low: 24, condition: 'rainy', rainfall: 290 },
    jun: { high: 30, low: 26, condition: 'rainy', rainfall: 390 },
    jul: { high: 31, low: 27, condition: 'rainy', rainfall: 380 },
    aug: { high: 31, low: 26, condition: 'rainy', rainfall: 430 },
    sep: { high: 30, low: 26, condition: 'rainy', rainfall: 300 },
    oct: { high: 27, low: 23, condition: 'sunny', rainfall: 110 },
    nov: { high: 24, low: 19, condition: 'sunny', rainfall: 40 },
    dec: { high: 20, low: 15, condition: 'sunny', rainfall: 30 }
  },
  'cancun': {
    jan: { high: 28, low: 21, condition: 'sunny', rainfall: 60 },
    feb: { high: 29, low: 21, condition: 'sunny', rainfall: 40 },
    mar: { high: 30, low: 22, condition: 'sunny', rainfall: 30 },
    apr: { high: 31, low: 24, condition: 'sunny', rainfall: 30 },
    may: { high: 32, low: 25, condition: 'sunny', rainfall: 100 },
    jun: { high: 32, low: 26, condition: 'rainy', rainfall: 190 },
    jul: { high: 33, low: 26, condition: 'partly-cloudy', rainfall: 120 },
    aug: { high: 33, low: 26, condition: 'partly-cloudy', rainfall: 150 },
    sep: { high: 32, low: 25, condition: 'rainy', rainfall: 240 },
    oct: { high: 31, low: 24, condition: 'rainy', rainfall: 220 },
    nov: { high: 29, low: 23, condition: 'partly-cloudy', rainfall: 100 },
    dec: { high: 28, low: 22, condition: 'sunny', rainfall: 60 }
  },
  'reykjavik': climatePatterns.subarctic,
  'cape-town': {
    jan: { high: 26, low: 16, condition: 'sunny', rainfall: 15 },
    feb: { high: 27, low: 16, condition: 'sunny', rainfall: 15 },
    mar: { high: 25, low: 14, condition: 'sunny', rainfall: 20 },
    apr: { high: 22, low: 12, condition: 'partly-cloudy', rainfall: 40 },
    may: { high: 19, low: 9, condition: 'rainy', rainfall: 70 },
    jun: { high: 17, low: 8, condition: 'rainy', rainfall: 90 },
    jul: { high: 17, low: 7, condition: 'rainy', rainfall: 85 },
    aug: { high: 17, low: 8, condition: 'rainy', rainfall: 75 },
    sep: { high: 19, low: 9, condition: 'partly-cloudy', rainfall: 40 },
    oct: { high: 21, low: 11, condition: 'partly-cloudy', rainfall: 30 },
    nov: { high: 23, low: 13, condition: 'sunny', rainfall: 15 },
    dec: { high: 25, low: 15, condition: 'sunny', rainfall: 15 }
  },
  'melbourne': {
    jan: { high: 26, low: 15, condition: 'sunny', rainfall: 45 },
    feb: { high: 26, low: 15, condition: 'sunny', rainfall: 50 },
    mar: { high: 24, low: 14, condition: 'sunny', rainfall: 50 },
    apr: { high: 20, low: 11, condition: 'partly-cloudy', rainfall: 55 },
    may: { high: 17, low: 9, condition: 'cloudy', rainfall: 55 },
    jun: { high: 14, low: 7, condition: 'cloudy', rainfall: 50 },
    jul: { high: 13, low: 6, condition: 'cloudy', rainfall: 50 },
    aug: { high: 15, low: 7, condition: 'cloudy', rainfall: 50 },
    sep: { high: 17, low: 8, condition: 'partly-cloudy', rainfall: 55 },
    oct: { high: 20, low: 10, condition: 'partly-cloudy', rainfall: 65 },
    nov: { high: 22, low: 12, condition: 'sunny', rainfall: 60 },
    dec: { high: 24, low: 14, condition: 'sunny', rainfall: 55 }
  },
  'auckland': {
    jan: { high: 23, low: 16, condition: 'partly-cloudy', rainfall: 80 },
    feb: { high: 24, low: 16, condition: 'partly-cloudy', rainfall: 70 },
    mar: { high: 22, low: 15, condition: 'partly-cloudy', rainfall: 85 },
    apr: { high: 20, low: 13, condition: 'cloudy', rainfall: 100 },
    may: { high: 17, low: 11, condition: 'rainy', rainfall: 120 },
    jun: { high: 15, low: 9, condition: 'rainy', rainfall: 125 },
    jul: { high: 14, low: 8, condition: 'rainy', rainfall: 130 },
    aug: { high: 14, low: 8, condition: 'rainy', rainfall: 120 },
    sep: { high: 16, low: 9, condition: 'partly-cloudy', rainfall: 100 },
    oct: { high: 17, low: 11, condition: 'partly-cloudy', rainfall: 95 },
    nov: { high: 19, low: 12, condition: 'partly-cloudy', rainfall: 85 },
    dec: { high: 21, low: 14, condition: 'partly-cloudy', rainfall: 90 }
  },
  'rio': {
    jan: { high: 31, low: 24, condition: 'partly-cloudy', rainfall: 130 },
    feb: { high: 31, low: 24, condition: 'partly-cloudy', rainfall: 120 },
    mar: { high: 30, low: 24, condition: 'partly-cloudy', rainfall: 130 },
    apr: { high: 28, low: 22, condition: 'partly-cloudy', rainfall: 100 },
    may: { high: 26, low: 20, condition: 'sunny', rainfall: 80 },
    jun: { high: 25, low: 19, condition: 'sunny', rainfall: 50 },
    jul: { high: 25, low: 18, condition: 'sunny', rainfall: 45 },
    aug: { high: 26, low: 19, condition: 'sunny', rainfall: 45 },
    sep: { high: 26, low: 19, condition: 'partly-cloudy', rainfall: 80 },
    oct: { high: 27, low: 20, condition: 'partly-cloudy', rainfall: 90 },
    nov: { high: 28, low: 22, condition: 'partly-cloudy', rainfall: 100 },
    dec: { high: 30, low: 23, condition: 'partly-cloudy', rainfall: 135 }
  },
  'buenos-aires': {
    jan: { high: 30, low: 20, condition: 'sunny', rainfall: 120 },
    feb: { high: 29, low: 20, condition: 'sunny', rainfall: 115 },
    mar: { high: 26, low: 17, condition: 'sunny', rainfall: 110 },
    apr: { high: 22, low: 13, condition: 'partly-cloudy', rainfall: 90 },
    may: { high: 18, low: 10, condition: 'partly-cloudy', rainfall: 70 },
    jun: { high: 15, low: 7, condition: 'cloudy', rainfall: 55 },
    jul: { high: 14, low: 6, condition: 'cloudy', rainfall: 55 },
    aug: { high: 16, low: 7, condition: 'partly-cloudy', rainfall: 60 },
    sep: { high: 18, low: 9, condition: 'partly-cloudy', rainfall: 70 },
    oct: { high: 22, low: 12, condition: 'sunny', rainfall: 100 },
    nov: { high: 25, low: 15, condition: 'sunny', rainfall: 100 },
    dec: { high: 28, low: 18, condition: 'sunny', rainfall: 95 }
  },
  'fiji': {
    jan: { high: 31, low: 24, condition: 'rainy', rainfall: 280 },
    feb: { high: 31, low: 24, condition: 'rainy', rainfall: 290 },
    mar: { high: 31, low: 24, condition: 'rainy', rainfall: 320 },
    apr: { high: 30, low: 23, condition: 'partly-cloudy', rainfall: 180 },
    may: { high: 28, low: 22, condition: 'partly-cloudy', rainfall: 100 },
    jun: { high: 27, low: 21, condition: 'sunny', rainfall: 70 },
    jul: { high: 26, low: 20, condition: 'sunny', rainfall: 55 },
    aug: { high: 26, low: 20, condition: 'sunny', rainfall: 60 },
    sep: { high: 27, low: 21, condition: 'sunny', rainfall: 70 },
    oct: { high: 28, low: 22, condition: 'partly-cloudy', rainfall: 100 },
    nov: { high: 29, low: 23, condition: 'partly-cloudy', rainfall: 140 },
    dec: { high: 30, low: 24, condition: 'rainy', rainfall: 220 }
  },
  'tahiti': {
    jan: { high: 31, low: 24, condition: 'rainy', rainfall: 310 },
    feb: { high: 31, low: 25, condition: 'rainy', rainfall: 290 },
    mar: { high: 31, low: 24, condition: 'rainy', rainfall: 200 },
    apr: { high: 31, low: 24, condition: 'partly-cloudy', rainfall: 140 },
    may: { high: 30, low: 23, condition: 'partly-cloudy', rainfall: 90 },
    jun: { high: 29, low: 22, condition: 'sunny', rainfall: 60 },
    jul: { high: 28, low: 21, condition: 'sunny', rainfall: 50 },
    aug: { high: 28, low: 21, condition: 'sunny', rainfall: 50 },
    sep: { high: 29, low: 22, condition: 'sunny', rainfall: 50 },
    oct: { high: 29, low: 23, condition: 'partly-cloudy', rainfall: 90 },
    nov: { high: 30, low: 24, condition: 'partly-cloudy', rainfall: 150 },
    dec: { high: 31, low: 24, condition: 'rainy', rainfall: 250 }
  },
  'bora-bora': {
    jan: { high: 30, low: 25, condition: 'rainy', rainfall: 260 },
    feb: { high: 31, low: 25, condition: 'rainy', rainfall: 250 },
    mar: { high: 31, low: 25, condition: 'rainy', rainfall: 180 },
    apr: { high: 30, low: 25, condition: 'partly-cloudy', rainfall: 120 },
    may: { high: 29, low: 24, condition: 'sunny', rainfall: 80 },
    jun: { high: 28, low: 23, condition: 'sunny', rainfall: 50 },
    jul: { high: 28, low: 22, condition: 'sunny', rainfall: 40 },
    aug: { high: 28, low: 22, condition: 'sunny', rainfall: 40 },
    sep: { high: 29, low: 23, condition: 'sunny', rainfall: 50 },
    oct: { high: 29, low: 24, condition: 'partly-cloudy', rainfall: 100 },
    nov: { high: 30, low: 24, condition: 'partly-cloudy', rainfall: 170 },
    dec: { high: 30, low: 25, condition: 'rainy', rainfall: 230 }
  },
  'mauritius': {
    jan: { high: 30, low: 24, condition: 'rainy', rainfall: 220 },
    feb: { high: 30, low: 24, condition: 'rainy', rainfall: 240 },
    mar: { high: 30, low: 24, condition: 'rainy', rainfall: 220 },
    apr: { high: 28, low: 22, condition: 'partly-cloudy', rainfall: 120 },
    may: { high: 26, low: 20, condition: 'sunny', rainfall: 70 },
    jun: { high: 24, low: 18, condition: 'sunny', rainfall: 50 },
    jul: { high: 23, low: 17, condition: 'sunny', rainfall: 50 },
    aug: { high: 23, low: 17, condition: 'sunny', rainfall: 45 },
    sep: { high: 25, low: 18, condition: 'sunny', rainfall: 40 },
    oct: { high: 26, low: 19, condition: 'sunny', rainfall: 50 },
    nov: { high: 28, low: 21, condition: 'partly-cloudy', rainfall: 80 },
    dec: { high: 29, low: 23, condition: 'partly-cloudy', rainfall: 170 }
  },
  'seychelles': {
    jan: { high: 30, low: 25, condition: 'rainy', rainfall: 390 },
    feb: { high: 31, low: 25, condition: 'rainy', rainfall: 260 },
    mar: { high: 31, low: 25, condition: 'rainy', rainfall: 190 },
    apr: { high: 31, low: 26, condition: 'partly-cloudy', rainfall: 140 },
    may: { high: 30, low: 25, condition: 'sunny', rainfall: 90 },
    jun: { high: 29, low: 24, condition: 'sunny', rainfall: 60 },
    jul: { high: 28, low: 24, condition: 'sunny', rainfall: 70 },
    aug: { high: 28, low: 24, condition: 'sunny', rainfall: 90 },
    sep: { high: 29, low: 24, condition: 'sunny', rainfall: 110 },
    oct: { high: 30, low: 25, condition: 'partly-cloudy', rainfall: 140 },
    nov: { high: 30, low: 25, condition: 'partly-cloudy', rainfall: 180 },
    dec: { high: 30, low: 25, condition: 'rainy', rainfall: 300 }
  },
  'peru': {
    jan: { high: 24, low: 19, condition: 'cloudy', rainfall: 2 },
    feb: { high: 25, low: 20, condition: 'cloudy', rainfall: 1 },
    mar: { high: 25, low: 19, condition: 'cloudy', rainfall: 1 },
    apr: { high: 23, low: 18, condition: 'cloudy', rainfall: 0 },
    may: { high: 21, low: 17, condition: 'cloudy', rainfall: 0 },
    jun: { high: 19, low: 16, condition: 'cloudy', rainfall: 1 },
    jul: { high: 18, low: 15, condition: 'cloudy', rainfall: 1 },
    aug: { high: 18, low: 15, condition: 'cloudy', rainfall: 1 },
    sep: { high: 19, low: 15, condition: 'cloudy', rainfall: 1 },
    oct: { high: 20, low: 16, condition: 'cloudy', rainfall: 1 },
    nov: { high: 21, low: 17, condition: 'cloudy', rainfall: 1 },
    dec: { high: 23, low: 18, condition: 'cloudy', rainfall: 1 }
  },
  'patagonia': {
    jan: { high: 18, low: 8, condition: 'partly-cloudy', rainfall: 25 },
    feb: { high: 18, low: 8, condition: 'partly-cloudy', rainfall: 25 },
    mar: { high: 15, low: 6, condition: 'partly-cloudy', rainfall: 35 },
    apr: { high: 11, low: 3, condition: 'cloudy', rainfall: 45 },
    may: { high: 7, low: 0, condition: 'cloudy', rainfall: 50 },
    jun: { high: 5, low: -2, condition: 'snowy', rainfall: 45 },
    jul: { high: 4, low: -3, condition: 'snowy', rainfall: 40 },
    aug: { high: 6, low: -1, condition: 'cloudy', rainfall: 35 },
    sep: { high: 9, low: 1, condition: 'partly-cloudy', rainfall: 30 },
    oct: { high: 12, low: 3, condition: 'partly-cloudy', rainfall: 25 },
    nov: { high: 15, low: 5, condition: 'partly-cloudy', rainfall: 25 },
    dec: { high: 17, low: 7, condition: 'sunny', rainfall: 25 }
  },
  'bangkok': {
    jan: { high: 32, low: 22, condition: 'sunny', rainfall: 10 },
    feb: { high: 33, low: 24, condition: 'sunny', rainfall: 25 },
    mar: { high: 34, low: 26, condition: 'sunny', rainfall: 30 },
    apr: { high: 35, low: 27, condition: 'partly-cloudy', rainfall: 65 },
    may: { high: 34, low: 26, condition: 'rainy', rainfall: 190 },
    jun: { high: 33, low: 26, condition: 'rainy', rainfall: 150 },
    jul: { high: 33, low: 26, condition: 'rainy', rainfall: 155 },
    aug: { high: 32, low: 25, condition: 'rainy', rainfall: 195 },
    sep: { high: 32, low: 25, condition: 'rainy', rainfall: 320 },
    oct: { high: 32, low: 25, condition: 'rainy', rainfall: 240 },
    nov: { high: 32, low: 24, condition: 'partly-cloudy', rainfall: 50 },
    dec: { high: 31, low: 22, condition: 'sunny', rainfall: 10 }
  }
};

// Apply latitude/longitude adjustments
function adjustForLatitude(pattern, lat, isCoastal, isMountain) {
  const adjusted = JSON.parse(JSON.stringify(pattern));
  const absLat = Math.abs(lat);

  // Southern hemisphere - reverse seasons
  if (lat < 0) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const reversed = {};
    months.forEach((m, i) => {
      const oppositeMonth = months[(i + 6) % 12];
      reversed[m] = { ...adjusted[oppositeMonth] };
    });
    return reversed;
  }

  // Coastal moderation
  if (isCoastal) {
    for (const month of Object.keys(adjusted)) {
      adjusted[month].high = Math.round(adjusted[month].high * 0.95);
      adjusted[month].low = Math.round(adjusted[month].low * 1.05);
    }
  }

  // Mountain adjustment
  if (isMountain) {
    for (const month of Object.keys(adjusted)) {
      adjusted[month].high -= 5;
      adjusted[month].low -= 5;
      if (adjusted[month].high < 5 && adjusted[month].condition === 'rainy') {
        adjusted[month].condition = 'snowy';
      }
    }
  }

  return adjusted;
}

// Generate climate data for a destination
function generateClimateData(dest) {
  // Check for override first - these already have correct data for their hemisphere
  if (cityOverrides[dest.id]) {
    return JSON.parse(JSON.stringify(cityOverrides[dest.id]));
  }

  const zone = getClimateZone(dest.latitude, dest.longitude, dest.region, dest.country);
  const basePattern = climatePatterns[zone] || climatePatterns.temperate;

  // Check if coastal or mountain
  const isMountain = dest.id.includes('alps') || dest.id.includes('mountain') ||
                     dest.city.includes('Alps') || dest.id.includes('highlands') ||
                     dest.id === 'banff' || dest.id === 'aspen' || dest.id === 'chamonix' ||
                     dest.id === 'zermatt' || dest.id === 'whistler';
  const isCoastal = dest.id.includes('coast') || dest.id.includes('beach') ||
                    ['santorini', 'mykonos', 'amalfi', 'cinque-terre', 'nice', 'canary-islands',
                     'malta', 'corsica', 'sardinia', 'ibiza', 'sicily', 'crete', 'majorca'].includes(dest.id);

  return adjustForLatitude(basePattern, dest.latitude, isCoastal, isMountain);
}

// Generate full climate data
const climateData = {
  _meta: {
    generated: new Date().toISOString().split('T')[0],
    source: 'Historical averages based on latitude, geography, and climate zone classification',
    note: 'Monthly averages - actual conditions may vary. Not suitable for precise forecasting.'
  }
};

for (const dest of destinations) {
  climateData[dest.id] = generateClimateData(dest);
}

console.log(`Generated climate data for ${Object.keys(climateData).length - 1} destinations`);

// Write to file
const outputPath = path.join(__dirname, '../data/climate.json');
fs.writeFileSync(outputPath, JSON.stringify(climateData, null, 2));
console.log(`Wrote to ${outputPath}`);
