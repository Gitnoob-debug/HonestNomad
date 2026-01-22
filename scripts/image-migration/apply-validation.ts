/**
 * Apply Validation Decisions
 *
 * Reads the validation-decisions.json exported from the preview page
 * and updates the manifest + progress files.
 *
 * Run with: npx tsx scripts/image-migration/apply-validation.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { CONFIG, Manifest, Progress } from './config';

const MANIFEST_PATH = path.join(process.cwd(), CONFIG.MANIFEST_FILE);
const PROGRESS_PATH = path.join(process.cwd(), CONFIG.PROGRESS_FILE);
const DECISIONS_PATH = path.join(process.cwd(), 'scripts/image-migration/validation-decisions.json');
const IMAGES_DIR = path.join(process.cwd(), CONFIG.IMAGES_DIR);

function loadJSON<T>(filepath: string): T | null {
  try {
    if (fs.existsSync(filepath)) {
      return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    }
  } catch (e) {}
  return null;
}

function saveJSON(filepath: string, data: any): void {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

function main() {
  console.log('\n📋 Applying validation decisions...\n');

  const manifest = loadJSON<Manifest>(MANIFEST_PATH);
  const progress = loadJSON<Progress>(PROGRESS_PATH);
  const decisions = loadJSON<Record<string, 'approved' | 'rejected'>>(DECISIONS_PATH);

  if (!manifest || !progress) {
    console.error('❌ No manifest or progress found.\n');
    process.exit(1);
  }

  if (!decisions) {
    console.error('❌ No validation-decisions.json found.');
    console.log('   Export it from the preview page first.\n');
    process.exit(1);
  }

  console.log(`   Found ${Object.keys(decisions).length} decisions\n`);

  // Group decisions by destination
  const byDest: Record<string, { approved: string[]; rejected: string[] }> = {};

  for (const [key, status] of Object.entries(decisions)) {
    const [destId, filename] = key.split('/');
    if (!byDest[destId]) {
      byDest[destId] = { approved: [], rejected: [] };
    }
    if (status === 'approved') {
      byDest[destId].approved.push(filename);
    } else {
      byDest[destId].rejected.push(filename);
    }
  }

  let totalApproved = 0;
  let totalRejected = 0;
  let deletedCount = 0;

  for (const [destId, { approved, rejected }] of Object.entries(byDest)) {
    const dest = manifest.destinations[destId];
    if (!dest) continue;

    console.log(`📍 ${dest.city}, ${dest.country}`);

    // Update image validation status
    for (const img of dest.images) {
      if (approved.includes(img.filename)) {
        img.validated = true;
        img.validationStatus = 'approved';
        totalApproved++;
      } else if (rejected.includes(img.filename)) {
        img.validated = true;
        img.validationStatus = 'rejected';
        totalRejected++;

        // Delete rejected images
        const imgPath = path.join(IMAGES_DIR, destId, img.filename);
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
          deletedCount++;
        }
      }
    }

    // Remove rejected images from manifest
    dest.images = dest.images.filter(img => img.validationStatus !== 'rejected');
    dest.imageCount = dest.images.length;

    // Update destination status
    if (dest.images.length > 0 && dest.images.every(img => img.validationStatus === 'approved')) {
      dest.status = 'approved';
      // Move from pendingReview to approved
      progress.pendingReview = progress.pendingReview.filter(id => id !== destId);
      if (!progress.approved.includes(destId)) {
        progress.approved.push(destId);
      }
    } else if (dest.images.length === 0) {
      dest.status = 'rejected';
      progress.pendingReview = progress.pendingReview.filter(id => id !== destId);
      if (!progress.rejected.includes(destId)) {
        progress.rejected.push(destId);
      }
    }

    console.log(`   ✅ ${approved.length} approved, ❌ ${rejected.length} rejected`);
  }

  // Update stats
  progress.stats.totalApproved = totalApproved;
  progress.stats.totalRejected = totalRejected;

  // Save
  saveJSON(MANIFEST_PATH, manifest);
  saveJSON(PROGRESS_PATH, progress);

  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`   Images approved: ${totalApproved}`);
  console.log(`   Images rejected: ${totalRejected}`);
  console.log(`   Files deleted: ${deletedCount}`);
  console.log(`   Destinations approved: ${progress.approved.length}`);
  console.log(`   Destinations rejected: ${progress.rejected.length}`);
  console.log(`   Still pending: ${progress.pendingReview.length}`);
  console.log('='.repeat(50) + '\n');

  // Clean up decisions file
  fs.unlinkSync(DECISIONS_PATH);
  console.log('✅ Validation applied! Decisions file cleaned up.\n');
}

main();
