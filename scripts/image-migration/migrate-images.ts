/**
 * Unsplash Image Migration Script - Tiered Batch Downloader
 *
 * Downloads FULL RESOLUTION images with tiered counts per destination:
 * - Major destinations (150+ POIs): 100 images across 2 batches
 * - Standard destinations: 50 images in 1 batch
 * - Full resolution (~2-3MB each)
 * - 10 different query categories for variety
 * - One batch per hour (Unsplash rate limit)
 *
 * Run with: npx tsx scripts/image-migration/migrate-images.ts --continuous
 *
 * Commands:
 *   (default)    Run one batch
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
  MAJOR_DESTINATIONS,
  PRIORITY_DESTINATIONS,
  getImageCount,
  Progress,
  QueueEntry,
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
  console.log('\n📋 Initializing priority queue (major cities + zero-coverage)...\n');

  // Only queue PRIORITY destinations (major cities + zero-coverage)
  // Major destinations get 2 batches of 50 = 100 images
  // Zero-coverage destinations get 1 batch of 50 images
  const queue: QueueEntry[] = [];
  let totalImages = 0;
  let majorCount = 0;
  let zeroCoverageCount = 0;

  const priorityDests = DESTINATIONS.filter(d => PRIORITY_DESTINATIONS.has(d.id));

  for (const dest of priorityDests) {
    const isMajor = MAJOR_DESTINATIONS.has(dest.id);
    const imageCount = getImageCount(dest.id);

    if (isMajor) {
      majorCount++;
      // Split into 2 batches of 50 each (respecting hourly API limit)
      queue.push({
        destId: dest.id,
        batchPart: 1,
        totalParts: 2,
        imageCount: 50,
        isMajor: true,
      });
      queue.push({
        destId: dest.id,
        batchPart: 2,
        totalParts: 2,
        imageCount: 50,
        isMajor: true,
      });
    } else {
      zeroCoverageCount++;
      queue.push({
        destId: dest.id,
        batchPart: 1,
        totalParts: 1,
        imageCount: 50,
        isMajor: false,
      });
    }
    totalImages += imageCount;
  }

  const progress: Progress = {
    ...INITIAL_PROGRESS,
    queue,
    totalBatches: queue.length,
    stats: {
      ...INITIAL_PROGRESS.stats,
      totalDestinations: priorityDests.length,
    },
  };

  saveProgress(progress);

  const estimatedHours = queue.length * 1.05;
  const estimatedDays = (estimatedHours / 24).toFixed(1);

  console.log(`✅ Priority queue initialized:`);
  console.log(`   🏙️  Major destinations (100 images each): ${majorCount}`);
  console.log(`   🆘 Zero-coverage destinations (50 images each): ${zeroCoverageCount}`);
  console.log(`   📦 Total batches: ${queue.length}`);
  console.log(`   📸 Total images to download: ~${totalImages}`);
  console.log(`   💾 Estimated storage: ~${((totalImages * 2) / 1024).toFixed(1)} GB`);
  console.log(`   ⏱️  Estimated time: ~${estimatedDays} days\n`);
  console.log(`   ℹ️  Skipping ${DESTINATIONS.length - priorityDests.length} standard destinations (run with full queue later)\n`);

  return progress;
}

// ============================================
// Search query builder - VARIETY focused
// ============================================

function buildSearchQueries(
  dest: typeof DESTINATIONS[0],
  targetCount: number,
  categoryOffset: number = 0,
): { query: string; count: number }[] {
  const queries: { query: string; count: number }[] = [];
  const baseLocation = `${dest.city} ${dest.country}`;

  // Distribute images evenly across query categories
  // For batch part 2 of major destinations, offset the categories for variety
  const categories = [...QUERY_CATEGORIES];
  if (categoryOffset > 0) {
    // Rotate categories so batch 2 starts from different angles
    const rotated = categories.splice(0, categoryOffset % categories.length);
    categories.push(...rotated);
  }

  const imagesPerCategory = Math.floor(targetCount / categories.length);
  let remainder = targetCount % categories.length;

  for (const category of categories) {
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
  manifest: Manifest,
  batchImageCount: number = 50,
  batchPart: number = 1,
): Promise<DestinationImages | null> {
  const destDir = path.join(IMAGES_DIR, dest.id);
  // For batch part 2, offset categories by 5 so we get different search angles
  const queries = buildSearchQueries(dest, batchImageCount, (batchPart - 1) * 5);

  // Collect already-downloaded image IDs for this destination to avoid duplicates across batches
  const seenIds = new Set<string>();
  const existingDest = manifest.destinations[dest.id];
  if (existingDest) {
    for (const img of existingDest.images) {
      seenIds.add(img.unsplashId);
    }
  }

  console.log(`\n   🔍 Running ${queries.length} varied searches (batch part ${batchPart})...`);
  if (seenIds.size > 0) {
    console.log(`   ℹ️  Skipping ${seenIds.size} already-downloaded images from previous batch`);
  }

  const images: ImageRecord[] = [];
  // Start numbering after existing images
  let imageIndex = existingDest ? existingDest.images.length : 0;
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

  // Get next entry from queue
  const entry = progress.queue.shift();

  if (!entry) {
    console.log('\n🎉 ALL BATCHES COMPLETE!');
    console.log('   Run: npx tsx scripts/image-migration/generate-preview.ts');
    console.log('   To generate the review page.\n');
    return;
  }

  const dest = DESTINATIONS.find(d => d.id === entry.destId);
  if (!dest) {
    console.warn(`⚠️ Destination not found: ${entry.destId}`);
    saveProgress(progress);
    return;
  }

  progress.currentBatch++;
  const tierLabel = entry.isMajor ? '🏙️ MAJOR' : '🏘️ STANDARD';
  const partLabel = entry.totalParts > 1 ? ` (part ${entry.batchPart}/${entry.totalParts})` : '';

  console.log('\n' + '='.repeat(70));
  console.log(`📍 BATCH ${progress.currentBatch}/${progress.totalBatches}: ${dest.city}, ${dest.country} ${tierLabel}${partLabel}`);
  console.log('='.repeat(70));
  console.log(`   Target: ${entry.imageCount} full-resolution images`);
  if (entry.isMajor) {
    console.log(`   Total for destination: ${getImageCount(entry.destId)} images across ${entry.totalParts} batches`);
  }

  const result = await fetchAndDownloadImages(dest, manifest, entry.imageCount, entry.batchPart);

  if (result) {
    if (entry.batchPart > 1 && manifest.destinations[dest.id]) {
      // Append to existing destination entry (batch part 2+)
      const existing = manifest.destinations[dest.id];
      existing.images.push(...result.images);
      existing.imageCount = existing.images.length;
      existing.completedAt = result.completedAt;
      progress.stats.totalImagesDownloaded += result.imageCount;
    } else {
      // First batch for this destination
      manifest.destinations[dest.id] = result;
      progress.stats.totalImagesDownloaded += result.imageCount;
    }

    // Only mark as completed when all parts are done
    const isLastPart = entry.batchPart >= entry.totalParts;
    if (isLastPart) {
      if (!progress.completed.includes(dest.id)) {
        progress.completed.push(dest.id);
      }
      if (!progress.pendingReview.includes(dest.id)) {
        progress.pendingReview.push(dest.id);
      }
      manifest.destinations[dest.id].status = 'review';
    } else {
      manifest.destinations[dest.id].status = 'downloading';
    }
  }

  // Set cooldown
  progress.lastBatchCompletedAt = new Date().toISOString();
  progress.nextBatchAvailableAt = new Date(Date.now() + CONFIG.BATCH_COOLDOWN_MS).toISOString();

  saveProgress(progress);
  saveManifest(manifest);

  // Count unique completed destinations
  const uniqueCompleted = new Set(progress.completed).size;
  const pct = ((uniqueCompleted / progress.stats.totalDestinations) * 100).toFixed(1);
  console.log('\n' + '-'.repeat(70));
  console.log(`✅ Batch complete!`);
  console.log(`   Progress: ${uniqueCompleted}/${progress.stats.totalDestinations} destinations (${pct}%)`);
  console.log(`   Total images: ${progress.stats.totalImagesDownloaded}`);
  console.log(`   Remaining batches: ${progress.queue.length}`);
  console.log(`   Next batch: ${new Date(progress.nextBatchAvailableAt).toLocaleTimeString()}`);
  console.log('-'.repeat(70) + '\n');
}

// ============================================
// Status display
// ============================================

function showStatus(progress: Progress): void {
  console.log('\n' + '='.repeat(70));
  console.log('📊 IMAGE MIGRATION STATUS - Tiered Mode');
  console.log('='.repeat(70));

  const uniqueCompleted = new Set(progress.completed).size;
  const pct = progress.stats.totalDestinations > 0
    ? ((uniqueCompleted / progress.stats.totalDestinations) * 100).toFixed(1)
    : '0';

  console.log(`\n📈 Progress: ${uniqueCompleted}/${progress.stats.totalDestinations} destinations (${pct}%)`);

  // Progress bar
  const barWidth = 50;
  const filled = progress.stats.totalDestinations > 0
    ? Math.round((uniqueCompleted / progress.stats.totalDestinations) * barWidth)
    : 0;
  console.log(`   [${'█'.repeat(filled)}${'░'.repeat(barWidth - filled)}]`);

  // Count major vs standard in queue
  const majorBatches = progress.queue.filter(e => e.isMajor).length;
  const standardBatches = progress.queue.filter(e => !e.isMajor).length;

  console.log(`\n   📸 Total images: ${progress.stats.totalImagesDownloaded}`);
  console.log(`   💾 Est. storage: ~${((progress.stats.totalImagesDownloaded * 2) / 1024).toFixed(2)} GB`);
  console.log(`   📋 Batches remaining: ${progress.queue.length} (${majorBatches} major, ${standardBatches} standard)`);

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
    progress.queue.slice(0, 5).forEach((entry, i) => {
      const dest = DESTINATIONS.find(d => d.id === entry.destId);
      if (dest) {
        const tier = entry.isMajor ? '🏙️' : '🏘️';
        const part = entry.totalParts > 1 ? ` (part ${entry.batchPart}/${entry.totalParts})` : '';
        console.log(`   ${i + 1}. ${tier} ${dest.city}, ${dest.country}${part} — ${entry.imageCount} images`);
      }
    });
    if (progress.queue.length > 5) {
      console.log(`   ... and ${progress.queue.length - 5} more batches`);
    }
  }

  // Show recent completions
  if (progress.completed.length > 0) {
    console.log('\n✅ Recently completed:');
    // Deduplicate and show last 5
    const seen = new Set<string>();
    const recentUnique: string[] = [];
    for (let i = progress.completed.length - 1; i >= 0 && recentUnique.length < 5; i--) {
      if (!seen.has(progress.completed[i])) {
        seen.add(progress.completed[i]);
        recentUnique.push(progress.completed[i]);
      }
    }
    recentUnique.forEach((destId) => {
      const dest = DESTINATIONS.find(d => d.id === destId);
      const imgCount = progress.stats.totalImagesDownloaded; // approximate
      if (dest) {
        const tier = MAJOR_DESTINATIONS.has(destId) ? '🏙️ 100' : '🏘️ 50';
        console.log(`   • ${dest.city}, ${dest.country} (${tier} images)`);
      }
    });
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
  console.log('\n🖼️  UNSPLASH IMAGE MIGRATION - Tiered Mode\n');
  console.log(`   • Major destinations: ${CONFIG.IMAGES_PER_MAJOR_DESTINATION} images (${MAJOR_DESTINATIONS.size} cities)`);
  console.log(`   • Standard destinations: ${CONFIG.IMAGES_PER_STANDARD_DESTINATION} images`);
  console.log('   • Full resolution (~2MB each)');
  console.log('   • 10 query categories for variety');
  console.log('   • One batch per hour\n');

  // Check API key
  if (!process.env.UNSPLASH_ACCESS_KEY && !STATUS && !INIT) {
    console.error('❌ Missing UNSPLASH_ACCESS_KEY environment variable');
    console.log('   Get one at: https://unsplash.com/developers\n');
    process.exit(1);
  }

  let progress = loadProgress();
  const manifest = loadManifest();

  // Initialize queue if needed
  if (INIT) {
    progress = initializeQueue();
    showStatus(progress);
    console.log('Queue initialized. Run without --init to start downloading.\n');
    return;
  }

  if (progress.queue.length === 0 && progress.completed.length === 0) {
    console.log('No queue found. Run with --init to initialize.\n');
    return;
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
