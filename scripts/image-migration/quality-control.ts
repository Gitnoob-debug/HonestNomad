/**
 * Image Quality Control — Single-pass AI + Hash pipeline
 *
 * Combines location relevance scoring AND content diversity analysis
 * into one efficient pipeline. Each image gets:
 *   1. Perceptual hash (free, instant) — catches pixel-identical dupes
 *   2. AI vision analysis (Claude Haiku) — scores relevance + tags content subject
 *
 * Then post-processing enforces diversity:
 *   - No more than MAX_PER_SUBJECT images of the same specific subject
 *   - E.g., keep 4 Eiffel Tower shots, remove the other 8
 *
 * Usage:
 *   npx tsx scripts/image-migration/quality-control.ts                        # Full run
 *   npx tsx scripts/image-migration/quality-control.ts --destination paris    # One city
 *   npx tsx scripts/image-migration/quality-control.ts --dry-run             # Count only
 *   npx tsx scripts/image-migration/quality-control.ts --prune               # Delete rejects
 *   npx tsx scripts/image-migration/quality-control.ts --report              # Show results
 *   npx tsx scripts/image-migration/quality-control.ts --concurrency 10      # Parallel API calls
 */

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import OpenAI from 'openai';
import { config } from 'dotenv';

config({ path: path.join(__dirname, '../../.env.local') });

// ── Config ──────────────────────────────────────────────────────────

const QC_CONFIG = {
  // AI model
  MODEL: 'anthropic/claude-haiku-4.5',
  MAX_TOKENS: 200,
  CONCURRENCY: 8,
  DELAY_BETWEEN_MS: 100,

  // Paths
  RESULTS_FILE: path.join(__dirname, 'qc-results.json'),
  IMAGES_DIR: path.join(__dirname, 'pexels-images'),
  MANIFEST_FILE: path.join(__dirname, 'pexels-manifest.json'),

  // Relevance scoring
  RELEVANCE_THRESHOLD: 3,  // 1-5, below this = wrong location, reject

  // Content diversity limits — how many images of the SAME subject to keep
  // "A few is OK, but not half the folder"
  MAX_PER_SUBJECT: 4,         // Generic subjects (e.g., "sunset over water")
  MAX_PER_LANDMARK: 5,        // Iconic landmarks (e.g., "Eiffel Tower") — slightly more forgiving
  MAX_PER_GENERIC: 3,         // Very generic subjects (e.g., "food plate", "street scene")

  // Perceptual hash — catches pixel-identical dupes before AI runs
  HASH_SIZE: 16,
  IDENTICAL_THRESHOLD: 12,    // Hamming distance — below this = same photo
};

// ── Types ───────────────────────────────────────────────────────────

interface ImageAnalysis {
  filename: string;
  // AI analysis
  relevanceScore: number;     // 1-5
  reason: string;
  subject: string;            // Specific: "Eiffel Tower", "sushi restaurant", "beach sunset"
  category: string;           // Broad: "landmark", "food", "nature", "street", "architecture", "people", "nightlife"
  isIconic: boolean;          // Is this a famous/iconic subject for the destination?
  // Hash
  hashHex: string;
  // Decisions
  keep: boolean;
  rejectReason: string | null; // "wrong-location" | "duplicate-hash" | "over-represented" | null
}

interface DestinationQC {
  destinationId: string;
  city: string;
  country: string;
  totalImages: number;
  kept: number;
  rejected: number;
  rejectedByLocation: number;
  rejectedByDupeHash: number;
  rejectedByDiversity: number;
  averageRelevance: number;
  subjectDistribution: Record<string, number>; // subject -> count of kept images
  images: ImageAnalysis[];
}

interface QCResults {
  lastUpdated: string;
  totalAnalyzed: number;
  totalKept: number;
  totalRejected: number;
  rejectedByLocation: number;
  rejectedByDupeHash: number;
  rejectedByDiversity: number;
  averageRelevance: number;
  destinations: Record<string, DestinationQC>;
}

// ── Perceptual Hash ─────────────────────────────────────────────────

async function computeDHash(imagePath: string): Promise<Buffer> {
  const hashSize = QC_CONFIG.HASH_SIZE;
  const pixels = await sharp(imagePath)
    .resize(hashSize + 1, hashSize, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer();

  const hashBits: number[] = [];
  for (let y = 0; y < hashSize; y++) {
    for (let x = 0; x < hashSize; x++) {
      const left = pixels[y * (hashSize + 1) + x];
      const right = pixels[y * (hashSize + 1) + x + 1];
      hashBits.push(left < right ? 1 : 0);
    }
  }

  const hashBytes = Buffer.alloc(Math.ceil(hashBits.length / 8));
  for (let i = 0; i < hashBits.length; i++) {
    if (hashBits[i]) {
      hashBytes[Math.floor(i / 8)] |= (1 << (7 - (i % 8)));
    }
  }
  return hashBytes;
}

function hammingDistance(a: Buffer, b: Buffer): number {
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    let xor = a[i] ^ b[i];
    while (xor) { distance += xor & 1; xor >>= 1; }
  }
  return distance;
}

// ── OpenRouter client ───────────────────────────────────────────────

function getClient(): OpenAI {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY required in .env.local');
  }
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'HonestNomad-QC',
    },
  });
}

// ── AI Analysis ─────────────────────────────────────────────────────

async function analyzeImage(
  client: OpenAI,
  imagePath: string,
  city: string,
  country: string,
  highlights: string[],
): Promise<{ relevanceScore: number; reason: string; subject: string; category: string; isIconic: boolean } | null> {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');

    const highlightStr = highlights.length > 0
      ? `Famous landmarks/features: ${highlights.slice(0, 5).join(', ')}`
      : '';

    const response = await client.chat.completions.create({
      model: QC_CONFIG.MODEL,
      max_tokens: QC_CONFIG.MAX_TOKENS,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64}` },
          },
          {
            type: 'text',
            text: `This image is supposed to be of ${city}, ${country}. ${highlightStr}

Analyze it and respond in EXACTLY this JSON format, nothing else:
{
  "relevanceScore": N,
  "reason": "brief explanation",
  "subject": "specific subject shown (e.g. 'Eiffel Tower', 'street market', 'beach sunset', 'sushi plate')",
  "category": "one of: landmark, food, nature, street, architecture, people, nightlife, panorama, culture, transport",
  "isIconic": true/false
}

Scoring guide:
5 = Clearly shows ${city} (recognizable landmark, known local scene)
4 = Likely ${city} or very representative of the area
3 = Generic but plausible (could be this city)
2 = Probably not ${city} (wrong region, generic stock)
1 = Definitely not ${city} (wrong country/continent)

"subject" should be SPECIFIC — not "building" but "Sacre-Coeur Basilica". Not "food" but "pad thai street vendor".
"isIconic" = true if this subject is a famous/signature attraction of ${city}.`,
          },
        ],
      }],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    let jsonStr = content;
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    const parsed = JSON.parse(jsonStr);
    return {
      relevanceScore: Math.min(5, Math.max(1, Math.round(parsed.relevanceScore || parsed.score || 1))),
      reason: String(parsed.reason || '').slice(0, 200),
      subject: String(parsed.subject || 'unknown').slice(0, 100).toLowerCase(),
      category: String(parsed.category || 'unknown').slice(0, 30).toLowerCase(),
      isIconic: Boolean(parsed.isIconic),
    };
  } catch (error: any) {
    console.error(`      Error: ${error.message}`);
    return null;
  }
}

// ── Concurrent processor ────────────────────────────────────────────

async function processBatch<T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await processor(items[i]);
      await new Promise(r => setTimeout(r, QC_CONFIG.DELAY_BETWEEN_MS));
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

// ── Process one destination ─────────────────────────────────────────

async function processDestination(
  client: OpenAI,
  destId: string,
  destData: { city: string; country: string; highlights: string[] },
): Promise<DestinationQC> {
  const destDir = path.join(QC_CONFIG.IMAGES_DIR, destId);
  const files = fs.readdirSync(destDir).filter(f => f.endsWith('.jpg')).sort();

  // ── Phase 1: Hash all images (instant, free) ──────────────────
  const hashMap: Array<{ filename: string; hash: Buffer; hashHex: string }> = [];
  const dupeHashSet = new Set<string>();

  for (const file of files) {
    try {
      const hash = await computeDHash(path.join(destDir, file));
      const hashHex = hash.toString('hex');
      hashMap.push({ filename: file, hash, hashHex });
    } catch {
      // Skip corrupt images
    }
  }

  // Find pixel-identical pairs
  const hashDupes = new Set<string>();
  for (let i = 0; i < hashMap.length; i++) {
    for (let j = i + 1; j < hashMap.length; j++) {
      if (hammingDistance(hashMap[i].hash, hashMap[j].hash) <= QC_CONFIG.IDENTICAL_THRESHOLD) {
        // Mark the later one as dupe (keep the earlier/first one)
        hashDupes.add(hashMap[j].filename);
      }
    }
  }

  // ── Phase 2: AI analysis (skip hash dupes to save tokens) ─────
  const toAnalyze = hashMap.filter(h => !hashDupes.has(h.filename));
  const skippedDupes = hashMap.filter(h => hashDupes.has(h.filename));

  const aiResults = await processBatch(
    toAnalyze,
    QC_CONFIG.CONCURRENCY,
    async (item) => {
      const result = await analyzeImage(
        client,
        path.join(destDir, item.filename),
        destData.city,
        destData.country,
        destData.highlights || [],
      );
      return { ...item, ai: result };
    },
  );

  // ── Phase 3: Build analysis records ───────────────────────────
  const analyses: ImageAnalysis[] = [];

  // Add hash dupes as rejected
  for (const dupe of skippedDupes) {
    analyses.push({
      filename: dupe.filename,
      relevanceScore: 0,
      reason: 'Pixel-identical duplicate',
      subject: 'duplicate',
      category: 'duplicate',
      isIconic: false,
      hashHex: dupe.hashHex,
      keep: false,
      rejectReason: 'duplicate-hash',
    });
  }

  // Add AI-analyzed images
  for (const item of aiResults) {
    if (!item.ai) {
      // AI failed — keep by default (don't delete what we can't verify)
      analyses.push({
        filename: item.filename,
        relevanceScore: 3,
        reason: 'AI analysis failed, keeping by default',
        subject: 'unknown',
        category: 'unknown',
        isIconic: false,
        hashHex: item.hashHex,
        keep: true,
        rejectReason: null,
      });
      continue;
    }

    const keep = item.ai.relevanceScore >= QC_CONFIG.RELEVANCE_THRESHOLD;
    analyses.push({
      filename: item.filename,
      relevanceScore: item.ai.relevanceScore,
      reason: item.ai.reason,
      subject: item.ai.subject,
      category: item.ai.category,
      isIconic: item.ai.isIconic,
      hashHex: item.hashHex,
      keep,
      rejectReason: keep ? null : 'wrong-location',
    });
  }

  // ── Phase 4: Enforce content diversity ────────────────────────
  // Group kept images by subject, trim over-represented subjects
  const keptBySubject = new Map<string, ImageAnalysis[]>();
  for (const img of analyses) {
    if (!img.keep) continue;
    const key = img.subject;
    if (!keptBySubject.has(key)) keptBySubject.set(key, []);
    keptBySubject.get(key)!.push(img);
  }

  for (const [subject, images] of keptBySubject) {
    // Determine max allowed for this subject
    const isIconic = images.some(i => i.isIconic);
    const isGeneric = ['unknown', 'generic street', 'generic building', 'city view',
      'food plate', 'restaurant interior', 'hotel room', 'people walking'].some(g =>
      subject.includes(g)
    );

    let maxAllowed: number;
    if (isIconic) {
      maxAllowed = QC_CONFIG.MAX_PER_LANDMARK;
    } else if (isGeneric) {
      maxAllowed = QC_CONFIG.MAX_PER_GENERIC;
    } else {
      maxAllowed = QC_CONFIG.MAX_PER_SUBJECT;
    }

    if (images.length > maxAllowed) {
      // Sort by relevance score (keep the best), then by filename (deterministic)
      images.sort((a, b) => b.relevanceScore - a.relevanceScore || a.filename.localeCompare(b.filename));
      const toReject = images.slice(maxAllowed);
      for (const img of toReject) {
        img.keep = false;
        img.rejectReason = 'over-represented';
      }
    }
  }

  // ── Compute stats ─────────────────────────────────────────────
  const kept = analyses.filter(a => a.keep);
  const rejected = analyses.filter(a => !a.keep);
  const byLocation = rejected.filter(a => a.rejectReason === 'wrong-location');
  const byHash = rejected.filter(a => a.rejectReason === 'duplicate-hash');
  const byDiversity = rejected.filter(a => a.rejectReason === 'over-represented');
  const scoredImages = analyses.filter(a => a.relevanceScore > 0);
  const avgRelevance = scoredImages.length > 0
    ? Math.round((scoredImages.reduce((s, a) => s + a.relevanceScore, 0) / scoredImages.length) * 100) / 100
    : 0;

  // Subject distribution of kept images
  const subjectDist: Record<string, number> = {};
  for (const img of kept) {
    subjectDist[img.subject] = (subjectDist[img.subject] || 0) + 1;
  }

  return {
    destinationId: destId,
    city: destData.city,
    country: destData.country,
    totalImages: analyses.length,
    kept: kept.length,
    rejected: rejected.length,
    rejectedByLocation: byLocation.length,
    rejectedByDupeHash: byHash.length,
    rejectedByDiversity: byDiversity.length,
    averageRelevance: avgRelevance,
    subjectDistribution: subjectDist,
    images: analyses,
  };
}

// ── File I/O ────────────────────────────────────────────────────────

function loadResults(): QCResults {
  try {
    if (fs.existsSync(QC_CONFIG.RESULTS_FILE)) {
      return JSON.parse(fs.readFileSync(QC_CONFIG.RESULTS_FILE, 'utf8'));
    }
  } catch { /* fresh */ }
  return {
    lastUpdated: new Date().toISOString(),
    totalAnalyzed: 0, totalKept: 0, totalRejected: 0,
    rejectedByLocation: 0, rejectedByDupeHash: 0, rejectedByDiversity: 0,
    averageRelevance: 0,
    destinations: {},
  };
}

function saveResults(results: QCResults): void {
  // Recalculate totals
  let totalAnalyzed = 0, totalKept = 0, totalRejected = 0;
  let byLoc = 0, byHash = 0, byDiv = 0, totalScore = 0, scored = 0;

  for (const dest of Object.values(results.destinations)) {
    totalAnalyzed += dest.totalImages;
    totalKept += dest.kept;
    totalRejected += dest.rejected;
    byLoc += dest.rejectedByLocation;
    byHash += dest.rejectedByDupeHash;
    byDiv += dest.rejectedByDiversity;
    for (const img of dest.images) {
      if (img.relevanceScore > 0) { totalScore += img.relevanceScore; scored++; }
    }
  }

  results.totalAnalyzed = totalAnalyzed;
  results.totalKept = totalKept;
  results.totalRejected = totalRejected;
  results.rejectedByLocation = byLoc;
  results.rejectedByDupeHash = byHash;
  results.rejectedByDiversity = byDiv;
  results.averageRelevance = scored > 0 ? Math.round((totalScore / scored) * 100) / 100 : 0;
  results.lastUpdated = new Date().toISOString();

  fs.writeFileSync(QC_CONFIG.RESULTS_FILE, JSON.stringify(results, null, 2));
}

// ── Report ──────────────────────────────────────────────────────────

function showReport(results: QCResults): void {
  console.log('');
  console.log('='.repeat(60));
  console.log('  QUALITY CONTROL REPORT');
  console.log('='.repeat(60));
  console.log('');
  console.log(`  Total images analyzed:  ${results.totalAnalyzed}`);
  console.log(`  Kept:                   ${results.totalKept} (${Math.round(results.totalKept / results.totalAnalyzed * 100)}%)`);
  console.log(`  Rejected:               ${results.totalRejected} (${Math.round(results.totalRejected / results.totalAnalyzed * 100)}%)`);
  console.log(`    Wrong location:       ${results.rejectedByLocation}`);
  console.log(`    Pixel-identical:      ${results.rejectedByDupeHash}`);
  console.log(`    Over-represented:     ${results.rejectedByDiversity}`);
  console.log(`  Average relevance:      ${results.averageRelevance}/5`);
  console.log('');

  // Worst destinations by rejection rate
  const dests = Object.entries(results.destinations)
    .map(([id, d]) => ({ id, ...d, rejectRate: d.totalImages > 0 ? d.rejected / d.totalImages : 0 }))
    .sort((a, b) => b.rejectRate - a.rejectRate);

  console.log('  Highest rejection rate:');
  for (const d of dests.slice(0, 10)) {
    console.log(
      `    ${d.id.padEnd(24)} ${d.rejected}/${d.totalImages} rejected (${Math.round(d.rejectRate * 100)}%) ` +
      `[loc:${d.rejectedByLocation} hash:${d.rejectedByDupeHash} div:${d.rejectedByDiversity}]`
    );
  }

  console.log('');
  console.log('  Lowest relevance scores:');
  const byRelevance = Object.entries(results.destinations)
    .map(([id, d]) => ({ id, avg: d.averageRelevance, kept: d.kept, total: d.totalImages }))
    .sort((a, b) => a.avg - b.avg);
  for (const d of byRelevance.slice(0, 10)) {
    console.log(`    ${d.id.padEnd(24)} avg: ${d.avg}/5, keeping ${d.kept}/${d.total}`);
  }

  // Most over-represented subjects globally
  console.log('');
  console.log('  Most common subjects (across all destinations):');
  const globalSubjects = new Map<string, number>();
  for (const dest of Object.values(results.destinations)) {
    for (const [subject, count] of Object.entries(dest.subjectDistribution)) {
      globalSubjects.set(subject, (globalSubjects.get(subject) || 0) + count);
    }
  }
  const topSubjects = [...globalSubjects.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [subject, count] of topSubjects) {
    console.log(`    ${subject.padEnd(40)} ${count} images`);
  }

  console.log('');
  console.log(`  Run with --prune to delete ${results.totalRejected} rejected images.`);
  console.log('');
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const destFilter = args.includes('--destination')
    ? args[args.indexOf('--destination') + 1]
    : null;
  const dryRun = args.includes('--dry-run');
  const pruneMode = args.includes('--prune');
  const reportMode = args.includes('--report');
  const concurrency = args.includes('--concurrency')
    ? parseInt(args[args.indexOf('--concurrency') + 1]) || QC_CONFIG.CONCURRENCY
    : QC_CONFIG.CONCURRENCY;

  console.log('');
  console.log('='.repeat(60));
  console.log('  IMAGE QUALITY CONTROL');
  console.log('  Location relevance + Content diversity + Dedup');
  console.log('='.repeat(60));
  console.log('');
  console.log(`  Model: ${QC_CONFIG.MODEL}`);
  console.log(`  Concurrency: ${concurrency}`);
  console.log(`  Relevance threshold: ${QC_CONFIG.RELEVANCE_THRESHOLD}/5`);
  console.log(`  Max per subject: ${QC_CONFIG.MAX_PER_SUBJECT} (landmarks: ${QC_CONFIG.MAX_PER_LANDMARK})`);
  console.log('');

  // Report mode
  if (reportMode) {
    const results = loadResults();
    showReport(results);
    return;
  }

  // Prune mode
  if (pruneMode) {
    const results = loadResults();
    let pruned = 0;
    for (const [destId, dest] of Object.entries(results.destinations)) {
      for (const img of dest.images) {
        if (!img.keep) {
          const imgPath = path.join(QC_CONFIG.IMAGES_DIR, destId, img.filename);
          if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
            pruned++;
          }
        }
      }
    }
    console.log(`Pruned ${pruned} rejected images.`);
    return;
  }

  // Load manifest
  const manifest = JSON.parse(fs.readFileSync(QC_CONFIG.MANIFEST_FILE, 'utf8'));
  const results = loadResults();

  // Get destinations to process
  let destIds = fs.readdirSync(QC_CONFIG.IMAGES_DIR)
    .filter(d => {
      const p = path.join(QC_CONFIG.IMAGES_DIR, d);
      return fs.statSync(p).isDirectory() && fs.readdirSync(p).some(f => f.endsWith('.jpg'));
    });

  if (destFilter) {
    destIds = destIds.filter(id => id === destFilter || id.includes(destFilter));
  }

  // Skip already-processed (unless image count changed)
  destIds = destIds.filter(id => {
    if (!(id in results.destinations)) return true;
    const dir = path.join(QC_CONFIG.IMAGES_DIR, id);
    const fileCount = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).length;
    return fileCount !== results.destinations[id].totalImages;
  });

  // Count images
  let totalImages = 0;
  for (const id of destIds) {
    totalImages += fs.readdirSync(path.join(QC_CONFIG.IMAGES_DIR, id)).filter(f => f.endsWith('.jpg')).length;
  }

  console.log(`  Destinations to process: ${destIds.length}`);
  console.log(`  Images to analyze: ${totalImages}`);
  console.log(`  Estimated cost: ~$${(totalImages * 0.003).toFixed(2)}`);
  console.log('');

  if (dryRun) {
    console.log('Dry run complete.');
    return;
  }

  const client = getClient();
  let processed = 0;
  let processedImages = 0;
  const startTime = Date.now();

  for (const destId of destIds) {
    processed++;
    const destData = manifest.destinations?.[destId] || { city: destId, country: 'Unknown', highlights: [] };

    console.log(`[${processed}/${destIds.length}] ${destData.city}, ${destData.country}`);

    const result = await processDestination(client, destId, destData);
    results.destinations[destId] = result;
    processedImages += result.totalImages;

    // Print summary
    console.log(
      `   kept: ${result.kept}/${result.totalImages}, ` +
      `reject: ${result.rejected} ` +
      `[loc:${result.rejectedByLocation} hash:${result.rejectedByDupeHash} div:${result.rejectedByDiversity}], ` +
      `avg: ${result.averageRelevance}/5`
    );

    // Top subjects
    const topSubjects = Object.entries(result.subjectDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([s, c]) => `${s}(${c})`)
      .join(', ');
    if (topSubjects) console.log(`   top: ${topSubjects}`);

    // Save after each destination
    saveResults(results);

    // ETA
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = processedImages / elapsed;
    const remaining = totalImages - processedImages;
    const etaMin = Math.round(remaining / rate / 60);
    console.log(`   [${processedImages}/${totalImages} images, ~${etaMin}m remaining]`);
    console.log('');
  }

  saveResults(results);
  showReport(results);
}

main().catch(console.error);
