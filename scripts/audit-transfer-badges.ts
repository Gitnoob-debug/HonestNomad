// Audit script to verify transfer badge logic
// Run with: npx tsx scripts/audit-transfer-badges.ts

import { REMOTE_DESTINATION_TRANSFERS } from '../lib/flash/hubAirports';
import { DESTINATIONS } from '../lib/flash/destinations';

console.log('='.repeat(60));
console.log('TRANSFER BADGE AUDIT REPORT');
console.log('='.repeat(60));
console.log('');

// Get all destination IDs from destinations.ts
const destinationIds = new Set(DESTINATIONS.map(d => d.id));
console.log(`Total destinations in database: ${destinationIds.size}`);

// Get all remote destination IDs from hubAirports.ts
const remoteIds = Object.keys(REMOTE_DESTINATION_TRANSFERS);
console.log(`Total remote destinations with transfers: ${remoteIds.length}`);
console.log('');

// Find mismatches: entries in hubAirports that don't exist in destinations
console.log('='.repeat(60));
console.log('MISMATCHES: IDs in hubAirports.ts NOT FOUND in destinations.ts');
console.log('(These transfer badges will NEVER show because destination doesn\'t exist)');
console.log('='.repeat(60));

const orphanedTransfers: string[] = [];
for (const remoteId of remoteIds) {
  if (!destinationIds.has(remoteId)) {
    orphanedTransfers.push(remoteId);
    const transfer = REMOTE_DESTINATION_TRANSFERS[remoteId];
    console.log(`  ❌ "${remoteId}" -> hub: ${transfer.hubCity} (${transfer.hubAirportCode})`);
  }
}

if (orphanedTransfers.length === 0) {
  console.log('  ✅ All transfer entries have matching destinations!');
}
console.log('');

// Show which destinations WILL show transfer badges
console.log('='.repeat(60));
console.log('VALID: Destinations that WILL show transfer badges');
console.log('='.repeat(60));

const validTransfers: string[] = [];
for (const remoteId of remoteIds) {
  if (destinationIds.has(remoteId)) {
    validTransfers.push(remoteId);
    const transfer = REMOTE_DESTINATION_TRANSFERS[remoteId];
    const hours = Math.round(transfer.groundTransferMinutes / 60 * 10) / 10;
    console.log(`  ✅ "${remoteId}" -> ${hours}hr ${transfer.transferType} from ${transfer.hubCity}`);
  }
}
console.log('');
console.log(`Total valid transfer badges: ${validTransfers.length}`);
console.log('');

// Summary
console.log('='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log(`  Destinations in database: ${destinationIds.size}`);
console.log(`  Transfer entries defined: ${remoteIds.length}`);
console.log(`  Valid (will show badge): ${validTransfers.length}`);
console.log(`  Orphaned (wasted entries): ${orphanedTransfers.length}`);

if (orphanedTransfers.length > 0) {
  console.log('');
  console.log('⚠️  ACTION REQUIRED: Fix or remove these orphaned entries:');
  orphanedTransfers.forEach(id => console.log(`     - ${id}`));
}

console.log('');
console.log('='.repeat(60));
