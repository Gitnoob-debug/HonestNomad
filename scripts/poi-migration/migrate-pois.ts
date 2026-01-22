/**
 * POI Migration Script - Fetches POIs from Foursquare and caches them locally
 *
 * Usage:
 *   npx ts-node scripts/poi-migration/migrate-pois.ts [options]
 *
 * Options:
 *   --test           Run on just 3 sample cities (Paris, Lisbon, Dubrovnik)
 *   --city=<id>      Run on a specific city by ID
 *   --path=<type>    Only fetch a specific path type (classic, foodie, etc.)
 *   --limit=<n>      Limit POIs per path (default: 30)
 *   --continuous     Keep running, respecting rate limits
 *   --dry-run        Don't save, just show what would be fetched
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { FoursquareClient } from '../../lib/foursquare/client';
import { DESTINATIONS } from '../../lib/flash/destinations';
import type {
  ItineraryPathType,
  CachedPOI,
  DestinationPOICache,
  POIMigrationProgress,
} from '../../types/poi';

const ALL_PATH_TYPES: ItineraryPathType[] = [
  'classic',
  'foodie',
  'adventure',
  'cultural',
  'relaxation',
  'nightlife',
  'trendy',
];

const TEST_CITIES = ['paris', 'lisbon', 'dubrovnik'];

// Directories
const DATA_DIR = path.join(process.cwd(), 'data', 'pois');
const PROGRESS_FILE = path.join(process.cwd(), 'scripts', 'poi-migration', 'migration-progress.json');

// Rate limiting
const REQUESTS_PER_MINUTE = 50; // Foursquare free tier allows ~50/min
const DELAY_BETWEEN_REQUESTS = Math.ceil(60000 / REQUESTS_PER_MINUTE); // ~1.2 seconds

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadProgress(): POIMigrationProgress | null {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return null;
}

function saveProgress(progress: POIMigrationProgress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function savePOICache(cache: DestinationPOICache) {
  const filePath = path.join(DATA_DIR, `${cache.destinationId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(cache, null, 2));
  console.log(`  ✓ Saved ${cache.totalPOIs} POIs to ${filePath}`);
}

function loadPOICache(destinationId: string): DestinationPOICache | null {
  const filePath = path.join(DATA_DIR, `${destinationId}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return null;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchDestinationPOIs(
  client: FoursquareClient,
  destinationId: string,
  pathTypes: ItineraryPathType[],
  limitPerPath: number,
  dryRun: boolean
): Promise<DestinationPOICache | null> {
  const destination = DESTINATIONS.find(d => d.id === destinationId);
  if (!destination) {
    console.error(`  ✗ Destination not found: ${destinationId}`);
    return null;
  }

  console.log(`\n📍 Fetching POIs for ${destination.city}, ${destination.country}`);
  console.log(`   Coordinates: ${destination.latitude}, ${destination.longitude}`);

  const cache: DestinationPOICache = {
    destinationId,
    city: destination.city,
    country: destination.country,
    latitude: destination.latitude,
    longitude: destination.longitude,
    paths: {},
    lastFetched: new Date().toISOString(),
    apiSource: 'foursquare',
    apiVersion: 'v3',
    totalPOIs: 0,
  };

  for (const pathType of pathTypes) {
    console.log(`   → Fetching ${pathType} POIs...`);

    if (dryRun) {
      console.log(`     [DRY RUN] Would fetch up to ${limitPerPath} ${pathType} POIs`);
      continue;
    }

    try {
      const pois = await client.fetchPOIsForPath(
        destinationId,
        destination.latitude,
        destination.longitude,
        pathType,
        limitPerPath
      );

      cache.paths[pathType] = pois;
      cache.totalPOIs += pois.length;

      console.log(`     ✓ Found ${pois.length} ${pathType} POIs`);

      // Show top 3 for verification
      pois.slice(0, 3).forEach((poi, i) => {
        const rating = poi.fsqRating ? ` (${poi.fsqRating.toFixed(1)}★)` : '';
        console.log(`       ${i + 1}. ${poi.name}${rating}`);
      });

      // Rate limit delay
      await sleep(DELAY_BETWEEN_REQUESTS);
    } catch (error) {
      console.error(`     ✗ Error fetching ${pathType}:`, error);
    }
  }

  return cache;
}

async function runMigration(options: {
  testMode: boolean;
  specificCity?: string;
  specificPath?: ItineraryPathType;
  limitPerPath: number;
  continuous: boolean;
  dryRun: boolean;
}) {
  console.log('🚀 POI Migration Script');
  console.log('========================');

  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) {
    console.error('❌ FOURSQUARE_API_KEY not found in environment');
    console.log('   Add it to your .env.local file');
    process.exit(1);
  }

  console.log('✓ Foursquare API key found');

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No data will be saved');
  }

  ensureDirectories();

  const client = new FoursquareClient(apiKey);
  const pathTypes = options.specificPath ? [options.specificPath] : ALL_PATH_TYPES;

  // Determine which destinations to process
  let destinationIds: string[];
  if (options.specificCity) {
    destinationIds = [options.specificCity];
  } else if (options.testMode) {
    destinationIds = TEST_CITIES;
    console.log(`\n📋 TEST MODE: Processing ${destinationIds.length} sample cities`);
    console.log(`   Cities: ${destinationIds.join(', ')}`);
  } else {
    destinationIds = DESTINATIONS.map(d => d.id);
    console.log(`\n📋 Processing all ${destinationIds.length} destinations`);
  }

  console.log(`📂 Path types: ${pathTypes.join(', ')}`);
  console.log(`📊 Limit per path: ${options.limitPerPath}`);

  // Load or create progress
  let progress = loadProgress();
  if (!progress || options.testMode || options.specificCity) {
    progress = {
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      totalDestinations: destinationIds.length,
      completedDestinations: [],
      failedDestinations: [],
    };
  }

  // Check for rate limit cooldown
  if (progress.rateLimitCooldownUntil) {
    const cooldownEnd = new Date(progress.rateLimitCooldownUntil);
    if (cooldownEnd > new Date()) {
      const waitMinutes = Math.ceil((cooldownEnd.getTime() - Date.now()) / 60000);
      console.log(`⏳ Rate limit cooldown active. Waiting ${waitMinutes} minutes...`);

      if (!options.continuous) {
        console.log('   Use --continuous to auto-resume after cooldown');
        process.exit(0);
      }

      await sleep(cooldownEnd.getTime() - Date.now());
    }
    delete progress.rateLimitCooldownUntil;
  }

  // Filter out already completed destinations
  const pendingDestinations = destinationIds.filter(
    id => !progress!.completedDestinations.includes(id)
  );

  console.log(`\n📊 Progress: ${progress.completedDestinations.length}/${destinationIds.length} completed`);
  console.log(`   Pending: ${pendingDestinations.length} destinations\n`);

  let processedCount = 0;
  const startTime = Date.now();

  for (const destinationId of pendingDestinations) {
    progress.currentDestination = destinationId;
    progress.lastUpdatedAt = new Date().toISOString();
    saveProgress(progress);

    try {
      const cache = await fetchDestinationPOIs(
        client,
        destinationId,
        pathTypes,
        options.limitPerPath,
        options.dryRun
      );

      if (cache && !options.dryRun) {
        savePOICache(cache);
        progress.completedDestinations.push(destinationId);
      }

      processedCount++;

      // Progress update
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = processedCount / elapsed;
      const remaining = pendingDestinations.length - processedCount;
      const eta = remaining / rate;

      console.log(`\n📈 Progress: ${progress.completedDestinations.length}/${destinationIds.length}`);
      console.log(`   Rate: ${rate.toFixed(2)} cities/sec | ETA: ${Math.ceil(eta / 60)} min`);

    } catch (error: any) {
      console.error(`\n❌ Failed to process ${destinationId}:`, error.message);

      // Check for rate limit error
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        console.log('⚠️ Rate limit hit! Setting cooldown...');
        progress.rateLimitCooldownUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
        saveProgress(progress);

        if (options.continuous) {
          console.log('   Will resume in 1 hour...');
          await sleep(60 * 60 * 1000);
          delete progress.rateLimitCooldownUntil;
        } else {
          console.log('   Run with --continuous to auto-resume');
          process.exit(0);
        }
      } else {
        progress.failedDestinations.push({ id: destinationId, error: error.message });
      }
    }

    saveProgress(progress);
  }

  // Final summary
  console.log('\n========================================');
  console.log('🎉 Migration Complete!');
  console.log('========================================');
  console.log(`✓ Completed: ${progress.completedDestinations.length}`);
  console.log(`✗ Failed: ${progress.failedDestinations.length}`);

  if (progress.failedDestinations.length > 0) {
    console.log('\nFailed destinations:');
    progress.failedDestinations.forEach(f => {
      console.log(`  - ${f.id}: ${f.error}`);
    });
  }

  // Calculate total POIs
  let totalPOIs = 0;
  progress.completedDestinations.forEach(id => {
    const cache = loadPOICache(id);
    if (cache) totalPOIs += cache.totalPOIs;
  });
  console.log(`\n📊 Total POIs cached: ${totalPOIs}`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  testMode: args.includes('--test'),
  specificCity: args.find(a => a.startsWith('--city='))?.split('=')[1],
  specificPath: args.find(a => a.startsWith('--path='))?.split('=')[1] as ItineraryPathType | undefined,
  limitPerPath: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '30'),
  continuous: args.includes('--continuous'),
  dryRun: args.includes('--dry-run'),
};

runMigration(options).catch(console.error);
