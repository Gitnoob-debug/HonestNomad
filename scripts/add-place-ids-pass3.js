/**
 * Pass 3: Try just the city name alone (no country) for remaining failures
 */
const fs = require('fs');
const path = require('path');

const API_KEY = 'sand_57ef91c9-73b3-4f0c-8856-020213f2f1ba';
const BASE_URL = 'https://api.liteapi.travel/v3.0';
const DESTINATIONS_PATH = path.join(__dirname, '..', 'data', 'destinations.json');
const DELAY_MS = 260;

async function lookupPlaceId(query) {
  const params = new URLSearchParams({ textQuery: query });
  try {
    const response = await fetch(`${BASE_URL}/data/places?${params}`, {
      headers: { 'X-API-Key': API_KEY },
    });
    if (!response.ok) return null;
    const result = await response.json();
    if (result.data && result.data.length > 0) {
      return result.data[0].placeId;
    }
    return null;
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const destinations = JSON.parse(fs.readFileSync(DESTINATIONS_PATH, 'utf8'));
  const missing = destinations.filter(d => !d.placeId);
  console.log(`Pass 3: ${missing.length} still missing`);

  let found = 0;
  for (let i = 0; i < missing.length; i++) {
    const dest = missing[i];

    // Try city name only
    let placeId = await lookupPlaceId(dest.city);

    // If that fails, try "city, country" format
    if (!placeId) {
      await sleep(DELAY_MS);
      placeId = await lookupPlaceId(`${dest.city}, ${dest.country}`);
    }

    if (placeId) {
      dest.placeId = placeId;
      found++;
    }

    await sleep(DELAY_MS);

    if ((i + 1) % 100 === 0) {
      fs.writeFileSync(DESTINATIONS_PATH, JSON.stringify(destinations, null, 2));
      console.log(`  Progress: ${i + 1}/${missing.length} (found ${found})`);
    }
  }

  fs.writeFileSync(DESTINATIONS_PATH, JSON.stringify(destinations, null, 2));
  console.log(`Pass 3 done. Found: ${found}, Still missing: ${missing.length - found}`);
}

main().catch(console.error);
