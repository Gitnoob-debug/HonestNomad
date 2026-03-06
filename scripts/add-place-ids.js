/**
 * One-time script: Adds Google Place IDs to data/destinations.json
 * using LiteAPI's /data/places endpoint.
 *
 * Cost: ~$7.15 (715 destinations x $0.01/call)
 * Runtime: ~3 minutes (rate-limited to 4 req/sec)
 *
 * Usage: node scripts/add-place-ids.js
 */

const fs = require('fs');
const path = require('path');

const API_KEY = 'sand_57ef91c9-73b3-4f0c-8856-020213f2f1ba';
const BASE_URL = 'https://api.liteapi.travel/v3.0';
const DESTINATIONS_PATH = path.join(__dirname, '..', 'data', 'destinations.json');

// Rate limit: ~4 requests per second
const DELAY_MS = 260;

async function lookupPlaceId(city, country) {
  const query = `${city} ${country}`;
  const params = new URLSearchParams({ textQuery: query, type: 'locality' });

  try {
    const response = await fetch(`${BASE_URL}/data/places?${params}`, {
      headers: { 'X-API-Key': API_KEY },
    });

    if (!response.ok) {
      console.error(`  ERROR ${response.status} for "${query}"`);
      return null;
    }

    const result = await response.json();
    if (result.data && result.data.length > 0) {
      return result.data[0].placeId;
    }
    return null;
  } catch (error) {
    console.error(`  FETCH ERROR for "${query}":`, error.message);
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const destinations = JSON.parse(fs.readFileSync(DESTINATIONS_PATH, 'utf8'));
  console.log(`Loaded ${destinations.length} destinations`);

  let found = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < destinations.length; i++) {
    const dest = destinations[i];

    // Skip if already has placeId
    if (dest.placeId) {
      skipped++;
      continue;
    }

    const placeId = await lookupPlaceId(dest.city, dest.country);

    if (placeId) {
      dest.placeId = placeId;
      found++;
      console.log(`[${i + 1}/${destinations.length}] ${dest.city}, ${dest.country} → ${placeId}`);
    } else {
      failed++;
      console.log(`[${i + 1}/${destinations.length}] ${dest.city}, ${dest.country} → NOT FOUND`);
    }

    // Rate limit
    await sleep(DELAY_MS);

    // Save progress every 50 destinations
    if ((i + 1) % 50 === 0) {
      fs.writeFileSync(DESTINATIONS_PATH, JSON.stringify(destinations, null, 2));
      console.log(`  --- Saved progress at ${i + 1} ---`);
    }
  }

  // Final save
  fs.writeFileSync(DESTINATIONS_PATH, JSON.stringify(destinations, null, 2));

  console.log('\n=== DONE ===');
  console.log(`Found: ${found}`);
  console.log(`Skipped (already had placeId): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${destinations.length}`);
}

main().catch(console.error);
