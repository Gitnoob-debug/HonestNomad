/**
 * Unsplash Image Migration Script
 *
 * Respects rate limits (50 requests/hour) and can be resumed.
 * Run with: npx tsx scripts/image-migration/migrate-images.ts
 *
 * Options:
 *   --dry-run     Preview what would be done without making requests
 *   --continuous  Keep running with delays (instead of stopping after 50 requests)
 *   --reset       Clear progress and start fresh
 */

import { createApi } from 'unsplash-js';
import * as fs from 'fs';
import * as path from 'path';
import { DESTINATIONS } from '../../lib/flash/destinations';
import {
  CONFIG,
  POPULAR_DESTINATIONS,
  MigrationProgress,
  INITIAL_PROGRESS,
} from './config';

// Parse CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const CONTINUOUS = args.includes('--continuous');
const RESET = args.includes('--reset');

// Initialize Unsplash client
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
});

// Load or initialize progress
function loadProgress(): MigrationProgress {
  const progressPath = path.join(process.cwd(), CONFIG.PROGRESS_FILE);

  if (RESET) {
    console.log('🔄 Resetting progress...');
    return { ...INITIAL_PROGRESS };
  }

  try {
    if (fs.existsSync(progressPath)) {
      const data = fs.readFileSync(progressPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('⚠️ Could not load progress file, starting fresh');
  }

  return { ...INITIAL_PROGRESS };
}

// Save progress
function saveProgress(progress: MigrationProgress): void {
  const progressPath = path.join(process.cwd(), CONFIG.PROGRESS_FILE);
  const dir = path.dirname(progressPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  progress.lastUpdated = new Date().toISOString();
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
}

// Build search query for a destination
function buildSearchQuery(dest: typeof DESTINATIONS[0]): string {
  // Combine city + country + key highlights for better results
  const terms = [dest.city];

  // Add country for context (helps with generic city names)
  if (dest.country !== dest.city) {
    terms.push(dest.country);
  }

  // Add a vibe keyword for variety
  if (dest.vibes.includes('beach')) terms.push('beach');
  else if (dest.vibes.includes('nature')) terms.push('landscape');
  else if (dest.vibes.includes('culture')) terms.push('architecture');
  else terms.push('travel');

  return terms.join(' ');
}

// Fetch images for a single destination
async function fetchDestinationImages(
  dest: typeof DESTINATIONS[0],
  imageCount: number
): Promise<{ urls: string[]; credits: string[] } | null> {
  const query = buildSearchQuery(dest);

  try {
    const result = await unsplash.search.getPhotos({
      query,
      page: 1,
      perPage: imageCount,
      orientation: 'portrait', // Better for mobile cards
    });

    if (result.errors) {
      console.error(`  ❌ API Error: ${result.errors.join(', ')}`);
      return null;
    }

    const photos = result.response?.results || [];

    if (photos.length === 0) {
      console.warn(`  ⚠️ No results for "${query}"`);
      return null;
    }

    // Extract URLs and credits
    const urls = photos.map(p => p.urls.regular); // Good quality, not too large
    const credits = photos.map(p => `Photo by ${p.user.name} on Unsplash`);

    return { urls, credits };
  } catch (error: any) {
    console.error(`  ❌ Fetch error: ${error.message}`);
    return null;
  }
}

// Trigger download event (required by Unsplash API terms)
async function triggerDownloadEvent(photoId: string): Promise<void> {
  try {
    await unsplash.photos.trackDownload({ downloadLocation: photoId });
  } catch (e) {
    // Non-critical, just for stats
  }
}

// Sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Main migration function
async function runMigration(): Promise<void> {
  console.log('='.repeat(60));
  console.log('📸 UNSPLASH IMAGE MIGRATION');
  console.log('='.repeat(60));

  if (!process.env.UNSPLASH_ACCESS_KEY) {
    console.error('\n❌ Missing UNSPLASH_ACCESS_KEY environment variable');
    console.log('   Get one at: https://unsplash.com/developers');
    console.log('   Then run: UNSPLASH_ACCESS_KEY=your_key npx tsx scripts/image-migration/migrate-images.ts');
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('\n🏃 DRY RUN MODE - No actual requests will be made\n');
  }

  // Load progress
  const progress = loadProgress();

  // Get destinations that haven't been completed
  const completedSet = new Set(progress.completedDestinations);
  const failedSet = new Set(progress.failedDestinations.map(f => f.id));

  const pendingDestinations = DESTINATIONS.filter(
    d => !completedSet.has(d.id) && !failedSet.has(d.id)
  );

  // Sort: popular first, then by region
  pendingDestinations.sort((a, b) => {
    const aPopular = POPULAR_DESTINATIONS.has(a.id) ? 0 : 1;
    const bPopular = POPULAR_DESTINATIONS.has(b.id) ? 0 : 1;
    if (aPopular !== bPopular) return aPopular - bPopular;
    return a.region.localeCompare(b.region);
  });

  console.log(`\n📊 Status:`);
  console.log(`   Total destinations: ${DESTINATIONS.length}`);
  console.log(`   Completed: ${progress.completedDestinations.length}`);
  console.log(`   Failed: ${progress.failedDestinations.length}`);
  console.log(`   Pending: ${pendingDestinations.length}`);
  console.log(`   Images downloaded: ${progress.stats.imagesDownloaded}`);

  if (pendingDestinations.length === 0) {
    console.log('\n✅ All destinations have been processed!');
    return;
  }

  // Start session
  progress.currentSession = {
    startedAt: new Date().toISOString(),
    requestCount: 0,
  };

  console.log(`\n🚀 Starting session (max ${CONFIG.REQUESTS_PER_HOUR} requests)...\n`);

  let requestsThisSession = 0;

  for (const dest of pendingDestinations) {
    // Check rate limit
    if (requestsThisSession >= CONFIG.REQUESTS_PER_HOUR && !CONTINUOUS) {
      console.log(`\n⏸️ Rate limit reached (${CONFIG.REQUESTS_PER_HOUR} requests)`);
      console.log('   Run again in ~1 hour, or use --continuous flag');
      break;
    }

    // If continuous mode and at limit, wait
    if (requestsThisSession >= CONFIG.REQUESTS_PER_HOUR && CONTINUOUS) {
      const waitTime = 60 * 60 * 1000 + 5 * 60 * 1000; // 1hr 5min
      console.log(`\n⏳ Rate limit reached. Waiting 1hr 5min before continuing...`);
      await sleep(waitTime);
      requestsThisSession = 0;
    }

    const isPopular = POPULAR_DESTINATIONS.has(dest.id);
    const imageCount = isPopular
      ? CONFIG.POPULAR_DESTINATION_IMAGES
      : CONFIG.REGULAR_DESTINATION_IMAGES;

    console.log(
      `[${requestsThisSession + 1}/${CONFIG.REQUESTS_PER_HOUR}] ${dest.city}, ${dest.country} ` +
      `(${isPopular ? '⭐ popular' : 'regular'}, ${imageCount} images)`
    );

    if (DRY_RUN) {
      console.log(`  → Would search: "${buildSearchQuery(dest)}"`);
      requestsThisSession++;
      continue;
    }

    // Fetch images
    const result = await fetchDestinationImages(dest, imageCount);

    if (result) {
      console.log(`  ✅ Got ${result.urls.length} images`);

      // For now, just store the URLs in the progress file
      // Later: download and upload to Supabase
      progress.completedDestinations.push(dest.id);
      progress.stats.completed++;
      progress.stats.imagesDownloaded += result.urls.length;

      // TODO: Save image URLs to destinationImages.ts or database
      // This is where you'd add the Supabase upload logic
    } else {
      progress.failedDestinations.push({
        id: dest.id,
        error: 'No images found or API error',
        attempts: 1,
      });
      progress.stats.failed++;
    }

    requestsThisSession++;
    progress.currentSession!.requestCount = requestsThisSession;

    // Save progress after each destination
    saveProgress(progress);

    // Delay between requests
    await sleep(CONFIG.DELAY_BETWEEN_REQUESTS_MS);
  }

  // Session complete
  progress.currentSession = null;
  saveProgress(progress);

  console.log('\n' + '='.repeat(60));
  console.log('📊 SESSION COMPLETE');
  console.log('='.repeat(60));
  console.log(`   Requests this session: ${requestsThisSession}`);
  console.log(`   Total completed: ${progress.stats.completed}/${DESTINATIONS.length}`);
  console.log(`   Total images: ${progress.stats.imagesDownloaded}`);

  const remaining = DESTINATIONS.length - progress.stats.completed - progress.stats.failed;
  if (remaining > 0) {
    const sessionsNeeded = Math.ceil(remaining / CONFIG.REQUESTS_PER_HOUR);
    console.log(`\n⏰ ${remaining} destinations remaining (~${sessionsNeeded} more sessions)`);
  }
}

// Run
runMigration().catch(console.error);
