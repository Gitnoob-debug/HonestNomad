// Audit script to verify transfer times meet 2-hour threshold
// Run with: npx tsx scripts/audit-transfer-times.ts

import { REMOTE_DESTINATION_TRANSFERS } from '../lib/flash/hubAirports';
import { DESTINATIONS } from '../lib/flash/destinations';

const TWO_HOUR_THRESHOLD = 120; // minutes

console.log('='.repeat(60));
console.log('TRANSFER TIME THRESHOLD AUDIT');
console.log(`Threshold: ${TWO_HOUR_THRESHOLD} minutes (2 hours) for ground transfers`);
console.log('='.repeat(60));
console.log('');

// Create a map for quick lookup
const destinationMap = new Map(DESTINATIONS.map(d => [d.id, d]));

const underThreshold: string[] = [];
const atOrAboveThreshold: string[] = [];
const connectingFlights: string[] = [];

for (const [destId, transfer] of Object.entries(REMOTE_DESTINATION_TRANSFERS)) {
  const dest = destinationMap.get(destId);
  if (!dest) continue;

  const hours = Math.round(transfer.groundTransferMinutes / 60 * 10) / 10;

  if (transfer.transferType === 'connecting_flight') {
    // Connecting flights are a different category - useful to show regardless of time
    connectingFlights.push(`  ✈️  "${destId}": ${hours}hr flight to ${transfer.hubCity}`);
  } else if (transfer.groundTransferMinutes < TWO_HOUR_THRESHOLD) {
    underThreshold.push(`  ⚠️  "${destId}": ${transfer.groundTransferMinutes}min (${hours}hr) ${transfer.transferType} - UNDER threshold`);
  } else {
    atOrAboveThreshold.push(`  ✅ "${destId}": ${transfer.groundTransferMinutes}min (${hours}hr) ${transfer.transferType} from ${transfer.hubCity}`);
  }
}

console.log('GROUND TRANSFERS AT OR ABOVE 2-HOUR THRESHOLD:');
console.log('(These SHOULD show transfer badge)');
console.log('-'.repeat(60));
atOrAboveThreshold.forEach(line => console.log(line));
console.log('');

console.log('GROUND TRANSFERS UNDER 2-HOUR THRESHOLD:');
console.log('(Consider removing - users expect short drives from airports)');
console.log('-'.repeat(60));
if (underThreshold.length === 0) {
  console.log('  None - all ground transfers meet the threshold!');
} else {
  underThreshold.forEach(line => console.log(line));
}
console.log('');

console.log('CONNECTING FLIGHTS (different category - always useful):');
console.log('-'.repeat(60));
connectingFlights.forEach(line => console.log(line));
console.log('');

console.log('='.repeat(60));
console.log('SUMMARY:');
console.log(`  Ground transfers >= 2hr: ${atOrAboveThreshold.length}`);
console.log(`  Ground transfers < 2hr: ${underThreshold.length} (consider removing)`);
console.log(`  Connecting flights: ${connectingFlights.length}`);
console.log('='.repeat(60));

if (underThreshold.length > 0) {
  console.log('');
  console.log('⚠️  ACTION: Remove ground transfers under 2 hours:');
  underThreshold.forEach(line => console.log(line.replace('  ⚠️  ', '     - ')));
}
