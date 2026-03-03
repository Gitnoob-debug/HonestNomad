/**
 * Populate Google Place IDs for all destinations
 *
 * Uses LiteAPI's /data/places endpoint to look up the Google Place ID
 * for each destination by "city country" query. Adds a `placeId` field
 * to each entry in data/destinations.json.
 *
 * Cost: ~$0.01 per lookup × 715 destinations = ~$7.15
 * Runtime: ~3 minutes (rate limited to 5 req/sec)
 *
 * Usage:
 *   npx tsx scripts/populate-place-ids.ts
 *   npx tsx scripts/populate-place-ids.ts --dry-run   # preview without writing
 *   npx tsx scripts/populate-place-ids.ts --skip-existing  # only fill missing
 */

import fs from 'fs';
import path from 'path';

const LITEAPI_BASE_URL = 'https://api.liteapi.travel/v3.0';
const DESTINATIONS_PATH = path.join(process.cwd(), 'data', 'destinations.json');

// Rate limiting: 5 requests per second
const RATE_LIMIT_DELAY = 220; // ms between requests (~4.5/sec, safe margin)

interface Destination {
  id: string;
  city: string;
  country: string;
  placeId?: string;
  [key: string]: unknown;
}

function getApiKey(): string {
  const key = process.env.LITEAPI_PRODUCTION_KEY || process.env.LITEAPI_SANDBOX_KEY;
  if (!key) {
    throw new Error(
      'LiteAPI key not configured. Set LITEAPI_SANDBOX_KEY or LITEAPI_PRODUCTION_KEY in .env.local\n' +
      'Tip: Run with: LITEAPI_SANDBOX_KEY=your_key npx tsx scripts/populate-place-ids.ts'
    );
  }
  return key;
}

async function lookupPlaceId(query: string): Promise<string | null> {
  const params = new URLSearchParams({
    textQuery: query,
    type: 'locality',
  });

  const url = `${LITEAPI_BASE_URL}/data/places?${params}`;

  const response = await fetch(url, {
    headers: {
      'X-API-Key': getApiKey(),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`  ✗ API error [${response.status}]: ${errorText}`);
    return null;
  }

  const data = await response.json();

  if (data.data && data.data.length > 0) {
    return data.data[0].place_id;
  }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipExisting = args.includes('--skip-existing');

  console.log('=== Populate Place IDs for Destinations ===');
  console.log(`  Dry run: ${dryRun}`);
  console.log(`  Skip existing: ${skipExisting}`);
  console.log('');

  // Load destinations
  const raw = fs.readFileSync(DESTINATIONS_PATH, 'utf-8');
  const destinations: Destination[] = JSON.parse(raw);
  console.log(`  Loaded ${destinations.length} destinations`);

  // Filter destinations to process
  const toProcess = skipExisting
    ? destinations.filter(d => !d.placeId)
    : destinations;

  console.log(`  Processing ${toProcess.length} destinations`);
  if (dryRun) {
    console.log('  (DRY RUN — no changes will be written)');
  }
  console.log('');

  let found = 0;
  let failed = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (let i = 0; i < toProcess.length; i++) {
    const dest = toProcess[i];
    const query = `${dest.city} ${dest.country}`;
    const progress = `[${i + 1}/${toProcess.length}]`;

    if (dryRun) {
      console.log(`  ${progress} Would look up: "${query}"`);
      continue;
    }

    try {
      const placeId = await lookupPlaceId(query);

      if (placeId) {
        // Find and update in the main array
        const idx = destinations.findIndex(d => d.id === dest.id);
        if (idx !== -1) {
          destinations[idx].placeId = placeId;
        }
        found++;
        console.log(`  ${progress} ✓ ${dest.city}, ${dest.country} → ${placeId}`);
      } else {
        failed++;
        failures.push(`${dest.city}, ${dest.country} (${dest.id})`);
        console.log(`  ${progress} ✗ ${dest.city}, ${dest.country} — no result`);
      }
    } catch (error) {
      failed++;
      failures.push(`${dest.city}, ${dest.country} (${dest.id}): ${error}`);
      console.log(`  ${progress} ✗ ${dest.city}, ${dest.country} — error: ${error}`);
    }

    // Rate limiting
    await sleep(RATE_LIMIT_DELAY);
  }

  if (!dryRun && found > 0) {
    // Write updated destinations back
    fs.writeFileSync(DESTINATIONS_PATH, JSON.stringify(destinations, null, 2) + '\n');
    console.log('');
    console.log(`  ✓ Written ${found} placeIds to ${DESTINATIONS_PATH}`);
  }

  // Summary
  console.log('');
  console.log('=== Summary ===');
  console.log(`  Found:   ${found}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Skipped: ${skipped}`);

  if (failures.length > 0) {
    console.log('');
    console.log('  Failed destinations:');
    for (const f of failures) {
      console.log(`    - ${f}`);
    }
  }

  // Count total with placeIds
  const withPlaceId = destinations.filter(d => d.placeId).length;
  console.log('');
  console.log(`  Total with placeId: ${withPlaceId}/${destinations.length}`);
}

main().catch(console.error);
