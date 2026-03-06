/**
 * AI Vision Image Validation
 *
 * Scores every downloaded Pexels image for relevance to its destination.
 * Uses Claude Haiku via OpenRouter for cheap, fast vision analysis.
 *
 * Usage:
 *   npx tsx scripts/image-migration/validate-images.ts [--destination paris] [--dry-run] [--concurrency 5]
 *
 * Output:
 *   - validation-results.json  — scores for every image
 *   - Summary stats printed to console
 *   - Images scoring below threshold can be deleted with --prune flag
 */

import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { config } from 'dotenv';

config({ path: path.join(__dirname, '../../.env.local') });

// ── Config ──────────────────────────────────────────────────────────

const VALIDATION_CONFIG = {
  MODEL: 'anthropic/claude-haiku-4.5', // Cheapest vision model on OpenRouter
  MAX_TOKENS: 150,
  CONCURRENCY: 8,            // Parallel API calls
  DELAY_BETWEEN_MS: 100,     // Small delay to avoid rate limits
  RESULTS_FILE: path.join(__dirname, 'validation-results.json'),
  IMAGES_DIR: path.join(__dirname, 'pexels-images'),

  // Scoring
  RELEVANCE_THRESHOLD: 3,    // 1-5 scale, below this = reject

  // Image resize for API (send smaller versions to save tokens/cost)
  MAX_IMAGE_SIZE_BYTES: 1_000_000, // Skip images over 1MB raw, send as URL instead
};

// ── Types ───────────────────────────────────────────────────────────

interface ImageScore {
  filename: string;
  destination: string;
  score: number;           // 1-5 relevance
  reason: string;          // Brief explanation
  tags: string[];          // What's in the image
  scoredAt: string;
}

interface ValidationResults {
  lastUpdated: string;
  totalScored: number;
  totalPassed: number;
  totalFailed: number;
  averageScore: number;
  destinations: Record<string, {
    city: string;
    country: string;
    totalImages: number;
    passedImages: number;
    failedImages: number;
    averageScore: number;
    images: ImageScore[];
  }>;
}

// ── Load destination metadata ───────────────────────────────────────

interface PexelsManifest {
  destinations: Record<string, {
    city: string;
    country: string;
    highlights: string[];
    imageCount: number;
  }>;
}

function loadManifest(): PexelsManifest {
  const manifestPath = path.join(__dirname, 'pexels-manifest.json');
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function loadResults(): ValidationResults {
  try {
    if (fs.existsSync(VALIDATION_CONFIG.RESULTS_FILE)) {
      return JSON.parse(fs.readFileSync(VALIDATION_CONFIG.RESULTS_FILE, 'utf8'));
    }
  } catch { /* start fresh */ }
  return {
    lastUpdated: new Date().toISOString(),
    totalScored: 0,
    totalPassed: 0,
    totalFailed: 0,
    averageScore: 0,
    destinations: {},
  };
}

function saveResults(results: ValidationResults): void {
  results.lastUpdated = new Date().toISOString();

  // Recalculate totals
  let totalScored = 0, totalPassed = 0, totalFailed = 0, totalScore = 0;
  for (const dest of Object.values(results.destinations)) {
    for (const img of dest.images) {
      totalScored++;
      totalScore += img.score;
      if (img.score >= VALIDATION_CONFIG.RELEVANCE_THRESHOLD) totalPassed++;
      else totalFailed++;
    }
    dest.totalImages = dest.images.length;
    dest.passedImages = dest.images.filter(i => i.score >= VALIDATION_CONFIG.RELEVANCE_THRESHOLD).length;
    dest.failedImages = dest.images.filter(i => i.score < VALIDATION_CONFIG.RELEVANCE_THRESHOLD).length;
    dest.averageScore = dest.images.length > 0
      ? Math.round((dest.images.reduce((s, i) => s + i.score, 0) / dest.images.length) * 100) / 100
      : 0;
  }

  results.totalScored = totalScored;
  results.totalPassed = totalPassed;
  results.totalFailed = totalFailed;
  results.averageScore = totalScored > 0 ? Math.round((totalScore / totalScored) * 100) / 100 : 0;

  fs.writeFileSync(VALIDATION_CONFIG.RESULTS_FILE, JSON.stringify(results, null, 2));
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
      'X-Title': 'HonestNomad-ImageValidation',
    },
  });
}

// ── Score a single image ────────────────────────────────────────────

async function scoreImage(
  client: OpenAI,
  imagePath: string,
  destination: string,
  city: string,
  country: string,
  highlights: string[],
): Promise<ImageScore | null> {
  const filename = path.basename(imagePath);

  try {
    // Read image and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg';

    const highlightStr = highlights.length > 0
      ? `Key landmarks/features: ${highlights.slice(0, 5).join(', ')}`
      : '';

    const response = await client.chat.completions.create({
      model: VALIDATION_CONFIG.MODEL,
      max_tokens: VALIDATION_CONFIG.MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
            {
              type: 'text',
              text: `This image is supposed to be of ${city}, ${country}. ${highlightStr}

Score its relevance on a 1-5 scale:
5 = Clearly shows ${city} (recognizable landmark, street scene, local food, etc.)
4 = Likely ${city} or very representative of the area
3 = Generic but plausible for ${city} (could be this city)
2 = Probably not ${city} (generic stock photo, wrong region)
1 = Definitely not ${city} (wrong country/continent, irrelevant subject)

Respond in EXACTLY this JSON format, nothing else:
{"score": N, "reason": "brief explanation", "tags": ["tag1", "tag2"]}`,
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    // Parse JSON response (handle markdown code blocks)
    let jsonStr = content;
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    const parsed = JSON.parse(jsonStr);

    return {
      filename,
      destination,
      score: Math.min(5, Math.max(1, Math.round(parsed.score))),
      reason: String(parsed.reason || '').slice(0, 200),
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
      scoredAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error(`    Error scoring ${filename}: ${error.message}`);
    return null;
  }
}

// ── Process a batch with concurrency ────────────────────────────────

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
      const result = await processor(items[i]);
      results[i] = result;
      await new Promise(r => setTimeout(r, VALIDATION_CONFIG.DELAY_BETWEEN_MS));
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const destFilter = args.includes('--destination')
    ? args[args.indexOf('--destination') + 1]
    : null;
  const dryRun = args.includes('--dry-run');
  const pruneMode = args.includes('--prune');
  const concurrency = args.includes('--concurrency')
    ? parseInt(args[args.indexOf('--concurrency') + 1]) || VALIDATION_CONFIG.CONCURRENCY
    : VALIDATION_CONFIG.CONCURRENCY;

  console.log('');
  console.log('='.repeat(60));
  console.log('  AI IMAGE VALIDATION (Claude Haiku Vision)');
  console.log('='.repeat(60));
  console.log('');
  console.log(`  Model: ${VALIDATION_CONFIG.MODEL}`);
  console.log(`  Concurrency: ${concurrency}`);
  console.log(`  Threshold: ${VALIDATION_CONFIG.RELEVANCE_THRESHOLD}/5`);
  if (destFilter) console.log(`  Filter: ${destFilter} only`);
  if (dryRun) console.log(`  DRY RUN - no scoring, just counting`);
  if (pruneMode) console.log(`  PRUNE MODE - will delete images below threshold`);
  console.log('');

  const manifest = loadManifest();
  const results = loadResults();
  const client = dryRun ? null : getClient();

  // Figure out which destinations to process
  let destIds = Object.keys(manifest.destinations);
  if (destFilter) {
    destIds = destIds.filter(id => id === destFilter || id.includes(destFilter));
  }

  // Filter out already-scored destinations
  const alreadyScored = new Set(Object.keys(results.destinations));
  const toProcess = destIds.filter(id => {
    if (!alreadyScored.has(id)) return true;
    // Re-score if image count changed
    const dir = path.join(VALIDATION_CONFIG.IMAGES_DIR, id);
    if (!fs.existsSync(dir)) return false;
    const fileCount = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).length;
    return fileCount !== (results.destinations[id]?.images.length || 0);
  });

  // Count total images
  let totalImages = 0;
  for (const id of toProcess) {
    const dir = path.join(VALIDATION_CONFIG.IMAGES_DIR, id);
    if (fs.existsSync(dir)) {
      totalImages += fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).length;
    }
  }

  console.log(`Destinations to validate: ${toProcess.length}`);
  console.log(`Images to score: ${totalImages}`);

  // Cost estimate
  const estimatedCost = totalImages * 0.003; // ~$0.003 per image with Haiku vision
  console.log(`Estimated cost: ~$${estimatedCost.toFixed(2)}`);
  console.log('');

  if (dryRun) {
    console.log('Dry run complete. Run without --dry-run to start scoring.');
    return;
  }

  if (pruneMode) {
    // Prune mode: delete images below threshold from already-scored results
    let pruned = 0;
    for (const [destId, dest] of Object.entries(results.destinations)) {
      for (const img of dest.images) {
        if (img.score < VALIDATION_CONFIG.RELEVANCE_THRESHOLD) {
          const imgPath = path.join(VALIDATION_CONFIG.IMAGES_DIR, destId, img.filename);
          if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
            pruned++;
          }
        }
      }
      // Remove pruned images from results
      dest.images = dest.images.filter(i => i.score >= VALIDATION_CONFIG.RELEVANCE_THRESHOLD);
    }
    saveResults(results);
    console.log(`Pruned ${pruned} images below threshold.`);
    return;
  }

  // ── Score images ──────────────────────────────────────────────────

  let processedDests = 0;
  let processedImages = 0;
  const startTime = Date.now();

  for (const destId of toProcess) {
    processedDests++;
    const destData = manifest.destinations[destId];
    const dir = path.join(VALIDATION_CONFIG.IMAGES_DIR, destId);

    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).sort();
    if (files.length === 0) continue;

    console.log(`[${processedDests}/${toProcess.length}] ${destData.city}, ${destData.country} (${files.length} images)`);

    const imagePaths = files.map(f => path.join(dir, f));

    const scores = await processBatch(
      imagePaths,
      concurrency,
      async (imgPath) => scoreImage(
        client!,
        imgPath,
        destId,
        destData.city,
        destData.country,
        destData.highlights || [],
      ),
    );

    const validScores = scores.filter((s): s is ImageScore => s !== null);
    const passed = validScores.filter(s => s.score >= VALIDATION_CONFIG.RELEVANCE_THRESHOLD).length;
    const failed = validScores.filter(s => s.score < VALIDATION_CONFIG.RELEVANCE_THRESHOLD).length;
    const avg = validScores.length > 0
      ? (validScores.reduce((s, i) => s + i.score, 0) / validScores.length).toFixed(1)
      : '?';

    processedImages += validScores.length;

    // Save destination results
    results.destinations[destId] = {
      city: destData.city,
      country: destData.country,
      totalImages: validScores.length,
      passedImages: passed,
      failedImages: failed,
      averageScore: parseFloat(avg),
      images: validScores,
    };

    // Print summary for this destination
    const passRate = validScores.length > 0 ? Math.round((passed / validScores.length) * 100) : 0;
    console.log(`   avg: ${avg}/5, pass: ${passed}/${validScores.length} (${passRate}%), reject: ${failed}`);

    // Save progress after each destination
    saveResults(results);

    // ETA
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = processedImages / elapsed; // images per second
    const remaining = totalImages - processedImages;
    const etaMin = Math.round(remaining / rate / 60);
    console.log(`   [${processedImages}/${totalImages} images, ~${etaMin}m remaining]`);
    console.log('');
  }

  // ── Final summary ────────────────────────────────────────────────

  saveResults(results);

  console.log('='.repeat(60));
  console.log('  VALIDATION COMPLETE');
  console.log('='.repeat(60));
  console.log('');
  console.log(`  Total scored: ${results.totalScored}`);
  console.log(`  Passed (>=${VALIDATION_CONFIG.RELEVANCE_THRESHOLD}): ${results.totalPassed} (${Math.round(results.totalPassed / results.totalScored * 100)}%)`);
  console.log(`  Failed (<${VALIDATION_CONFIG.RELEVANCE_THRESHOLD}): ${results.totalFailed} (${Math.round(results.totalFailed / results.totalScored * 100)}%)`);
  console.log(`  Average score: ${results.averageScore}/5`);
  console.log('');

  // Worst destinations
  const worstDests = Object.entries(results.destinations)
    .sort((a, b) => a[1].averageScore - b[1].averageScore)
    .slice(0, 10);

  console.log('  Lowest scoring destinations:');
  for (const [id, data] of worstDests) {
    console.log(`    ${id.padEnd(24)} avg: ${data.averageScore}/5, reject: ${data.failedImages}/${data.totalImages}`);
  }
  console.log('');
  console.log(`  Run with --prune to delete images scoring below ${VALIDATION_CONFIG.RELEVANCE_THRESHOLD}/5`);
  console.log('');
}

main().catch(console.error);
