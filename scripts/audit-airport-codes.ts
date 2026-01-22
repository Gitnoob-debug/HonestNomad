// Audit script to verify airport codes match transfer logic
// Run with: npx tsx scripts/audit-airport-codes.ts

import { REMOTE_DESTINATION_TRANSFERS } from '../lib/flash/hubAirports';
import { DESTINATIONS } from '../lib/flash/destinations';

console.log('='.repeat(60));
console.log('AIRPORT CODE CONSISTENCY AUDIT');
console.log('='.repeat(60));
console.log('');

// Create a map for quick lookup
const destinationMap = new Map(DESTINATIONS.map(d => [d.id, d]));

console.log('Checking that destination airport codes are different from hub codes...');
console.log('(If same, transfer badge is misleading - flight goes direct)');
console.log('');

let issues = 0;

for (const [destId, transfer] of Object.entries(REMOTE_DESTINATION_TRANSFERS)) {
  const dest = destinationMap.get(destId);
  if (!dest) continue;

  // Check if destination airport is same as hub airport
  if (dest.airportCode === transfer.hubAirportCode) {
    console.log(`⚠️  "${destId}": destination airportCode "${dest.airportCode}" SAME as hub "${transfer.hubAirportCode}"`);
    console.log(`    This means flights go DIRECT - no transfer needed!`);
    issues++;
    continue;
  }

  // For connecting flights, the hub should be a major international airport
  // For drives, the destination airport should either be small/regional or not exist
  if (transfer.transferType === 'drive' || transfer.transferType === 'train' || transfer.transferType === 'ferry') {
    // Ground transfer - destination airport should be regional or flights would be direct
    console.log(`✅ "${destId}": ${dest.airportCode || 'no direct airport'} ← ${transfer.hubAirportCode} (${transfer.hubCity}) via ${transfer.transferType}`);
  } else if (transfer.transferType === 'connecting_flight') {
    // Connecting flight - both airports exist but hub has more international connections
    console.log(`✅ "${destId}": ${dest.airportCode} ← ${transfer.hubAirportCode} (${transfer.hubCity}) via connecting flight`);
  }
}

console.log('');
console.log('='.repeat(60));

if (issues === 0) {
  console.log('✅ All airport codes are logically consistent!');
} else {
  console.log(`⚠️  Found ${issues} potential issue(s) to review.`);
}

console.log('='.repeat(60));
