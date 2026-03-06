/**
 * Pexels Image Backfill — Over-download for tier 1/2/3
 *
 * Downloads ADDITIONAL images beyond the initial 60, using higher page offsets
 * so Pexels returns fresh results. Appends to existing image folders.
 *
 * Targets (total per destination, including existing 60):
 *   Tier 1 (megacities):      260 images  → need +200 more
 *   Tier 2 (popular):         165 images  → need +105 more
 *   Tier 3 (niche/emerging):  170 images  → need +110 more
 *
 * After backfill, run validate-images.ts to prune junk, leaving:
 *   Tier 1: ~180 clean images
 *   Tier 2: ~90 clean images
 *   Tier 3: ~60 clean images
 *
 * Usage:
 *   npx tsx scripts/image-migration/pexels-backfill.ts --continuous
 *   npx tsx scripts/image-migration/pexels-backfill.ts --status
 *   npx tsx scripts/image-migration/pexels-backfill.ts --init   (rebuild queue)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import { DESTINATIONS } from '../../lib/flash/destinations';

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

import {
  PEXELS_CONFIG,
  PEXELS_QUERY_CATEGORIES,
  PexelsManifest,
  PexelsImageRecord,
} from './pexels-config';

// ── CLI args ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const INIT = args.includes('--init');
const STATUS = args.includes('--status');
const CONTINUOUS = args.includes('--continuous');

// ── Paths ───────────────────────────────────────────────────────────

const MANIFEST_PATH = path.join(process.cwd(), PEXELS_CONFIG.MANIFEST_FILE);
const IMAGES_DIR = path.join(process.cwd(), PEXELS_CONFIG.IMAGES_DIR);
const PROGRESS_PATH = path.join(__dirname, 'backfill-progress.json');

// ── Pexels API ──────────────────────────────────────────────────────

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

// ── Tier definitions ────────────────────────────────────────────────

const TIER_1 = new Set([
  'paris', 'london', 'rome', 'barcelona', 'tokyo', 'new-york', 'dubai',
  'bangkok', 'singapore', 'istanbul', 'amsterdam', 'hong-kong', 'lisbon',
  'prague', 'berlin', 'vienna', 'sydney', 'los-angeles', 'miami',
  'bali', 'seoul', 'madrid', 'milan', 'florence', 'venice', 'kyoto',
  'san-francisco', 'cancun', 'athens', 'budapest',
  'mexico-city', 'buenos-aires', 'rio', 'toronto', 'vancouver',
  'hawaii', 'maui', 'santorini', 'dubrovnik', 'maldives',
  'morocco', 'cape-town', 'cairo', 'jerusalem',
  'las-vegas', 'chicago', 'edinburgh', 'dublin', 'copenhagen',
  'stockholm', 'oslo', 'munich', 'brussels', 'zurich',
]);

const TIER_2 = new Set([
  'porto', 'seville', 'lyon', 'nice', 'marseille', 'bordeaux',
  'krakow', 'helsinki', 'geneva', 'salzburg', 'split', 'tallinn',
  'riga', 'malta', 'naples', 'bologna', 'verona', 'turin',
  'hamburg', 'cologne', 'dresden', 'nuremberg',
  'boston', 'washington-dc', 'seattle', 'new-orleans', 'austin',
  'nashville', 'san-diego', 'portland', 'philadelphia', 'denver',
  'montreal', 'banff', 'quebec-city', 'whistler',
  'hanoi', 'chiang-mai', 'kuala-lumpur', 'taipei', 'osaka',
  'phuket', 'langkawi', 'siem-reap', 'luang-prabang',
  'delhi', 'jaipur', 'mumbai', 'goa', 'agra',
  'lima', 'cusco', 'santiago', 'cartagena', 'medellin', 'bogota',
  'costa-rica', 'peru', 'tulum', 'oaxaca', 'playa-del-carmen',
  'reykjavik', 'swiss-alps', 'amalfi', 'cinque-terre',
  'fiji', 'new-zealand', 'melbourne', 'perth', 'gold-coast',
  'zanzibar', 'kenya', 'tanzania', 'mauritius', 'seychelles',
  'jordan', 'israel', 'oman', 'abu-dhabi', 'doha',
  'sicily', 'sardinia', 'ibiza', 'crete', 'mykonos',
  'shanghai', 'beijing', 'xian', 'guilin',
  'sri-lanka', 'kathmandu', 'bhutan',
  'napa-valley', 'lake-tahoe', 'palm-springs', 'key-west',
  'savannah', 'charleston', 'aspen', 'sedona',
  'victoria-falls', 'kruger', 'johannesburg',
  'bora-bora', 'tahiti', 'auckland',
  'scottsdale', 'phoenix', 'orlando', 'atlanta',
  'calgary', 'ottawa', 'halifax',
]);

function getTier(id: string): 1 | 2 | 3 {
  if (TIER_1.has(id)) return 1;
  if (TIER_2.has(id)) return 2;
  return 3;
}

// Total images we want per tier (including the ~60 already downloaded)
const TIER_TARGETS: Record<1 | 2 | 3, number> = {
  1: 260,  // Over-download to end up with ~180 after pruning
  2: 165,  // Over-download to end up with ~90 after pruning
  3: 170,  // Over-download to end up with ~60 after pruning
};

// ── Types ───────────────────────────────────────────────────────────

interface BackfillQueueEntry {
  destId: string;
  tier: 1 | 2 | 3;
  existingImages: number;
  targetImages: number;
  additionalNeeded: number;
}

interface BackfillProgress {
  lastUpdated: string;
  queue: BackfillQueueEntry[];
  completed: string[];
  stats: {
    totalImagesDownloaded: number;
    apiCallsUsed: number;
  };
  lastBatchCompletedAt: string | null;
  nextBatchAvailableAt: string | null;
}

// ── File I/O ────────────────────────────────────────────────────────

function loadProgress(): BackfillProgress {
  try {
    if (fs.existsSync(PROGRESS_PATH)) {
      return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'));
    }
  } catch { /* start fresh */ }
  return {
    lastUpdated: new Date().toISOString(),
    queue: [],
    completed: [],
    stats: { totalImagesDownloaded: 0, apiCallsUsed: 0 },
    lastBatchCompletedAt: null,
    nextBatchAvailableAt: null,
  };
}

function saveProgress(progress: BackfillProgress): void {
  progress.lastUpdated = new Date().toISOString();
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

function loadManifest(): PexelsManifest {
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    }
  } catch { /* */ }
  return { lastUpdated: '', source: 'pexels', destinations: {} };
}

function saveManifest(manifest: PexelsManifest): void {
  manifest.lastUpdated = new Date().toISOString();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

// ── Pexels API ──────────────────────────────────────────────────────

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  alt: string | null;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
  };
}

interface PexelsResponse {
  photos: PexelsPhoto[];
  total_results: number;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function searchPexels(query: string, perPage: number = 40, page: number = 1): Promise<PexelsPhoto[]> {
  const url = new URL(PEXELS_API_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', String(Math.min(perPage, 80)));
  url.searchParams.set('page', String(page));
  url.searchParams.set('orientation', 'landscape');

  const response = await fetch(url.toString(), {
    headers: { 'Authorization': PEXELS_API_KEY },
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('Rate limited');
    throw new Error(`Pexels API error: ${response.status}`);
  }

  const data = await response.json() as PexelsResponse;
  return shuffleArray(data.photos || []);
}

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

// ── Backfill query builder ──────────────────────────────────────────
// Uses HIGHER page numbers (4-10) to get fresh results beyond what
// the initial download already fetched (pages 1-3).

interface BackfillQuery {
  query: string;
  category: string;
  count: number;
  page: number;
}

function buildBackfillQueries(
  dest: typeof DESTINATIONS[0],
  additionalNeeded: number,
): BackfillQuery[] {
  const queries: BackfillQuery[] = [];
  const baseLocation = `${dest.city} ${dest.country}`;
  let remaining = additionalNeeded;

  // Strategy: Use the same category queries but with page offsets 4-10
  // This gets us deeper into Pexels results, avoiding duplicates

  // Round 1: Landmark-focused queries (pages 4-6)
  if (dest.highlights && dest.highlights.length > 0) {
    for (let i = 0; i < Math.min(dest.highlights.length, 5); i++) {
      if (remaining <= 0) break;
      const count = Math.min(Math.ceil(additionalNeeded * 0.15), 30);
      for (let page = 4; page <= 6; page++) {
        if (remaining <= 0) break;
        const batchCount = Math.min(Math.ceil(count / 3), remaining);
        queries.push({
          query: `${dest.highlights[i]} ${dest.city} ${dest.country}`,
          category: `backfill-landmark-${i + 1}`,
          count: batchCount,
          page,
        });
        remaining -= batchCount;
      }
    }
  }

  // Round 2: Category queries with higher pages
  const categories = shuffleArray([...PEXELS_QUERY_CATEGORIES]);
  for (const cat of categories) {
    if (remaining <= 0) break;

    // Skip beach for non-coastal
    if (cat.category === 'beach' && !dest.vibes?.includes('beach')) continue;

    for (let page = 4; page <= 8; page++) {
      if (remaining <= 0) break;
      const count = Math.min(cat.maxImages + 2, remaining, 8);
      queries.push({
        query: `${baseLocation} ${cat.suffix}`,
        category: `backfill-${cat.category}`,
        count,
        page,
      });
      remaining -= count;
    }
  }

  // Round 3: Broad travel queries for any remaining
  const broadQueries = [
    `${baseLocation} travel photography`,
    `${baseLocation} tourist destination beautiful`,
    `${baseLocation} aerial drone view`,
    `${dest.city} iconic famous`,
    `${baseLocation} daytime clear weather`,
    `${dest.country} ${dest.city} vacation holiday`,
  ];

  for (const q of broadQueries) {
    if (remaining <= 0) break;
    for (let page = 3; page <= 10; page++) {
      if (remaining <= 0) break;
      const count = Math.min(15, remaining);
      queries.push({
        query: q,
        category: 'backfill-broad',
        count,
        page,
      });
      remaining -= count;
    }
  }

  return queries;
}

// ── Process one destination ─────────────────────────────────────────

async function processBackfill(
  entry: BackfillQueueEntry,
  manifest: PexelsManifest,
  progress: BackfillProgress,
): Promise<number> {
  const dest = DESTINATIONS.find(d => d.id === entry.destId);
  if (!dest) {
    console.warn(`  Destination not found: ${entry.destId}`);
    return 0;
  }

  const destDir = path.join(IMAGES_DIR, dest.id);
  fs.mkdirSync(destDir, { recursive: true });

  // Find the highest existing image index
  const existingFiles = fs.existsSync(destDir)
    ? fs.readdirSync(destDir).filter(f => f.endsWith('.jpg')).sort()
    : [];
  let imageIndex = existingFiles.length;

  // Collect existing Pexels IDs to avoid duplicates
  const existingPexelsIds = new Set<number>();
  const manifestEntry = manifest.destinations[entry.destId];
  if (manifestEntry) {
    for (const img of manifestEntry.images) {
      existingPexelsIds.add(img.pexelsId);
    }
  }

  const queries = buildBackfillQueries(dest, entry.additionalNeeded);

  console.log(`   Queries planned: ${queries.length}`);
  console.log(`   Need: +${entry.additionalNeeded} images (have ${entry.existingImages}, target ${entry.targetImages})`);

  const newImages: PexelsImageRecord[] = [];
  let apiCalls = 0;
  let downloaded = 0;
  const target = entry.additionalNeeded;

  for (const { query, category, count, page } of queries) {
    if (downloaded >= target) break;

    try {
      const photos = await searchPexels(query, count + 10, page);
      apiCalls++;

      let batchDownloaded = 0;
      for (const photo of photos) {
        if (downloaded >= target) break;
        if (batchDownloaded >= count) break;
        if (existingPexelsIds.has(photo.id)) continue;

        existingPexelsIds.add(photo.id);
        imageIndex++;
        const filename = `${dest.id}-${String(imageIndex).padStart(3, '0')}.jpg`;
        const filepath = path.join(destDir, filename);

        const imageUrl = photo.src[PEXELS_CONFIG.IMAGE_SIZE] || photo.src.large;
        const success = await downloadImage(imageUrl, filepath);

        if (success) {
          newImages.push({
            filename,
            credit: `Photo by ${photo.photographer} on Pexels`,
            photographerName: photo.photographer,
            photographerUrl: photo.photographer_url,
            photographerId: photo.photographer_id,
            pexelsId: photo.id,
            pexelsUrl: photo.url,
            avgColor: photo.avg_color,
            altText: photo.alt || null,
            downloadedAt: new Date().toISOString(),
            queryUsed: category,
            width: photo.width,
            height: photo.height,
          });
          downloaded++;
          batchDownloaded++;
        }

        await new Promise(r => setTimeout(r, 80));
      }
    } catch (error: any) {
      if (error.message.includes('Rate limited')) throw error;
      console.error(`      Error: ${error.message}`);
    }

    await new Promise(r => setTimeout(r, 100));
  }

  // Update manifest with new images appended
  if (manifestEntry && newImages.length > 0) {
    manifestEntry.images.push(...newImages);
    manifestEntry.imageCount = manifestEntry.images.length;
  }

  progress.stats.apiCallsUsed += apiCalls;
  progress.stats.totalImagesDownloaded += downloaded;

  console.log(`   Downloaded: +${downloaded} images (${apiCalls} API calls)`);
  console.log(`   Total for ${dest.id}: ${imageIndex} images`);

  return downloaded;
}

// ── Queue initialization ────────────────────────────────────────────

function initializeQueue(): BackfillProgress {
  console.log('\nInitializing backfill queue...\n');

  const manifest = loadManifest();
  const queue: BackfillQueueEntry[] = [];

  // Only backfill destinations that already have images
  for (const [destId, destData] of Object.entries(manifest.destinations)) {
    const tier = getTier(destId);
    const target = TIER_TARGETS[tier];
    const existing = destData.imageCount || 0;
    const additional = target - existing;

    if (additional > 0) {
      queue.push({
        destId,
        tier,
        existingImages: existing,
        targetImages: target,
        additionalNeeded: additional,
      });
    }
  }

  // Sort: tier 1 first, then tier 2, then tier 3
  queue.sort((a, b) => a.tier - b.tier || a.destId.localeCompare(b.destId));

  const t1 = queue.filter(e => e.tier === 1);
  const t2 = queue.filter(e => e.tier === 2);
  const t3 = queue.filter(e => e.tier === 3);
  const totalExtra = queue.reduce((s, e) => s + e.additionalNeeded, 0);

  console.log(`  Tier 1: ${t1.length} destinations, +${t1.reduce((s, e) => s + e.additionalNeeded, 0)} images`);
  console.log(`  Tier 2: ${t2.length} destinations, +${t2.reduce((s, e) => s + e.additionalNeeded, 0)} images`);
  console.log(`  Tier 3: ${t3.length} destinations, +${t3.reduce((s, e) => s + e.additionalNeeded, 0)} images`);
  console.log(`  Total: ${queue.length} destinations, +${totalExtra} images to download`);
  console.log('');

  const progress: BackfillProgress = {
    lastUpdated: new Date().toISOString(),
    queue,
    completed: [],
    stats: { totalImagesDownloaded: 0, apiCallsUsed: 0 },
    lastBatchCompletedAt: null,
    nextBatchAvailableAt: null,
  };

  saveProgress(progress);
  return progress;
}

// ── Run one batch ───────────────────────────────────────────────────

async function runBatch(progress: BackfillProgress, manifest: PexelsManifest): Promise<void> {
  // Check cooldown
  if (progress.nextBatchAvailableAt) {
    const waitUntil = new Date(progress.nextBatchAvailableAt);
    const now = new Date();
    if (now < waitUntil) {
      const waitMs = waitUntil.getTime() - now.getTime();
      const waitMins = Math.ceil(waitMs / 60000);
      console.log(`\nCooldown active. Next batch in ${waitMins} minutes.`);
      if (!CONTINUOUS) {
        console.log('Run with --continuous to auto-wait.\n');
        return;
      }
      console.log('Waiting...\n');
      await new Promise(r => setTimeout(r, waitMs));
    }
  }

  const entry = progress.queue.shift();
  if (!entry) {
    console.log('\nAll backfill complete!\n');
    return;
  }

  const tierLabel = `T${entry.tier}`;
  console.log('\n' + '='.repeat(70));
  console.log(`BACKFILL [${tierLabel}] ${entry.destId} — need +${entry.additionalNeeded} (${entry.existingImages} -> ${entry.targetImages})`);
  console.log(`Queue: ${progress.completed.length + 1}/${progress.completed.length + progress.queue.length + 1}`);
  console.log('='.repeat(70));

  try {
    const downloaded = await processBackfill(entry, manifest, progress);
    progress.completed.push(entry.destId);

    if (downloaded < entry.additionalNeeded) {
      console.log(`   Note: Only got ${downloaded}/${entry.additionalNeeded} — Pexels may have limited results for deeper pages`);
    }
  } catch (error: any) {
    if (error.message.includes('Rate limited')) {
      progress.queue.unshift(entry);
      console.log('\nRate limited - will retry after cooldown');
    } else {
      console.error(`\nError: ${error.message}`);
      progress.completed.push(entry.destId); // Skip on error
    }
  }

  // Set cooldown
  progress.lastBatchCompletedAt = new Date().toISOString();
  progress.nextBatchAvailableAt = new Date(Date.now() + PEXELS_CONFIG.BATCH_COOLDOWN_MS).toISOString();

  saveProgress(progress);
  saveManifest(manifest);

  const remaining = progress.queue.length;
  console.log(`\n  Done. ${progress.completed.length} completed, ${remaining} remaining.`);
  console.log(`  Total extra images: ${progress.stats.totalImagesDownloaded}`);
  console.log(`  API calls: ${progress.stats.apiCallsUsed}`);
  console.log('');
}

// ── Status ──────────────────────────────────────────────────────────

function showStatus(progress: BackfillProgress): void {
  console.log('\n' + '='.repeat(60));
  console.log('  PEXELS BACKFILL STATUS');
  console.log('='.repeat(60));

  const total = progress.completed.length + progress.queue.length;
  const pct = total > 0 ? ((progress.completed.length / total) * 100).toFixed(1) : '0';

  console.log(`\n  Progress: ${progress.completed.length}/${total} (${pct}%)`);
  console.log(`  Extra images downloaded: ${progress.stats.totalImagesDownloaded}`);
  console.log(`  API calls: ${progress.stats.apiCallsUsed}`);

  const t1left = progress.queue.filter(e => e.tier === 1).length;
  const t2left = progress.queue.filter(e => e.tier === 2).length;
  const t3left = progress.queue.filter(e => e.tier === 3).length;
  console.log(`\n  Remaining: T1=${t1left}, T2=${t2left}, T3=${t3left}`);

  // Estimate time: each batch takes ~7min cooldown
  const hoursLeft = (progress.queue.length * 7) / 60;
  console.log(`  Est. time: ~${hoursLeft.toFixed(1)} hours`);

  if (progress.queue.length > 0) {
    console.log('\n  Next up:');
    for (const e of progress.queue.slice(0, 5)) {
      console.log(`    [T${e.tier}] ${e.destId} — +${e.additionalNeeded} images`);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

// ── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n  PEXELS BACKFILL — Over-download for quality pruning\n');
  console.log('  Tier 1 (megacities):  -> 260 total (prune to ~180)');
  console.log('  Tier 2 (popular):     -> 165 total (prune to ~90)');
  console.log('  Tier 3 (niche):       -> 170 total (prune to ~60)\n');

  if (!PEXELS_API_KEY && !STATUS) {
    console.error('Missing PEXELS_API_KEY');
    process.exit(1);
  }

  let progress = loadProgress();

  if (INIT || (progress.queue.length === 0 && progress.completed.length === 0)) {
    progress = initializeQueue();
    if (STATUS) {
      showStatus(progress);
      return;
    }
  }

  if (STATUS) {
    showStatus(progress);
    return;
  }

  const manifest = loadManifest();

  if (CONTINUOUS) {
    console.log('Running in continuous mode\n');
    while (progress.queue.length > 0) {
      await runBatch(progress, manifest);
      progress = loadProgress();
    }
    console.log('\nBackfill complete!\n');
  } else {
    await runBatch(progress, manifest);
    showStatus(loadProgress());
  }
}

main().catch(console.error);
