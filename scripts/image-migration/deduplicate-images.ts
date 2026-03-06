/**
 * Image Deduplication — Perceptual Hash Clustering
 *
 * Finds near-identical images within each destination using dHash (difference hash).
 * Groups visually similar photos into clusters, keeps the best N per cluster.
 *
 * Philosophy:
 *   - A few shots of the same iconic landmark from different angles = GOOD
 *   - 10 nearly identical sunset photos of the Eiffel Tower = BAD
 *   - More forgiving for landmark/iconic queries, stricter for generic ones
 *
 * Usage:
 *   npx tsx scripts/image-migration/deduplicate-images.ts                    # Analyze all
 *   npx tsx scripts/image-migration/deduplicate-images.ts --destination paris # One city
 *   npx tsx scripts/image-migration/deduplicate-images.ts --prune            # Delete dupes
 *   npx tsx scripts/image-migration/deduplicate-images.ts --dry-run          # Just report
 */

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

// ── Config ──────────────────────────────────────────────────────────

const DEDUP_CONFIG = {
  IMAGES_DIR: path.join(__dirname, 'pexels-images'),
  RESULTS_FILE: path.join(__dirname, 'dedup-results.json'),
  MANIFEST_FILE: path.join(__dirname, 'pexels-manifest.json'),

  // Hash settings
  HASH_SIZE: 16,              // 16x16 = 256-bit hash (good balance of speed & accuracy)

  // Similarity thresholds (Hamming distance out of HASH_SIZE^2 bits)
  // Lower = more similar. A 256-bit hash means max distance = 256.
  NEAR_IDENTICAL_THRESHOLD: 12,   // Almost pixel-identical (different compression, slight crop)
  SIMILAR_THRESHOLD: 22,          // Same subject/angle, minor differences (lighting, time of day)

  // How many similar images to KEEP per cluster
  // "A few duplications per city" — keep up to 3 of the same thing
  KEEP_PER_CLUSTER_DEFAULT: 3,

  // Landmark queries get more forgiveness — keep up to 4
  // (e.g., 4 shots of Eiffel Tower from different angles is fine)
  KEEP_PER_CLUSTER_LANDMARK: 4,

  // Categories considered "landmark" (from pexels query categories)
  LANDMARK_CATEGORIES: new Set([
    'landmark-1', 'landmark-2', 'landmark-3', 'landmark-4', 'landmark-5',
    'backfill-landmark-1', 'backfill-landmark-2', 'backfill-landmark-3',
    'landmarks', 'historic', 'religious', 'palace', 'skyline',
  ]),
};

// ── Types ───────────────────────────────────────────────────────────

interface ImageHash {
  filename: string;
  hash: Buffer;
  queryUsed: string;
  fileSize: number;
  width: number;
  height: number;
}

interface DuplicateCluster {
  clusterIndex: number;
  similarity: 'near-identical' | 'similar';
  images: string[];       // All filenames in cluster
  kept: string[];          // Filenames we keep
  removed: string[];       // Filenames flagged for removal
  isLandmark: boolean;
}

interface DestinationDedupResult {
  destinationId: string;
  totalImages: number;
  clusters: DuplicateCluster[];
  duplicatesFound: number;
  toRemove: number;
  toKeep: number;
}

interface DedupResults {
  lastUpdated: string;
  totalAnalyzed: number;
  totalClusters: number;
  totalDuplicates: number;
  totalToRemove: number;
  destinations: Record<string, DestinationDedupResult>;
}

// ── Perceptual Hash (dHash) ─────────────────────────────────────────
// dHash: resize to (HASH_SIZE+1 x HASH_SIZE), compare adjacent pixels
// Produces a hash that's robust to scaling, minor color changes, compression

async function computeDHash(imagePath: string, hashSize: number = DEDUP_CONFIG.HASH_SIZE): Promise<Buffer> {
  // Resize to (hashSize+1) x hashSize, grayscale
  const pixels = await sharp(imagePath)
    .resize(hashSize + 1, hashSize, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer();

  // Compare each pixel to its right neighbor
  const hashBits: number[] = [];
  for (let y = 0; y < hashSize; y++) {
    for (let x = 0; x < hashSize; x++) {
      const left = pixels[y * (hashSize + 1) + x];
      const right = pixels[y * (hashSize + 1) + x + 1];
      hashBits.push(left < right ? 1 : 0);
    }
  }

  // Pack bits into bytes
  const hashBytes = Buffer.alloc(Math.ceil(hashBits.length / 8));
  for (let i = 0; i < hashBits.length; i++) {
    if (hashBits[i]) {
      hashBytes[Math.floor(i / 8)] |= (1 << (7 - (i % 8)));
    }
  }

  return hashBytes;
}

// Hamming distance between two hashes
function hammingDistance(a: Buffer, b: Buffer): number {
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    let xor = a[i] ^ b[i];
    while (xor) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}

// ── Clustering ──────────────────────────────────────────────────────
// Union-Find for grouping similar images

class UnionFind {
  parent: number[];
  rank: number[];

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(x: number, y: number): void {
    const px = this.find(x);
    const py = this.find(y);
    if (px === py) return;
    if (this.rank[px] < this.rank[py]) this.parent[px] = py;
    else if (this.rank[px] > this.rank[py]) this.parent[py] = px;
    else { this.parent[py] = px; this.rank[px]++; }
  }
}

function clusterImages(
  hashes: ImageHash[],
  threshold: number,
): Map<number, ImageHash[]> {
  const uf = new UnionFind(hashes.length);

  // Compare all pairs
  for (let i = 0; i < hashes.length; i++) {
    for (let j = i + 1; j < hashes.length; j++) {
      const dist = hammingDistance(hashes[i].hash, hashes[j].hash);
      if (dist <= threshold) {
        uf.union(i, j);
      }
    }
  }

  // Group by root
  const clusters = new Map<number, ImageHash[]>();
  for (let i = 0; i < hashes.length; i++) {
    const root = uf.find(i);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root)!.push(hashes[i]);
  }

  return clusters;
}

// ── Pick which images to keep in a cluster ──────────────────────────
// Prefer: larger file size (higher quality), landmark queries, higher resolution

function pickKeepers(
  cluster: ImageHash[],
  keepCount: number,
): { kept: ImageHash[]; removed: ImageHash[] } {
  if (cluster.length <= keepCount) {
    return { kept: cluster, removed: [] };
  }

  // Score each image
  const scored = cluster.map(img => {
    let score = 0;
    // Prefer larger files (better quality)
    score += img.fileSize / 100000;
    // Prefer higher resolution
    score += (img.width * img.height) / 1000000;
    // Prefer landmark queries
    if (DEDUP_CONFIG.LANDMARK_CATEGORIES.has(img.queryUsed)) score += 5;
    return { img, score };
  });

  // Sort by score descending, keep the top N
  scored.sort((a, b) => b.score - a.score);

  return {
    kept: scored.slice(0, keepCount).map(s => s.img),
    removed: scored.slice(keepCount).map(s => s.img),
  };
}

// ── Process one destination ─────────────────────────────────────────

interface ManifestImage {
  filename: string;
  queryUsed: string;
  width: number;
  height: number;
}

async function processDestination(
  destId: string,
  manifestImages: ManifestImage[],
): Promise<DestinationDedupResult> {
  const destDir = path.join(DEDUP_CONFIG.IMAGES_DIR, destId);
  const files = fs.readdirSync(destDir).filter(f => f.endsWith('.jpg')).sort();

  // Build lookup from manifest for query categories
  const queryLookup = new Map<string, ManifestImage>();
  for (const img of manifestImages) {
    queryLookup.set(img.filename, img);
  }

  // Compute hashes
  const hashes: ImageHash[] = [];
  for (const file of files) {
    const filePath = path.join(destDir, file);
    try {
      const hash = await computeDHash(filePath);
      const stats = fs.statSync(filePath);
      const manifestData = queryLookup.get(file);
      hashes.push({
        filename: file,
        hash,
        queryUsed: manifestData?.queryUsed || 'unknown',
        fileSize: stats.size,
        width: manifestData?.width || 0,
        height: manifestData?.height || 0,
      });
    } catch (error: any) {
      // Skip corrupt images
      continue;
    }
  }

  // Two-pass clustering:
  // Pass 1: Near-identical (very strict — these are basically the same photo)
  // Pass 2: Similar (looser — same subject, different angle/time)

  const allClusters: DuplicateCluster[] = [];
  const allRemoved = new Set<string>();
  let clusterIndex = 0;

  // Pass 1: Near-identical
  const nearIdenticalClusters = clusterImages(hashes, DEDUP_CONFIG.NEAR_IDENTICAL_THRESHOLD);
  for (const [_, cluster] of nearIdenticalClusters) {
    if (cluster.length < 2) continue; // No duplicates

    const isLandmark = cluster.some(img => DEDUP_CONFIG.LANDMARK_CATEGORIES.has(img.queryUsed));
    // For near-identical, even landmarks only keep 2 (they're basically the same photo)
    const keepCount = isLandmark ? 2 : 2;
    const { kept, removed } = pickKeepers(cluster, keepCount);

    if (removed.length > 0) {
      allClusters.push({
        clusterIndex: clusterIndex++,
        similarity: 'near-identical',
        images: cluster.map(i => i.filename),
        kept: kept.map(i => i.filename),
        removed: removed.map(i => i.filename),
        isLandmark,
      });
      for (const r of removed) allRemoved.add(r.filename);
    }
  }

  // Pass 2: Similar (but not near-identical)
  // Filter out already-removed images, re-cluster at looser threshold
  const remainingHashes = hashes.filter(h => !allRemoved.has(h.filename));
  const similarClusters = clusterImages(remainingHashes, DEDUP_CONFIG.SIMILAR_THRESHOLD);

  for (const [_, cluster] of similarClusters) {
    if (cluster.length < 2) continue;

    const isLandmark = cluster.some(img => DEDUP_CONFIG.LANDMARK_CATEGORIES.has(img.queryUsed));
    const keepCount = isLandmark
      ? DEDUP_CONFIG.KEEP_PER_CLUSTER_LANDMARK
      : DEDUP_CONFIG.KEEP_PER_CLUSTER_DEFAULT;

    const { kept, removed } = pickKeepers(cluster, keepCount);

    if (removed.length > 0) {
      allClusters.push({
        clusterIndex: clusterIndex++,
        similarity: 'similar',
        images: cluster.map(i => i.filename),
        kept: kept.map(i => i.filename),
        removed: removed.map(i => i.filename),
        isLandmark,
      });
      for (const r of removed) allRemoved.add(r.filename);
    }
  }

  return {
    destinationId: destId,
    totalImages: hashes.length,
    clusters: allClusters,
    duplicatesFound: allClusters.reduce((s, c) => s + c.images.length, 0),
    toRemove: allRemoved.size,
    toKeep: hashes.length - allRemoved.size,
  };
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const destFilter = args.includes('--destination')
    ? args[args.indexOf('--destination') + 1]
    : null;
  const dryRun = args.includes('--dry-run');
  const pruneMode = args.includes('--prune');

  console.log('');
  console.log('='.repeat(60));
  console.log('  IMAGE DEDUPLICATION (Perceptual Hash)');
  console.log('='.repeat(60));
  console.log('');
  console.log(`  Hash: ${DEDUP_CONFIG.HASH_SIZE}x${DEDUP_CONFIG.HASH_SIZE} dHash (${DEDUP_CONFIG.HASH_SIZE ** 2}-bit)`);
  console.log(`  Near-identical threshold: ${DEDUP_CONFIG.NEAR_IDENTICAL_THRESHOLD} bits`);
  console.log(`  Similar threshold: ${DEDUP_CONFIG.SIMILAR_THRESHOLD} bits`);
  console.log(`  Keep per cluster: ${DEDUP_CONFIG.KEEP_PER_CLUSTER_DEFAULT} (landmarks: ${DEDUP_CONFIG.KEEP_PER_CLUSTER_LANDMARK})`);
  if (destFilter) console.log(`  Filter: ${destFilter}`);
  if (dryRun) console.log(`  DRY RUN`);
  if (pruneMode) console.log(`  PRUNE MODE`);
  console.log('');

  // Load manifest for query categories
  const manifest = JSON.parse(fs.readFileSync(DEDUP_CONFIG.MANIFEST_FILE, 'utf8'));

  // Prune mode: delete flagged images from previous analysis
  if (pruneMode) {
    const results: DedupResults = JSON.parse(fs.readFileSync(DEDUP_CONFIG.RESULTS_FILE, 'utf8'));
    let pruned = 0;
    for (const [destId, dest] of Object.entries(results.destinations)) {
      for (const cluster of dest.clusters) {
        for (const filename of cluster.removed) {
          const imgPath = path.join(DEDUP_CONFIG.IMAGES_DIR, destId, filename);
          if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
            pruned++;
          }
        }
      }
    }
    console.log(`Pruned ${pruned} duplicate images.`);
    return;
  }

  // Get destination list
  let destIds = fs.readdirSync(DEDUP_CONFIG.IMAGES_DIR)
    .filter(d => fs.statSync(path.join(DEDUP_CONFIG.IMAGES_DIR, d)).isDirectory());

  if (destFilter) {
    destIds = destIds.filter(id => id === destFilter || id.includes(destFilter));
  }

  console.log(`Destinations to analyze: ${destIds.length}`);
  console.log('');

  const results: DedupResults = {
    lastUpdated: new Date().toISOString(),
    totalAnalyzed: 0,
    totalClusters: 0,
    totalDuplicates: 0,
    totalToRemove: 0,
    destinations: {},
  };

  let processed = 0;
  const startTime = Date.now();

  for (const destId of destIds) {
    processed++;

    const manifestDest = manifest.destinations?.[destId];
    const manifestImages: ManifestImage[] = manifestDest?.images || [];

    const result = await processDestination(destId, manifestImages);
    results.destinations[destId] = result;
    results.totalAnalyzed += result.totalImages;
    results.totalClusters += result.clusters.length;
    results.totalToRemove += result.toRemove;

    if (result.toRemove > 0) {
      const nearIdent = result.clusters.filter(c => c.similarity === 'near-identical');
      const similar = result.clusters.filter(c => c.similarity === 'similar');
      console.log(
        `[${processed}/${destIds.length}] ${destId.padEnd(24)} ` +
        `${result.totalImages} imgs, ` +
        `remove ${result.toRemove} ` +
        `(${nearIdent.length} identical clusters, ${similar.length} similar clusters)`
      );
    } else {
      process.stdout.write(`[${processed}/${destIds.length}] ${destId.padEnd(24)} ${result.totalImages} imgs, clean\r`);
    }

    // Save periodically
    if (processed % 50 === 0) {
      fs.writeFileSync(DEDUP_CONFIG.RESULTS_FILE, JSON.stringify(results, null, 2));
    }
  }

  // Final save
  fs.writeFileSync(DEDUP_CONFIG.RESULTS_FILE, JSON.stringify(results, null, 2));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('');
  console.log('='.repeat(60));
  console.log('  DEDUPLICATION COMPLETE');
  console.log('='.repeat(60));
  console.log('');
  console.log(`  Images analyzed: ${results.totalAnalyzed}`);
  console.log(`  Duplicate clusters found: ${results.totalClusters}`);
  console.log(`  Images to remove: ${results.totalToRemove}`);
  console.log(`  Images to keep: ${results.totalAnalyzed - results.totalToRemove}`);
  console.log(`  Time: ${elapsed}s`);
  console.log('');

  // Worst offenders
  const worst = Object.entries(results.destinations)
    .filter(([_, d]) => d.toRemove > 0)
    .sort((a, b) => b[1].toRemove - a[1].toRemove)
    .slice(0, 15);

  if (worst.length > 0) {
    console.log('  Most duplicates:');
    for (const [id, data] of worst) {
      console.log(`    ${id.padEnd(24)} remove ${data.toRemove}/${data.totalImages} (keep ${data.toKeep})`);
    }
  }

  console.log('');
  console.log(`  Run with --prune to delete ${results.totalToRemove} duplicate images.`);
  console.log('');
}

main().catch(console.error);
