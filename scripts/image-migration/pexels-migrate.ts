/**
 * Pexels Image Migration Script
 *
 * Runs IN PARALLEL with Unsplash migration for faster image collection.
 * Uses smarter queries based on destination highlights and vibes.
 *
 * Pexels advantages:
 * - 200 requests/hour (4x Unsplash)
 * - 80 results per request
 * - Free with attribution
 *
 * Run with: npx tsx scripts/image-migration/pexels-migrate.ts --continuous
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
  PexelsProgress,
  PexelsManifest,
  PexelsDestinationImages,
  PexelsImageRecord,
  INITIAL_PEXELS_PROGRESS,
  INITIAL_PEXELS_MANIFEST,
} from './pexels-config';

// CLI args
const args = process.argv.slice(2);
const INIT = args.includes('--init');
const STATUS = args.includes('--status');
const CONTINUOUS = args.includes('--continuous');

// Paths
const PROGRESS_PATH = path.join(process.cwd(), PEXELS_CONFIG.PROGRESS_FILE);
const MANIFEST_PATH = path.join(process.cwd(), PEXELS_CONFIG.MANIFEST_FILE);
const IMAGES_DIR = path.join(process.cwd(), PEXELS_CONFIG.IMAGES_DIR);

// Pexels API
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

// ============================================
// File I/O
// ============================================

function loadProgress(): PexelsProgress {
  try {
    if (fs.existsSync(PROGRESS_PATH)) {
      return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
    }
  } catch (e) {
    console.warn('Could not load progress, starting fresh');
  }
  return { ...INITIAL_PEXELS_PROGRESS };
}

function saveProgress(progress: PexelsProgress): void {
  progress.lastUpdated = new Date().toISOString();
  fs.mkdirSync(path.dirname(PROGRESS_PATH), { recursive: true });
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

function loadManifest(): PexelsManifest {
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    }
  } catch (e) {
    console.warn('Could not load manifest, starting fresh');
  }
  return { ...INITIAL_PEXELS_MANIFEST };
}

function saveManifest(manifest: PexelsManifest): void {
  manifest.lastUpdated = new Date().toISOString();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

// ============================================
// Smart Query Builder
// ============================================

interface QueryPlan {
  query: string;
  category: string;
  count: number;
  page?: number; // For pagination variety
}

// Shuffle array for randomization
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function buildSmartQueries(dest: typeof DESTINATIONS[0]): QueryPlan[] {
  const queries: QueryPlan[] = [];
  const baseLocation = `${dest.city} ${dest.country}`;

  // ============================================
  // ADAPTIVE SIZING: Detect small vs large destinations
  // ============================================
  const highlightCount = dest.highlights?.length || 0;
  const isSmallDestination = highlightCount <= 3 || dest.averageCost < 2000;
  const isMajorCity = highlightCount >= 4 && dest.averageCost >= 3000;

  // Adjust limits based on destination size
  const perLandmarkLimit = isSmallDestination ? 6 : 3;
  const perCategoryMultiplier = isSmallDestination ? 1.5 : 1;

  // ============================================
  // LANDMARK QUERIES from highlights
  // ============================================
  if (dest.highlights && dest.highlights.length > 0) {
    const landmarkCount = Math.min(dest.highlights.length, 4);
    for (let i = 0; i < landmarkCount; i++) {
      queries.push({
        query: `${dest.highlights[i]} ${dest.city}`,
        category: `landmark-${i + 1}`,
        count: perLandmarkLimit,
        page: 1,
      });
    }
  }

  // ============================================
  // UNIVERSAL QUERIES for small destinations
  // These work even for tiny villages
  // ============================================
  if (isSmallDestination) {
    const universalQueries = [
      { query: `${baseLocation} scenic beautiful view`, category: 'scenic', count: 5 },
      { query: `${baseLocation} village town charming`, category: 'charm', count: 4 },
      { query: `${baseLocation} countryside landscape nature`, category: 'landscape', count: 4 },
      { query: `${baseLocation} travel destination tourism`, category: 'travel', count: 4 },
      { query: `${dest.country} ${dest.vibes?.[0] || 'beautiful'} travel`, category: 'country-vibe', count: 3 },
      { query: `${baseLocation} local life authentic`, category: 'authentic', count: 3 },
    ];

    for (const uq of universalQueries) {
      queries.push({ ...uq, page: Math.floor(Math.random() * 2) + 1 });
    }
  }

  // ============================================
  // VIBE-BASED BOOSTING
  // ============================================
  const vibeBoosts: Record<string, string[]> = {
    beach: ['beach', 'waterfront', 'sunset'],
    food: ['local-cuisine', 'restaurant', 'cafe', 'street-food', 'drinks'],
    nightlife: ['night', 'blue-hour', 'people', 'lifestyle'],
    culture: ['culture', 'festival', 'market', 'art'],
    nature: ['park', 'panorama', 'sunrise', 'sunset'],
    city: ['skyline', 'streets', 'modern', 'neighborhood'],
    history: ['historic', 'old-town', 'religious', 'palace'],
    adventure: ['panorama', 'waterfront', 'people'],
    relaxation: ['beach', 'park', 'cafe', 'sunset'],
    luxury: ['restaurant', 'modern', 'skyline', 'palace'],
    romance: ['sunset', 'cafe', 'old-town', 'waterfront'],
  };

  const categoryBoosts = new Map<string, number>();
  for (const vibe of dest.vibes || []) {
    const boostedCategories = vibeBoosts[vibe] || [];
    for (const cat of boostedCategories) {
      categoryBoosts.set(cat, (categoryBoosts.get(cat) || 0) + 1);
    }
  }

  // ============================================
  // CATEGORY QUERIES
  // ============================================
  let remainingImages = PEXELS_CONFIG.IMAGES_PER_DESTINATION - queries.reduce((sum, q) => sum + q.count, 0);

  // Filter categories - skip urban-only for small destinations
  let applicableCategories = [...PEXELS_QUERY_CATEGORIES];
  if (isSmallDestination) {
    const urbanOnly = ['skyline', 'modern', 'neighborhood', 'night', 'blue-hour'];
    applicableCategories = applicableCategories.filter(
      (c: any) => !urbanOnly.includes(c.category)
    );
  }

  // Shuffle for variety
  const shuffledCategories = shuffleArray(applicableCategories);

  for (const categoryConfig of shuffledCategories) {
    const { category, suffix, weight, maxImages } = categoryConfig as any;

    // Skip beach for non-coastal
    if (category === 'beach' && !dest.vibes?.includes('beach')) {
      continue;
    }

    // Calculate count with size adjustment
    const baseCount = maxImages || Math.ceil(weight * 2);
    const boost = categoryBoosts.get(category) || 0;
    const sizeAdjustedMax = Math.ceil((maxImages || 4) * perCategoryMultiplier);
    const count = Math.min(baseCount + (boost > 0 ? 1 : 0), sizeAdjustedMax);

    if (remainingImages <= 0) break;

    // Major cities: more page variety (1-3), small towns: pages 1-2
    const maxPage = isMajorCity ? 3 : 2;
    const page = Math.floor(Math.random() * maxPage) + 1;

    queries.push({
      query: `${baseLocation} ${suffix}`,
      category,
      count: Math.min(count, remainingImages),
      page,
    });

    remainingImages -= count;
  }

  // ============================================
  // FALLBACK: General travel queries if still need images
  // ============================================
  if (remainingImages > 5) {
    queries.push({
      query: `${baseLocation} travel photography beautiful`,
      category: 'fallback-travel',
      count: Math.min(remainingImages, 8),
      page: 1,
    });
  }

  if (remainingImages > 0) {
    queries.push({
      query: `${dest.country} tourism destination`,
      category: 'fallback-country',
      count: remainingImages,
      page: 1,
    });
  }

  return queries;
}

// ============================================
// Pexels API
// ============================================

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  avg_color: string;
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
  next_page?: string;
}

async function searchPexels(query: string, perPage: number = 15, page: number = 1): Promise<PexelsPhoto[]> {
  const url = new URL(PEXELS_API_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', String(Math.min(perPage + 10, 80))); // Request extra for variety
  url.searchParams.set('page', String(page)); // Pagination for variety
  url.searchParams.set('orientation', 'landscape');

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': PEXELS_API_KEY,
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limited - wait before retrying');
    }
    throw new Error(`Pexels API error: ${response.status}`);
  }

  const data = await response.json() as PexelsResponse;
  const photos = data.photos || [];

  // Shuffle results to avoid always picking the same "top" photos
  return shuffleArray(photos);
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

// ============================================
// Main Processing
// ============================================

async function processDestination(
  dest: typeof DESTINATIONS[0],
  manifest: PexelsManifest,
  progress: PexelsProgress
): Promise<PexelsDestinationImages | null> {
  const destDir = path.join(IMAGES_DIR, dest.id);
  const queries = buildSmartQueries(dest);
  const seenIds = new Set<number>();

  console.log(`\n   🔍 Running ${queries.length} smart queries...`);
  console.log(`   📍 Highlights: ${dest.highlights?.slice(0, 3).join(', ') || 'none'}`);
  console.log(`   🎭 Vibes: ${dest.vibes?.join(', ') || 'none'}`);

  const images: PexelsImageRecord[] = [];
  let imageIndex = 0;
  let apiCallsUsed = 0;

  for (const { query, category, count, page = 1 } of queries) {
    console.log(`      [${category}] "${query.substring(0, 40)}..." → ${count} imgs (pg ${page})`);

    try {
      const photos = await searchPexels(query, count + 5, page); // Request extra, use pagination
      apiCallsUsed++;

      if (photos.length === 0) {
        console.log(`         ⚠️ No results`);
        continue;
      }

      let downloaded = 0;
      for (const photo of photos) {
        if (downloaded >= count) break;
        if (seenIds.has(photo.id)) continue;

        seenIds.add(photo.id);
        imageIndex++;
        const filename = `${dest.id}-${String(imageIndex).padStart(3, '0')}.jpg`;
        const filepath = path.join(destDir, filename);

        // Use large2x for good quality without being too massive
        const imageUrl = photo.src[PEXELS_CONFIG.IMAGE_SIZE] || photo.src.large;
        const success = await downloadImage(imageUrl, filepath);

        if (success) {
          images.push({
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
        }

        // Small delay between downloads
        await new Promise(r => setTimeout(r, 100));
      }

      console.log(`         ✅ ${downloaded} downloaded`);
    } catch (error: any) {
      console.error(`         ❌ Error: ${error.message}`);
      if (error.message.includes('Rate limited')) {
        throw error; // Bubble up rate limit errors
      }
    }

    // Small delay between API calls
    await new Promise(r => setTimeout(r, 150));
  }

  progress.stats.apiCallsUsed += apiCallsUsed;

  console.log(`\n   📸 Total: ${images.length} images downloaded`);
  console.log(`   🔧 API calls used this batch: ${apiCallsUsed}`);

  if (images.length === 0) {
    return null;
  }

  return {
    destinationId: dest.id,
    city: dest.city,
    country: dest.country,
    highlights: dest.highlights || [],
    imageCount: images.length,
    images,
    completedAt: new Date().toISOString(),
    source: 'pexels',
  };
}

// ============================================
// Queue Management
// ============================================

function initializeQueue(): PexelsProgress {
  console.log('\n📋 Initializing Pexels queue...\n');

  // Prioritize destinations that don't have Unsplash images yet
  // Start with the new heavy-hitters we just added
  const priorityDestinations = [
    'istanbul', 'antalya', 'tbilisi', 'macau', 'guangzhou', 'shenzhen',
    'fukuoka', 'sapporo', 'pattaya', 'johor-bahru', 'zhuhai', 'medina', 'sharjah',
  ];

  const prioritySet = new Set(priorityDestinations);
  const queue: string[] = [
    ...priorityDestinations.filter(id => DESTINATIONS.some(d => d.id === id)),
    ...DESTINATIONS.filter(d => !prioritySet.has(d.id)).map(d => d.id),
  ];

  const progress: PexelsProgress = {
    ...INITIAL_PEXELS_PROGRESS,
    queue,
    totalBatches: queue.length,
    stats: {
      totalDestinations: DESTINATIONS.length,
      totalImagesDownloaded: 0,
      apiCallsUsed: 0,
    },
  };

  saveProgress(progress);

  console.log(`✅ Queue initialized with ${queue.length} destinations`);
  console.log(`   Priority destinations: ${priorityDestinations.length}`);
  console.log(`   Images per destination: ${PEXELS_CONFIG.IMAGES_PER_DESTINATION}`);
  console.log(`   Estimated total: ~${queue.length * PEXELS_CONFIG.IMAGES_PER_DESTINATION} images`);

  return progress;
}

async function runBatch(progress: PexelsProgress, manifest: PexelsManifest): Promise<void> {
  // Check cooldown
  if (progress.nextBatchAvailableAt) {
    const waitUntil = new Date(progress.nextBatchAvailableAt);
    const now = new Date();
    if (now < waitUntil) {
      const waitMs = waitUntil.getTime() - now.getTime();
      const waitMins = Math.ceil(waitMs / 60000);
      console.log(`\n⏳ Cooldown active. Next batch in ${waitMins} minutes.`);

      if (!CONTINUOUS) {
        console.log('   Run with --continuous to auto-wait.\n');
        return;
      }

      console.log('   Waiting...\n');
      await new Promise(r => setTimeout(r, waitMs));
    }
  }

  const destId = progress.queue.shift();
  if (!destId) {
    console.log('\n🎉 ALL DESTINATIONS COMPLETE!\n');
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
  console.log(`📍 PEXELS BATCH ${progress.currentBatch}/${progress.totalBatches}: ${dest.city}, ${dest.country}`);
  console.log('='.repeat(70));

  try {
    const result = await processDestination(dest, manifest, progress);

    if (result) {
      manifest.destinations[dest.id] = result;
      progress.completed.push(dest.id);
      progress.stats.totalImagesDownloaded += result.imageCount;
    }
  } catch (error: any) {
    if (error.message.includes('Rate limited')) {
      // Put destination back in queue
      progress.queue.unshift(destId);
      progress.currentBatch--;
      console.log('\n⚠️ Rate limited - will retry after cooldown');
    } else {
      console.error(`\n❌ Error processing ${dest.city}: ${error.message}`);
    }
  }

  // Set cooldown
  progress.lastBatchCompletedAt = new Date().toISOString();
  progress.nextBatchAvailableAt = new Date(Date.now() + PEXELS_CONFIG.BATCH_COOLDOWN_MS).toISOString();

  saveProgress(progress);
  saveManifest(manifest);

  const pct = ((progress.completed.length / progress.stats.totalDestinations) * 100).toFixed(1);
  console.log('\n' + '-'.repeat(70));
  console.log(`✅ Batch complete!`);
  console.log(`   Progress: ${progress.completed.length}/${progress.stats.totalDestinations} (${pct}%)`);
  console.log(`   Total images: ${progress.stats.totalImagesDownloaded}`);
  console.log(`   API calls used: ${progress.stats.apiCallsUsed}`);
  console.log(`   Next batch: ${new Date(progress.nextBatchAvailableAt).toLocaleTimeString()}`);
  console.log('-'.repeat(70) + '\n');
}

function showStatus(progress: PexelsProgress): void {
  console.log('\n' + '='.repeat(70));
  console.log('📊 PEXELS IMAGE MIGRATION STATUS');
  console.log('='.repeat(70));

  const pct = progress.stats.totalDestinations > 0
    ? ((progress.completed.length / progress.stats.totalDestinations) * 100).toFixed(1)
    : '0';

  console.log(`\n📈 Progress: ${progress.completed.length}/${progress.stats.totalDestinations} (${pct}%)`);

  const barWidth = 50;
  const filled = progress.stats.totalDestinations > 0
    ? Math.round((progress.completed.length / progress.stats.totalDestinations) * barWidth)
    : 0;
  console.log(`   [${'█'.repeat(filled)}${'░'.repeat(barWidth - filled)}]`);

  console.log(`\n   📸 Total images: ${progress.stats.totalImagesDownloaded}`);
  console.log(`   🔧 API calls used: ${progress.stats.apiCallsUsed}`);
  console.log(`   📋 Queue remaining: ${progress.queue.length}`);

  // Pexels is faster - estimate based on 20 min cooldown
  const hoursLeft = (progress.queue.length * 20) / 60;
  const daysLeft = (hoursLeft / 24).toFixed(1);
  console.log(`   ⏱️  Est. time remaining: ~${daysLeft} days`);

  if (progress.nextBatchAvailableAt) {
    const nextTime = new Date(progress.nextBatchAvailableAt);
    const now = new Date();
    if (nextTime > now) {
      const minsLeft = Math.ceil((nextTime.getTime() - now.getTime()) / 60000);
      console.log(`\n⏰ Next batch in ${minsLeft} minutes`);
    } else {
      console.log(`\n✅ Ready to run next batch!`);
    }
  }

  if (progress.queue.length > 0) {
    console.log('\n📋 Next up:');
    progress.queue.slice(0, 5).forEach((destId, i) => {
      const dest = DESTINATIONS.find(d => d.id === destId);
      if (dest) {
        console.log(`   ${i + 1}. ${dest.city}, ${dest.country}`);
      }
    });
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
  console.log('\n🖼️  PEXELS IMAGE MIGRATION\n');
  console.log('   • 200 requests/hour (4x Unsplash)');
  console.log('   • 60 images per destination');
  console.log('   • Smart queries based on landmarks & vibes');
  console.log('   • Runs in PARALLEL with Unsplash\n');

  if (!PEXELS_API_KEY && !STATUS && !INIT) {
    console.error('❌ Missing PEXELS_API_KEY environment variable');
    console.log('   Get one at: https://www.pexels.com/api/\n');
    process.exit(1);
  }

  let progress = loadProgress();
  const manifest = loadManifest();

  if (INIT || (progress.queue.length === 0 && progress.completed.length === 0)) {
    progress = initializeQueue();
  }

  if (STATUS) {
    showStatus(progress);
    return;
  }

  if (CONTINUOUS) {
    console.log('🔄 Running in continuous mode\n');
    while (progress.queue.length > 0) {
      await runBatch(progress, manifest);
      progress = loadProgress();
    }
    console.log('\n🎉 Migration complete!\n');
  } else {
    await runBatch(progress, manifest);
    showStatus(loadProgress());
  }
}

main().catch(console.error);
