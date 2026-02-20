/**
 * Upload approved images to Supabase Storage & update POI JSON files.
 *
 * This script:
 * 1. Reads the manifest for approved/review destinations
 * 2. For each destination, loads the POI JSON file
 * 3. Finds POIs without supabaseImageUrl
 * 4. Uploads downloaded images to Supabase Storage (poi-images bucket)
 * 5. Assigns images to unmatched POIs and updates supabaseImageUrl
 * 6. Skips POIs that already have a supabaseImageUrl (deduplication)
 *
 * Run with: npx tsx scripts/image-migration/upload-to-supabase.ts
 *   --dry-run    Show what would be uploaded without actually doing it
 *   --dest=paris  Only process a specific destination
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { CONFIG, Manifest } from './config';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const POI_BUCKET = 'poi-images';
const POI_DIR = path.join(process.cwd(), 'data', 'pois');
const IMAGES_DIR = path.join(process.cwd(), CONFIG.IMAGES_DIR);
const MANIFEST_PATH = path.join(process.cwd(), CONFIG.MANIFEST_FILE);

// CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const DEST_FILTER = args.find(a => a.startsWith('--dest='))?.split('=')[1] || null;

interface CachedPOI {
  id: string;
  name: string;
  supabaseImageUrl?: string;
  [key: string]: any;
}

interface POIFile {
  destinationId: string;
  city: string;
  country: string;
  paths: Record<string, CachedPOI[]>;
  [key: string]: any;
}

/** Sanitize city name the same way as lib/supabase/images.ts */
function safeCityName(cityId: string): string {
  return cityId
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .toLowerCase();
}

/** Build the public URL for a POI image in Supabase Storage */
function buildSupabaseUrl(citySlug: string, poiId: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${POI_BUCKET}/${citySlug}/${poiId}.jpg`;
}

async function main() {
  console.log('\n📤 UPLOAD TO SUPABASE — POI Image Assignment\n');

  if (DRY_RUN) {
    console.log('   🏷️  DRY RUN — no files will be uploaded or modified\n');
  }

  // Validate credentials
  if (!SUPABASE_URL) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
    process.exit(1);
  }
  if (!SUPABASE_SERVICE_KEY && !DRY_RUN) {
    console.error('❌ Missing SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) — needed for Storage uploads');
    console.log('   Add it to .env.local. Find it in Supabase Dashboard → Settings → API → service_role key');
    process.exit(1);
  }

  // Initialize Supabase client with service role for storage writes
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || 'dummy');

  // Load manifest
  let manifest: Manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  } catch {
    console.error('❌ Could not read manifest.json. Run the download script first.');
    process.exit(1);
  }

  // Get destinations to process
  const destIds = DEST_FILTER
    ? [DEST_FILTER]
    : Object.keys(manifest.destinations).filter(id => {
        const d = manifest.destinations[id];
        return d.status === 'review' || d.status === 'approved';
      });

  if (destIds.length === 0) {
    console.log('No destinations ready for upload. Download and review images first.');
    return;
  }

  console.log(`Processing ${destIds.length} destination(s)...\n`);

  let totalUploaded = 0;
  let totalSkipped = 0;
  let totalAssigned = 0;

  for (const destId of destIds) {
    const destManifest = manifest.destinations[destId];
    if (!destManifest) {
      console.warn(`⚠️ ${destId}: not found in manifest, skipping`);
      continue;
    }

    // Load POI JSON file
    const poiFilePath = path.join(POI_DIR, `${destId}.json`);
    if (!fs.existsSync(poiFilePath)) {
      console.warn(`⚠️ ${destId}: POI file not found at ${poiFilePath}`);
      continue;
    }

    const poiData: POIFile = JSON.parse(fs.readFileSync(poiFilePath, 'utf-8'));
    const citySlug = safeCityName(destId);

    // Collect all unique POIs without supabaseImageUrl
    const poisWithoutImage: CachedPOI[] = [];
    const seenPoiIds = new Set<string>();

    for (const [, pois] of Object.entries(poiData.paths)) {
      if (!Array.isArray(pois)) continue;
      for (const poi of pois) {
        if (seenPoiIds.has(poi.id)) continue;
        seenPoiIds.add(poi.id);
        if (!poi.supabaseImageUrl) {
          poisWithoutImage.push(poi);
        }
      }
    }

    // Also check which POIs already have images in Supabase (by listing bucket)
    // This catches cases where the image was uploaded but the JSON wasn't updated
    const existingInBucket = new Set<string>();
    if (!DRY_RUN) {
      try {
        const { data: files } = await supabase.storage
          .from(POI_BUCKET)
          .list(citySlug, { limit: 1000 });
        if (files) {
          for (const f of files) {
            // Extract POI ID from filename (e.g., "poi123.jpg" → "poi123")
            const poiId = f.name.replace('.jpg', '');
            existingInBucket.add(poiId);
          }
        }
      } catch {
        // If listing fails, proceed anyway — duplicates are handled by upsert
      }
    }

    // Get downloaded images for this destination
    const destImagesDir = path.join(IMAGES_DIR, destId);
    if (!fs.existsSync(destImagesDir)) {
      console.warn(`⚠️ ${destId}: no downloaded images directory`);
      continue;
    }
    const imageFiles = fs.readdirSync(destImagesDir).filter(f => f.endsWith('.jpg')).sort();

    console.log(`📍 ${poiData.city}, ${poiData.country}`);
    console.log(`   POIs without images: ${poisWithoutImage.length}`);
    console.log(`   Downloaded images available: ${imageFiles.length}`);
    console.log(`   Already in Supabase bucket: ${existingInBucket.size}`);

    // Assign images to POIs
    const assignableCount = Math.min(poisWithoutImage.length, imageFiles.length);
    let uploaded = 0;
    let skipped = 0;

    for (let i = 0; i < assignableCount; i++) {
      const poi = poisWithoutImage[i];
      const imageFile = imageFiles[i];
      const imagePath = path.join(destImagesDir, imageFile);

      // Check if this POI already has an image in the bucket
      if (existingInBucket.has(poi.id)) {
        // Image exists in bucket — just update the JSON URL without re-uploading
        const url = buildSupabaseUrl(citySlug, poi.id);
        if (!DRY_RUN) {
          updatePOIImageUrl(poiData, poi.id, url);
        }
        skipped++;
        totalAssigned++;
        continue;
      }

      const storagePath = `${citySlug}/${poi.id}.jpg`;

      if (DRY_RUN) {
        console.log(`   [dry-run] Would upload ${imageFile} → ${storagePath}`);
        uploaded++;
        continue;
      }

      // Upload to Supabase Storage
      const fileBuffer = fs.readFileSync(imagePath);
      const { error } = await supabase.storage
        .from(POI_BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: 'image/jpeg',
          upsert: true, // Overwrite if exists (safety)
        });

      if (error) {
        console.error(`   ❌ Upload failed for ${poi.id}: ${error.message}`);
        continue;
      }

      // Update POI JSON with the new URL
      const url = buildSupabaseUrl(citySlug, poi.id);
      updatePOIImageUrl(poiData, poi.id, url);

      uploaded++;
      totalAssigned++;

      // Small delay to be gentle on Supabase
      await new Promise(r => setTimeout(r, 50));
    }

    // Save updated POI JSON file
    if (!DRY_RUN && uploaded > 0) {
      fs.writeFileSync(poiFilePath, JSON.stringify(poiData, null, 2));
    }

    console.log(`   ✅ Uploaded: ${uploaded}, Skipped (already exists): ${skipped}`);
    if (poisWithoutImage.length > imageFiles.length) {
      console.log(`   ⚠️  ${poisWithoutImage.length - imageFiles.length} POIs still need images (not enough downloads)`);
    }
    console.log('');

    totalUploaded += uploaded;
    totalSkipped += skipped;
  }

  console.log('='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   Uploaded: ${totalUploaded} images`);
  console.log(`   Skipped (already in bucket): ${totalSkipped}`);
  console.log(`   Total POIs now with images: ${totalAssigned}`);
  if (DRY_RUN) {
    console.log(`\n   This was a dry run. Remove --dry-run to actually upload.`);
  }
  console.log('');
}

/** Update supabaseImageUrl for a POI across all path types */
function updatePOIImageUrl(poiData: POIFile, poiId: string, url: string): void {
  for (const [, pois] of Object.entries(poiData.paths)) {
    if (!Array.isArray(pois)) continue;
    for (const poi of pois) {
      if (poi.id === poiId) {
        poi.supabaseImageUrl = url;
      }
    }
  }
}

main().catch(console.error);
