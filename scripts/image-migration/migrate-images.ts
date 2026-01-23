/**
 * Unsplash Image Migration Script - High Quality Batch Downloader
 *
 * Downloads FULL RESOLUTION images with maximum variety per destination.
 * - 50 images per destination (uses full hourly API quota)
 * - Full resolution downloads (~2-3MB each)
 * - 10 different query categories for variety (landmarks, food, nightlife, etc.)
 * - One destination per hour = ~17 days for 410 destinations
 *
 * Run with: npx tsx scripts/image-migration/migrate-images.ts --continuous
 *
 * Commands:
 *   (default)    Run one batch (1 destination = 50 images)
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
  QUERY_CATEGORIES,
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
    console.warn('Could not load progress, starting fresh');
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
    console.warn('Could not load manifest, starting fresh');
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
  console.log('\n📋 Initializing queue...\n');

  // Simple queue: all destinations, one per batch
  const queue: string[] = DESTINATIONS.map(d => d.id);

  const progress: Progress = {
    ...INITIAL_PROGRESS,
    queue,
    totalBatches: queue.length, // One destination per batch
    stats: {
      ...INITIAL_PROGRESS.stats,
      totalDestinations: DESTINATIONS.length,
    },
  };

  saveProgress(progress);

  const estimatedHours = queue.length * 1.05; // ~1 hour per destination + buffer
  const estimatedDays = (estimatedHours / 24).toFixed(1);

  console.log(`✅ Queue initialized with ${queue.length} destinations`);
  console.log(`   Images per destination: ${CONFIG.IMAGES_PER_DESTINATION}`);
  console.log(`   Total images to download: ~${queue.length * CONFIG.IMAGES_PER_DESTINATION}`);
  console.log(`   Estimated storage: ~${((queue.length * CONFIG.IMAGES_PER_DESTINATION * 2) / 1024).toFixed(1)} GB`);
  console.log(`   Estimated time: ~${estimatedDays} days\n`);

  return progress;
}

// ============================================
// Search query builder - VARIETY focused
// ============================================

function buildSearchQueries(dest: typeof DESTINATIONS[0]): { query: string; count: number }[] {
  const queries: { query: string; count: number }[] = [];
  const baseLocation = `${dest.city} ${dest.country}`;

  // Use 10 different query categories for maximum variety
  // Each gets 5 images (10 categories x 5 = 50 images = full hourly quota)
  const imagesPerCategory = Math.floor(CONFIG.IMAGES_PER_DESTINATION / QUERY_CATEGORIES.length);
  let remainder = CONFIG.IMAGES_PER_DESTINATION % QUERY_CATEGORIES.length;

  for (const category of QUERY_CATEGORIES) {
    const count = imagesPerCategory + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;

    queries.push({
      query: `${baseLocation} ${category}`,
      count,
    });
  }

  return queries;
}

// ============================================
// Image download - FULL RESOLUTION
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
    console.error(`      Download failed: ${error.message}`);
    return false;
  }
}

async function fetchAndDownloadImages(
  dest: typeof DESTINATIONS[0],
  manifest: Manifest
): Promise<DestinationImages | null> {
  const destDir = path.join(IMAGES_DIR, dest.id);
  const queries = buildSearchQueries(dest);
  const seenIds = new Set<string>(); // Track to avoid duplicates across queries

  console.log(`\n   🔍 Running ${queries.length} varied searches for maximum diversity...`);

  const images: ImageRecord[] = [];
  let imageIndex = 0;
  let apiCallsUsed = 0;

  for (const { query, count } of queries) {
    // Extract category from query for logging
    const category = query.replace(`${dest.city} ${dest.country} `, '');
    console.log(`      [${category}] requesting ${count} images...`);

    try {
      const result = await unsplash.search.getPhotos({
        query,
        page: 1,
        perPage: count + 3, // Request extra to account for duplicates
        orientation: 'landscape', // Better for cards and hero images
      });
      apiCallsUsed++;

      if (result.errors) {
        console.error(`         API Error: ${result.errors.join(', ')}`);
        continue;
      }

      const photos = result.response?.results || [];
      if (photos.length === 0) {
        console.warn(`         No results`);
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

        // Use FULL resolution for maximum quality
        const success = await downloadImage(photo.urls.full, filepath);

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
            queryUsed: category,
          });

          downloaded++;
        }

        // Small delay between downloads to be nice to Unsplash
        await new Promise(r => setTimeout(r, 150));
      }

      console.log(`         ✅ ${downloaded} downloaded`);
    } catch (error: any) {
      console.error(`         Error: ${error.message}`);
    }

    // Small delay between API calls
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n   📸 Total: ${images.length} full-resolution images downloaded`);
  console.log(`   🔧 API calls used: ${apiCallsUsed}/${CONFIG.REQUESTS_PER_HOUR}`);

  if (images.length === 0) {
    return null;
  }

  return {
    destinationId: dest.id,
    city: dest.city,
    country: dest.country,
    imageCount: images.length,
    images,
    completedAt: new Date().toISOString(),
    status: 'review',
  };
}

// ============================================
// Batch processing - ONE destination per batch
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

  // Get next destination from queue
  const destId = progress.queue.shift();

  if (!destId) {
    console.log('\n🎉 ALL DESTINATIONS COMPLETE!');
    console.log('   Run: npx tsx scripts/image-migration/generate-preview.ts');
    console.log('   To generate the review page.\n');
    return;
  }

  const dest = DESTINATIONS.find(d => d.id === destId);
  if (!dest) {
    console.warn(`⚠️ Destination not found: ${destId}`);
    saveProgress(progress);
    return;
  }

  progress.currentBatch++;
  console.log('\n' + '='.repeat(70));
  console.log(`📍 BATCH ${progress.currentBatch}/${progress.totalBatches}: ${dest.city}, ${dest.country}`);
  console.log('='.repeat(70));
  console.log(`   Target: ${CONFIG.IMAGES_PER_DESTINATION} full-resolution images`);

  const result = await fetchAndDownloadImages(dest, manifest);

  if (result) {
    manifest.destinations[dest.id] = result;
    progress.completed.push(dest.id);
    progress.pendingReview.push(dest.id);
    progress.stats.totalImagesDownloaded += result.imageCount;
  }

  // Set cooldown
  progress.lastBatchCompletedAt = new Date().toISOString();
  progress.nextBatchAvailableAt = new Date(Date.now() + CONFIG.BATCH_COOLDOWN_MS).toISOString();

  saveProgress(progress);
  saveManifest(manifest);

  const pct = ((progress.completed.length / progress.stats.totalDestinations) * 100).toFixed(1);
  console.log('\n' + '-'.repeat(70));
  console.log(`✅ Batch complete!`);
  console.log(`   Progress: ${progress.completed.length}/${progress.stats.totalDestinations} destinations (${pct}%)`);
  console.log(`   Total images: ${progress.stats.totalImagesDownloaded}`);
  console.log(`   Remaining: ${progress.queue.length} destinations`);
  console.log(`   Next batch: ${new Date(progress.nextBatchAvailableAt).toLocaleTimeString()}`);
  console.log('-'.repeat(70) + '\n');
}

// ============================================
// Status display
// ============================================

function showStatus(progress: Progress): void {
  console.log('\n' + '='.repeat(70));
  console.log('📊 IMAGE MIGRATION STATUS - Full Resolution Mode');
  console.log('='.repeat(70));

  const pct = progress.stats.totalDestinations > 0
    ? ((progress.completed.length / progress.stats.totalDestinations) * 100).toFixed(1)
    : '0';

  console.log(`\n📈 Progress: ${progress.completed.length}/${progress.stats.totalDestinations} destinations (${pct}%)`);

  // Progress bar
  const barWidth = 50;
  const filled = progress.stats.totalDestinations > 0
    ? Math.round((progress.completed.length / progress.stats.totalDestinations) * barWidth)
    : 0;
  console.log(`   [${'█'.repeat(filled)}${'░'.repeat(barWidth - filled)}]`);

  console.log(`\n   📸 Total images: ${progress.stats.totalImagesDownloaded}`);
  console.log(`   💾 Est. storage: ~${((progress.stats.totalImagesDownloaded * 2) / 1024).toFixed(2)} GB`);
  console.log(`   📋 Queue remaining: ${progress.queue.length}`);

  const estimatedHoursLeft = progress.queue.length * 1.05;
  const estimatedDaysLeft = (estimatedHoursLeft / 24).toFixed(1);
  console.log(`   ⏱️  Est. time remaining: ~${estimatedDaysLeft} days`);

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
    progress.queue.slice(0, 5).forEach((destId, i) => {
      const dest = DESTINATIONS.find(d => d.id === destId);
      if (dest) {
        console.log(`   ${i + 1}. ${dest.city}, ${dest.country}`);
      }
    });
    if (progress.queue.length > 5) {
      console.log(`   ... and ${progress.queue.length - 5} more`);
    }
  }

  // Show recent completions
  if (progress.completed.length > 0) {
    console.log('\n✅ Recently completed:');
    progress.completed.slice(-5).reverse().forEach((destId) => {
      const dest = DESTINATIONS.find(d => d.id === destId);
      if (dest) {
        console.log(`   • ${dest.city}, ${dest.country}`);
      }
    });
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
  console.log('\n🖼️  UNSPLASH IMAGE MIGRATION - Full Resolution Mode\n');
  console.log('   • 50 images per destination');
  console.log('   • Full resolution (~2MB each)');
  console.log('   • 10 query categories for variety');
  console.log('   • One destination per hour\n');

  // Check API key
  if (!process.env.UNSPLASH_ACCESS_KEY && !STATUS && !INIT) {
    console.error('❌ Missing UNSPLASH_ACCESS_KEY environment variable');
    console.log('   Get one at: https://unsplash.com/developers\n');
    process.exit(1);
  }

  let progress = loadProgress();
  const manifest = loadManifest();

  // Initialize queue if needed
  if (INIT || (progress.queue.length === 0 && progress.completed.length === 0)) {
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
    console.log('\n🎉 Migration complete! All destinations processed.\n');
  } else {
    await runBatch(progress, manifest);
  }

  showStatus(loadProgress());
}

main().catch(console.error);
