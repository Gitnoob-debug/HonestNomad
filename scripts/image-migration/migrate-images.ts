/**
 * Unsplash Image Migration Script - Batch Downloader
 *
 * Downloads images locally for review before uploading to Supabase.
 * Alternates between popular (30 imgs) and regular (20 imgs) destinations.
 *
 * Run with: UNSPLASH_ACCESS_KEY=xxx npx tsx scripts/image-migration/migrate-images.ts
 *
 * Commands:
 *   (default)    Run one batch (50 API calls = 1 popular + 1 regular destination)
 *   --init       Initialize the queue (run first time only)
 *   --status     Show current progress
 *   --continuous Run continuously with auto-wait between batches
 */

import { createApi } from 'unsplash-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import { DESTINATIONS } from '../../lib/flash/destinations';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
import {
  CONFIG,
  POPULAR_DESTINATIONS,
  Progress,
  Manifest,
  DestinationImages,
  ImageRecord,
  INITIAL_PROGRESS,
  INITIAL_MANIFEST,
} from './config';

// Parse CLI args
const args = process.argv.slice(2);
const INIT = args.includes('--init');
const STATUS = args.includes('--status');
const CONTINUOUS = args.includes('--continuous');

// Paths
const PROGRESS_PATH = path.join(process.cwd(), CONFIG.PROGRESS_FILE);
const MANIFEST_PATH = path.join(process.cwd(), CONFIG.MANIFEST_FILE);
const IMAGES_DIR = path.join(process.cwd(), CONFIG.IMAGES_DIR);
const SEARCH_TERMS_PATH = path.join(process.cwd(), 'scripts/image-migration/search-terms.json');

// Load curated search terms
interface SearchTermsData {
  [id: string]: { city: string; country: string; terms: string[] };
}
let SEARCH_TERMS: SearchTermsData = {};
try {
  if (fs.existsSync(SEARCH_TERMS_PATH)) {
    SEARCH_TERMS = JSON.parse(fs.readFileSync(SEARCH_TERMS_PATH, 'utf-8'));
    console.log(`📋 Loaded curated search terms for ${Object.keys(SEARCH_TERMS).length} destinations\n`);
  }
} catch (e) {
  console.warn('⚠️ Could not load search-terms.json, using fallback queries\n');
}

// Initialize Unsplash client
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
  fetch: fetch as any,
});

// ============================================
// File I/O helpers
// ============================================

function loadProgress(): Progress {
  try {
    if (fs.existsSync(PROGRESS_PATH)) {
      return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
    }
  } catch (e) {
    console.warn('⚠️ Could not load progress, starting fresh');
  }
  return { ...INITIAL_PROGRESS };
}

function saveProgress(progress: Progress): void {
  progress.lastUpdated = new Date().toISOString();
  fs.mkdirSync(path.dirname(PROGRESS_PATH), { recursive: true });
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

function loadManifest(): Manifest {
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    }
  } catch (e) {
    console.warn('⚠️ Could not load manifest, starting fresh');
  }
  return { ...INITIAL_MANIFEST };
}

function saveManifest(manifest: Manifest): void {
  manifest.lastUpdated = new Date().toISOString();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

// ============================================
// Queue initialization
// ============================================

function initializeQueue(): Progress {
  console.log('📋 Initializing queue with alternating popular/regular pattern...\n');

  const popular: string[] = [];
  const regular: string[] = [];

  // Sort destinations into popular and regular
  for (const dest of DESTINATIONS) {
    if (POPULAR_DESTINATIONS.has(dest.id)) {
      popular.push(dest.id);
    } else {
      regular.push(dest.id);
    }
  }

  console.log(`   Popular destinations: ${popular.length}`);
  console.log(`   Regular destinations: ${regular.length}`);

  // Build alternating queue: 1 popular (30 imgs) + 1 regular (20 imgs) = 50 requests
  const queue: { destId: string; isPopular: boolean }[] = [];
  const maxPairs = Math.max(popular.length, regular.length);

  for (let i = 0; i < maxPairs; i++) {
    // Add popular first (if available)
    if (i < popular.length) {
      queue.push({ destId: popular[i], isPopular: true });
    }
    // Then regular
    if (i < regular.length) {
      queue.push({ destId: regular[i], isPopular: false });
    }
  }

  const progress: Progress = {
    ...INITIAL_PROGRESS,
    queue,
    totalBatches: Math.ceil(queue.length / 2), // 2 destinations per batch
    stats: {
      ...INITIAL_PROGRESS.stats,
      totalDestinations: DESTINATIONS.length,
    },
  };

  saveProgress(progress);

  console.log(`\n✅ Queue initialized with ${queue.length} destinations`);
  console.log(`   Total batches needed: ${progress.totalBatches}`);
  console.log(`   Estimated time: ~${(progress.totalBatches * 70 / 60).toFixed(1)} hours\n`);

  return progress;
}

// ============================================
// Search query builder - uses CURATED search terms
// ============================================

// Max queries per destination to stay within rate limits
// Popular: 30 imgs / 5 queries = 6 per query
// Regular: 20 imgs / 4 queries = 5 per query
const MAX_QUERIES_POPULAR = 5;
const MAX_QUERIES_REGULAR = 4;

function buildSearchQueries(dest: typeof DESTINATIONS[0], totalImages: number, isPopular: boolean): { query: string; count: number }[] {
  const queries: { query: string; count: number }[] = [];

  // Use curated search terms if available
  const curated = SEARCH_TERMS[dest.id];
  let terms: string[] = [];

  if (curated && curated.terms && curated.terms.length > 0) {
    terms = curated.terms;
  } else {
    // Fallback: use highlights + generic terms
    const baseTerms = `${dest.city} ${dest.country}`;
    if (dest.highlights && dest.highlights.length > 0) {
      terms = dest.highlights.slice(0, 3).map(h => `${baseTerms} ${h}`);
    }
    terms.push(`${baseTerms} landmarks`);
    terms.push(`${baseTerms} scenic`);
  }

  // Limit number of queries based on destination type
  const maxQueries = isPopular ? MAX_QUERIES_POPULAR : MAX_QUERIES_REGULAR;
  const numQueries = Math.min(terms.length, maxQueries);

  // Distribute images across queries
  const imagesPerQuery = Math.floor(totalImages / numQueries);
  let remainder = totalImages % numQueries;

  for (let i = 0; i < numQueries; i++) {
    const count = imagesPerQuery + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;

    queries.push({
      query: terms[i],
      count,
    });
  }

  return queries;
}

// ============================================
// Image download
// ============================================

async function downloadImage(url: string, filepath: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const buffer = await response.buffer();
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, buffer);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Download failed: ${error.message}`);
    return false;
  }
}

async function fetchAndDownloadImages(
  dest: typeof DESTINATIONS[0],
  imageCount: number,
  isPopular: boolean,
  manifest: Manifest
): Promise<DestinationImages | null> {
  const destDir = path.join(IMAGES_DIR, dest.id);
  const queries = buildSearchQueries(dest, imageCount, isPopular);
  const seenIds = new Set<string>(); // Track to avoid duplicates across queries

  console.log(`   🔍 Running ${queries.length} varied searches for diversity...`);

  const images: ImageRecord[] = [];
  let imageIndex = 0;

  for (const { query, count } of queries) {
    console.log(`      "${query}" (${count} images)`);

    try {
      const result = await unsplash.search.getPhotos({
        query,
        page: 1,
        perPage: count + 5, // Request extra to account for duplicates
        orientation: 'portrait',
      });

      if (result.errors) {
        console.error(`      ❌ API Error: ${result.errors.join(', ')}`);
        continue;
      }

      const photos = result.response?.results || [];
      if (photos.length === 0) {
        console.warn(`      ⚠️ No results`);
        continue;
      }

      let downloaded = 0;
      for (const photo of photos) {
        if (downloaded >= count) break;
        if (seenIds.has(photo.id)) continue; // Skip duplicates

        seenIds.add(photo.id);
        imageIndex++;
        const filename = `${dest.id}-${String(imageIndex).padStart(3, '0')}.jpg`;
        const filepath = path.join(destDir, filename);

        const success = await downloadImage(photo.urls.regular, filepath);

        if (success) {
          // Trigger download event for Unsplash stats (required by API terms)
          try {
            await unsplash.photos.trackDownload({ downloadLocation: photo.links.download_location });
          } catch (e) {
            // Non-critical
          }

          images.push({
            filename,
            credit: `Photo by ${photo.user.name} on Unsplash`,
            photographerName: photo.user.name,
            photographerUrl: photo.user.links.html,
            unsplashId: photo.id,
            unsplashUrl: photo.links.html,
            downloadedAt: new Date().toISOString(),
            validated: false,
            validationStatus: 'pending',
          });

          downloaded++;
        }

        // Small delay between downloads
        await new Promise(r => setTimeout(r, 100));
      }

      console.log(`      ✅ ${downloaded} downloaded`);
    } catch (error: any) {
      console.error(`      ❌ Error: ${error.message}`);
    }
  }

  console.log(`   📸 Total: ${images.length} images downloaded`);

  if (images.length === 0) {
    return null;
  }

  return {
    destinationId: dest.id,
    city: dest.city,
    country: dest.country,
    isPopular: POPULAR_DESTINATIONS.has(dest.id),
    imageCount: images.length,
    images,
    completedAt: new Date().toISOString(),
    status: 'review',
  };
}

// ============================================
// Batch processing
// ============================================

async function runBatch(progress: Progress, manifest: Manifest): Promise<void> {
  // Check if we need to wait
  if (progress.nextBatchAvailableAt) {
    const waitUntil = new Date(progress.nextBatchAvailableAt);
    const now = new Date();
    if (now < waitUntil) {
      const waitMs = waitUntil.getTime() - now.getTime();
      const waitMins = Math.ceil(waitMs / 60000);
      console.log(`\n⏳ Rate limit cooldown. Next batch available in ${waitMins} minutes.`);
      console.log(`   Available at: ${waitUntil.toLocaleTimeString()}`);

      if (!CONTINUOUS) {
        console.log('\n   Run with --continuous to auto-wait, or come back later.\n');
        return;
      }

      console.log('   Waiting...\n');
      await new Promise(r => setTimeout(r, waitMs));
    }
  }

  // Get next 2 destinations from queue (1 popular + 1 regular = 50 requests)
  const batch = progress.queue.splice(0, 2);

  if (batch.length === 0) {
    console.log('\n✅ All destinations have been processed!');
    console.log('   Run: npx tsx scripts/image-migration/generate-preview.ts');
    console.log('   To generate the review page.\n');
    return;
  }

  progress.currentBatch++;
  console.log('\n' + '='.repeat(60));
  console.log(`📦 BATCH ${progress.currentBatch}/${progress.totalBatches}`);
  console.log('='.repeat(60));

  let totalImagesThisBatch = 0;

  for (const item of batch) {
    const dest = DESTINATIONS.find(d => d.id === item.destId);
    if (!dest) {
      console.warn(`⚠️ Destination not found: ${item.destId}`);
      continue;
    }

    const imageCount = item.isPopular
      ? CONFIG.POPULAR_DESTINATION_IMAGES
      : CONFIG.REGULAR_DESTINATION_IMAGES;

    console.log(`\n📍 ${dest.city}, ${dest.country} ${item.isPopular ? '⭐' : ''} (${imageCount} images)`);

    const result = await fetchAndDownloadImages(dest, imageCount, item.isPopular, manifest);

    if (result) {
      manifest.destinations[dest.id] = result;
      progress.completed.push(dest.id);
      progress.pendingReview.push(dest.id);
      progress.stats.totalImagesDownloaded += result.imageCount;
      totalImagesThisBatch += result.imageCount;
    }

    saveProgress(progress);
    saveManifest(manifest);
  }

  // Set cooldown
  progress.lastBatchCompletedAt = new Date().toISOString();
  progress.nextBatchAvailableAt = new Date(Date.now() + CONFIG.BATCH_COOLDOWN_MS).toISOString();
  saveProgress(progress);

  console.log('\n' + '-'.repeat(60));
  console.log(`✅ Batch complete! Downloaded ${totalImagesThisBatch} images`);
  console.log(`   Progress: ${progress.completed.length}/${progress.stats.totalDestinations} destinations`);
  console.log(`   Remaining: ${progress.queue.length} destinations in queue`);
  console.log(`   Next batch available: ${new Date(progress.nextBatchAvailableAt).toLocaleTimeString()}`);
  console.log('-'.repeat(60) + '\n');
}

// ============================================
// Status display
// ============================================

function showStatus(progress: Progress): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMAGE MIGRATION STATUS');
  console.log('='.repeat(60));

  const pct = ((progress.completed.length / progress.stats.totalDestinations) * 100).toFixed(1);
  console.log(`\n📈 Progress: ${progress.completed.length}/${progress.stats.totalDestinations} (${pct}%)`);

  // Progress bar
  const barWidth = 40;
  const filled = Math.round((progress.completed.length / progress.stats.totalDestinations) * barWidth);
  console.log(`   [${'█'.repeat(filled)}${'░'.repeat(barWidth - filled)}]`);

  console.log(`\n   📦 Batches: ${progress.currentBatch}/${progress.totalBatches}`);
  console.log(`   📸 Images downloaded: ${progress.stats.totalImagesDownloaded}`);
  console.log(`   ⏳ Pending review: ${progress.pendingReview.length}`);
  console.log(`   ✅ Approved: ${progress.approved.length}`);
  console.log(`   ❌ Rejected: ${progress.rejected.length}`);
  console.log(`   📋 Queue: ${progress.queue.length} remaining`);

  if (progress.nextBatchAvailableAt) {
    const nextTime = new Date(progress.nextBatchAvailableAt);
    const now = new Date();
    if (nextTime > now) {
      const minsLeft = Math.ceil((nextTime.getTime() - now.getTime()) / 60000);
      console.log(`\n⏰ Next batch available in ${minsLeft} minutes (${nextTime.toLocaleTimeString()})`);
    } else {
      console.log(`\n✅ Ready to run next batch!`);
    }
  }

  // Show next up
  if (progress.queue.length > 0) {
    console.log('\n📋 Next up:');
    progress.queue.slice(0, 4).forEach((item, i) => {
      const dest = DESTINATIONS.find(d => d.id === item.destId);
      if (dest) {
        console.log(`   ${i + 1}. ${dest.city}, ${dest.country} ${item.isPopular ? '⭐' : ''}`);
      }
    });
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
  console.log('\n📸 UNSPLASH IMAGE MIGRATION\n');

  // Check API key
  if (!process.env.UNSPLASH_ACCESS_KEY && !STATUS && !INIT) {
    console.error('❌ Missing UNSPLASH_ACCESS_KEY environment variable');
    console.log('   Get one at: https://unsplash.com/developers\n');
    process.exit(1);
  }

  let progress = loadProgress();
  const manifest = loadManifest();

  // Initialize queue
  if (INIT || progress.queue.length === 0 && progress.completed.length === 0) {
    progress = initializeQueue();
  }

  // Show status
  if (STATUS) {
    showStatus(progress);
    return;
  }

  // Run batch(es)
  if (CONTINUOUS) {
    console.log('🔄 Running in continuous mode (will auto-wait between batches)\n');
    while (progress.queue.length > 0) {
      await runBatch(progress, manifest);
      progress = loadProgress(); // Reload in case of changes
    }
  } else {
    await runBatch(progress, manifest);
  }

  showStatus(loadProgress());
}

main().catch(console.error);
