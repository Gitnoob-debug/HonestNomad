/**
 * POI Migration Script - Fetches POIs from Google Places and caches them locally
 *
 * Usage:
 *   npx tsx scripts/poi-migration/migrate-pois-google.ts [options]
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

import { GooglePlacesClient } from '../../lib/google-places/client';
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
const PROGRESS_FILE = path.join(process.cwd(), 'scripts', 'poi-migration', 'migration-progress-google.json');

// Rate limiting - Google Places has generous limits but we'll be conservative
const DELAY_BETWEEN_REQUESTS = 500; // 500ms between requests

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
  client: GooglePlacesClient,
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
    apiSource: 'google',
    apiVersion: 'v1',
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
        const rating = poi.googleRating ? ` (${poi.googleRating.toFixed(1)}★)` : '';
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
  console.log('🚀 POI Migration Script (Google Places)');
  console.log('=======================================');

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error('❌ GOOGLE_PLACES_API_KEY not found in environment');
    console.log('   Add it to your .env.local file');
    console.log('   Get your key from: https://console.cloud.google.com/apis/credentials');
    process.exit(1);
  }

  console.log('✓ Google Places API key found');

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No data will be saved');
  }

  ensureDirectories();

  const client = new GooglePlacesClient(apiKey);
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

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`\n❌ Failed to process ${destinationId}:`, errorMessage);

      // Check for rate limit error
      if (errorMessage?.includes('429') || errorMessage?.includes('RESOURCE_EXHAUSTED')) {
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
        progress.failedDestinations.push({ id: destinationId, error: errorMessage });
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
