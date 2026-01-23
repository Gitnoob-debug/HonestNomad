/**
 * Check migration status
 * Run with: npx tsx scripts/image-migration/check-status.ts
 *
 * Alternative: npx tsx scripts/image-migration/migrate-images.ts --status
 */

import * as fs from 'fs';
import * as path from 'path';
import { DESTINATIONS } from '../../lib/flash/destinations';
import { CONFIG, Progress } from './config';

function loadProgress(): Progress | null {
  const progressPath = path.join(process.cwd(), CONFIG.PROGRESS_FILE);

  try {
    if (fs.existsSync(progressPath)) {
      const data = fs.readFileSync(progressPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    return null;
  }

  return null;
}

function checkStatus(): void {
  console.log('='.repeat(60));
  console.log('📊 IMAGE MIGRATION STATUS');
  console.log('='.repeat(60));

  const progress = loadProgress();

  if (!progress) {
    console.log('\n❌ No migration started yet.');
    console.log('   Run: npx tsx scripts/image-migration/migrate-images.ts --init');
    return;
  }

  const completed = progress.completed.length;
  const rejected = progress.rejected.length;
  const approved = progress.approved.length;
  const pendingReview = progress.pendingReview.length;
  const total = progress.stats.totalDestinations || DESTINATIONS.length;
  const queued = progress.queue.length;
  const percentComplete = ((completed / total) * 100).toFixed(1);

  console.log(`\n📈 Progress: ${completed}/${total} (${percentComplete}%)`);
  console.log('');

  // Progress bar
  const barWidth = 40;
  const filledWidth = Math.round((completed / total) * barWidth);
  const emptyWidth = barWidth - filledWidth;
  const bar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
  console.log(`   [${bar}]`);
  console.log('');

  console.log(`   📦 Batches: ${progress.currentBatch}/${progress.totalBatches}`);
  console.log(`   📸 Images downloaded: ${progress.stats.totalImagesDownloaded}`);
  console.log(`   ⏳ Pending review: ${pendingReview}`);
  console.log(`   ✅ Approved: ${approved}`);
  console.log(`   ❌ Rejected: ${rejected}`);
  console.log(`   📋 Queue: ${queued} remaining`);
  console.log('');

  // Time estimate
  if (queued > 0) {
    const batchesLeft = Math.ceil(queued / 2);
    const hoursNeeded = batchesLeft * (CONFIG.BATCH_COOLDOWN_MS / 3600000);
    console.log(`⏰ Estimated time remaining: ~${hoursNeeded.toFixed(1)} hours (${batchesLeft} batches)`);
  }

  // Next batch availability
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

  // Last updated
  console.log(`\n🕐 Last updated: ${new Date(progress.lastUpdated).toLocaleString()}`);

  // Show next up from queue
  if (progress.queue.length > 0) {
    console.log('\n📋 Next up:');
    progress.queue.slice(0, 5).forEach((destId, i) => {
      const dest = DESTINATIONS.find(d => d.id === destId);
      if (dest) {
        console.log(`   ${i + 1}. ${dest.city}, ${dest.country}`);
      }
    });
  }

  console.log('\n' + '='.repeat(60));
}

checkStatus();
