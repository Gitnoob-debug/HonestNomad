/**
 * Check migration status
 * Run with: npx tsx scripts/image-migration/check-status.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { DESTINATIONS } from '../../lib/flash/destinations';
import { CONFIG, POPULAR_DESTINATIONS, MigrationProgress } from './config';

function loadProgress(): MigrationProgress | null {
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
    console.log('   Run: npx tsx scripts/image-migration/migrate-images.ts');
    return;
  }

  const completed = progress.completedDestinations.length;
  const failed = progress.failedDestinations.length;
  const total = DESTINATIONS.length;
  const pending = total - completed - failed;
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

  console.log(`   ✅ Completed: ${completed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⏳ Pending: ${pending}`);
  console.log(`   📸 Images downloaded: ${progress.stats.imagesDownloaded}`);
  console.log('');

  // Time estimate
  if (pending > 0) {
    const sessionsNeeded = Math.ceil(pending / CONFIG.REQUESTS_PER_HOUR);
    const hoursNeeded = sessionsNeeded * 1.25; // 1hr 15min per session
    console.log(`⏰ Estimated time remaining: ~${hoursNeeded.toFixed(1)} hours (${sessionsNeeded} sessions)`);
  }

  // Last updated
  console.log(`\n🕐 Last updated: ${new Date(progress.lastUpdated).toLocaleString()}`);

  // Show failed destinations if any
  if (failed > 0) {
    console.log('\n❌ Failed destinations:');
    progress.failedDestinations.slice(0, 10).forEach(f => {
      console.log(`   - ${f.id}: ${f.error}`);
    });
    if (failed > 10) {
      console.log(`   ... and ${failed - 10} more`);
    }
  }

  // Show next up
  const completedSet = new Set(progress.completedDestinations);
  const failedSet = new Set(progress.failedDestinations.map(f => f.id));
  const nextUp = DESTINATIONS
    .filter(d => !completedSet.has(d.id) && !failedSet.has(d.id))
    .slice(0, 5);

  if (nextUp.length > 0) {
    console.log('\n📋 Next up:');
    nextUp.forEach((d, i) => {
      const isPopular = POPULAR_DESTINATIONS.has(d.id);
      console.log(`   ${i + 1}. ${d.city}, ${d.country} ${isPopular ? '⭐' : ''}`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

checkStatus();
