/**
 * Second pass: Try destinations that failed in pass 1
 * Uses no type filter (broader search)
 */

const fs = require('fs');
const path = require('path');

const API_KEY = 'sand_57ef91c9-73b3-4f0c-8856-020213f2f1ba';
const BASE_URL = 'https://api.liteapi.travel/v3.0';
const DESTINATIONS_PATH = path.join(__dirname, '..', 'data', 'destinations.json');
const DELAY_MS = 260;

async function lookupPlaceId(city, country) {
  const query = `${city} ${country}`;
  // No type filter — broader search
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
  console.log(`Pass 2: ${missing.length} destinations without placeId`);

  let found = 0;
  let failed = 0;

  for (let i = 0; i < missing.length; i++) {
    const dest = missing[i];
    const placeId = await lookupPlaceId(dest.city, dest.country);

    if (placeId) {
      dest.placeId = placeId;
      found++;
      if (found % 10 === 0) console.log(`  Found ${found} so far...`);
    } else {
      failed++;
    }

    await sleep(DELAY_MS);

    if ((i + 1) % 100 === 0) {
      fs.writeFileSync(DESTINATIONS_PATH, JSON.stringify(destinations, null, 2));
      console.log(`  --- Progress: ${i + 1}/${missing.length} (found ${found}, failed ${failed}) ---`);
    }
  }

  fs.writeFileSync(DESTINATIONS_PATH, JSON.stringify(destinations, null, 2));
  console.log(`\nPass 2 done. Found: ${found}, Still missing: ${failed}`);
}

main().catch(console.error);
