/**
 * Backfill BlurHash for existing downloaded images.
 *
 * Generates blur hashes locally from the image files on disk —
 * no Unsplash API calls needed.
 *
 * Run: npx tsx scripts/image-migration/backfill-blurhash.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { encode } from 'blurhash';
import type { Manifest } from './config';

const MANIFEST_PATH = path.join(process.cwd(), 'scripts/image-migration/manifest.json');
const IMAGES_DIR = path.join(process.cwd(), 'scripts/image-migration/downloaded-images');

function loadManifest(): Manifest {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
}

function saveManifest(manifest: Manifest): void {
  manifest.lastUpdated = new Date().toISOString();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

async function generateBlurHash(filepath: string): Promise<{ blurHash: string; color: string; width: number; height: number } | null> {
  try {
    // Get original dimensions
    const metadata = await sharp(filepath).metadata();
    const origWidth = metadata.width || 0;
    const origHeight = metadata.height || 0;

    // Resize to small for blur hash encoding (4x3 components)
    const { data, info } = await sharp(filepath)
      .resize(32, 32, { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const hash = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);

    // Get dominant color
    const { dominant } = await sharp(filepath).stats();
    const color = `#${dominant.r.toString(16).padStart(2, '0')}${dominant.g.toString(16).padStart(2, '0')}${dominant.b.toString(16).padStart(2, '0')}`;

    return { blurHash: hash, color, width: origWidth, height: origHeight };
  } catch (error: any) {
    console.error(`    Failed: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('\n🔄 Backfilling BlurHash for existing images...\n');

  const manifest = loadManifest();
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  const destinations = Object.entries(manifest.destinations);
  console.log(`Found ${destinations.length} destinations in manifest\n`);

  for (const [destId, destData] of destinations) {
    const needsUpdate = destData.images.filter(img => !img.blurHash);
    if (needsUpdate.length === 0) {
      console.log(`  ${destId.padEnd(15)} — all ${destData.images.length} images already have blur hashes`);
      skipped += destData.images.length;
      continue;
    }

    console.log(`  ${destId.padEnd(15)} — processing ${needsUpdate.length}/${destData.images.length} images...`);

    for (const img of destData.images) {
      if (img.blurHash) {
        skipped++;
        continue;
      }

      const filepath = path.join(IMAGES_DIR, destId, img.filename);
      if (!fs.existsSync(filepath)) {
        console.log(`    ⚠️  Missing file: ${img.filename}`);
        failed++;
        continue;
      }

      const result = await generateBlurHash(filepath);
      if (result) {
        img.blurHash = result.blurHash;
        img.color = result.color;
        img.width = result.width;
        img.height = result.height;
        if (!img.altText) img.altText = null;
        updated++;
      } else {
        failed++;
      }

      processed++;
    }

    // Save after each destination in case of interruption
    saveManifest(manifest);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Backfill complete!');
  console.log(`   Updated:  ${updated} images`);
  console.log(`   Skipped:  ${skipped} (already had blur hash)`);
  console.log(`   Failed:   ${failed}`);
  console.log('='.repeat(50) + '\n');
}

main().catch(console.error);
