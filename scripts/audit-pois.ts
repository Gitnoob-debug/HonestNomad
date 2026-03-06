/**
 * POI Image Audit Script
 * Comprehensive check of POI data and image migration status
 */

import * as fs from 'fs';
import * as path from 'path';

const POI_DIR = 'data/pois';

interface POI {
  id: string;
  name: string;
  imageUrl?: string;
  supabaseImageUrl?: string;
  googleRating?: number;
  latitude: number;
  longitude: number;
  [key: string]: any;
}

interface TrackedPOI {
  poi: POI;
  cities: Set<string>;
  paths: Set<string>;
}

// Track everything
const uniquePOIs = new Map<string, TrackedPOI>();
const mismatches: any[] = [];

const stats = {
  totalFiles: 0,
  totalEntries: 0,
  uniquePOIs: 0,
  duplicateEntries: 0,
  hasGoogleImage: 0,
  hasSupabaseImage: 0,
  missingSupabase: 0,
  mismatchedUrls: 0,
  noImages: 0,
  supabaseOnly: 0,
};

const missingSupabaseList: { id: string; name: string; city: string; imageUrl: string }[] = [];

// Load all POI files
const files = fs.readdirSync(POI_DIR).filter(f => f.endsWith('.json'));
stats.totalFiles = files.length;

for (const file of files) {
  const cityId = file.replace('.json', '');
  const filePath = path.join(POI_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  for (const [pathType, pois] of Object.entries(data.paths || {})) {
    if (!Array.isArray(pois)) continue;

    for (const poi of pois as POI[]) {
      stats.totalEntries++;

      if (uniquePOIs.has(poi.id)) {
        const existing = uniquePOIs.get(poi.id)!;
        existing.cities.add(cityId);
        existing.paths.add(pathType);
        stats.duplicateEntries++;

        // Check for supabaseImageUrl mismatch between duplicates
        if (existing.poi.supabaseImageUrl !== poi.supabaseImageUrl) {
          mismatches.push({
            poiId: poi.id,
            name: poi.name,
            existingUrl: existing.poi.supabaseImageUrl,
            newUrl: poi.supabaseImageUrl,
            cities: [...existing.cities, cityId],
          });
          stats.mismatchedUrls++;
        }
      } else {
        uniquePOIs.set(poi.id, {
          poi,
          cities: new Set([cityId]),
          paths: new Set([pathType]),
        });
      }
    }
  }
}

// Analyze unique POIs
for (const [id, data] of uniquePOIs) {
  const poi = data.poi;
  stats.uniquePOIs++;

  const hasGoogle = poi.imageUrl && poi.imageUrl.includes('googleapis.com');
  const hasSupabase = !!poi.supabaseImageUrl;

  if (hasGoogle) stats.hasGoogleImage++;
  if (hasSupabase) stats.hasSupabaseImage++;

  if (hasGoogle && !hasSupabase) {
    stats.missingSupabase++;
    missingSupabaseList.push({
      id: poi.id,
      name: poi.name,
      city: [...data.cities][0],
      imageUrl: poi.imageUrl!,
    });
  }

  if (!hasGoogle && hasSupabase) {
    stats.supabaseOnly++;
  }

  if (!hasGoogle && !hasSupabase) {
    stats.noImages++;
  }
}

// Output results
console.log('');
console.log('='.repeat(60));
console.log('  POI IMAGE AUDIT REPORT');
console.log('='.repeat(60));
console.log('');

console.log('FILE STATISTICS:');
console.log(`  Total destination files: ${stats.totalFiles}`);
console.log(`  Total POI entries: ${stats.totalEntries}`);
console.log(`  Unique POIs: ${stats.uniquePOIs}`);
console.log(`  Duplicate entries (POI in multiple paths): ${stats.duplicateEntries}`);
console.log('');

console.log('IMAGE STATUS:');
console.log(`  POIs with Google imageUrl: ${stats.hasGoogleImage}`);
console.log(`  POIs with Supabase imageUrl: ${stats.hasSupabaseImage}`);
console.log(`  Coverage: ${((stats.hasSupabaseImage / stats.uniquePOIs) * 100).toFixed(1)}%`);
console.log('');

console.log('ISSUES:');
console.log(`  Missing Supabase (has Google, no Supabase): ${stats.missingSupabase}`);
console.log(`  Supabase only (no Google source): ${stats.supabaseOnly}`);
console.log(`  No images at all: ${stats.noImages}`);
console.log(`  Mismatched URLs across duplicates: ${stats.mismatchedUrls}`);
console.log('');

// Group missing by city
const missingByCity = new Map<string, number>();
for (const item of missingSupabaseList) {
  missingByCity.set(item.city, (missingByCity.get(item.city) || 0) + 1);
}

if (missingByCity.size > 0) {
  console.log('MISSING SUPABASE BY CITY (top 30):');
  const sorted = [...missingByCity.entries()].sort((a, b) => b[1] - a[1]);
  for (let i = 0; i < Math.min(30, sorted.length); i++) {
    console.log(`  ${sorted[i][0]}: ${sorted[i][1]} POIs`);
  }
  console.log('');
}

if (mismatches.length > 0) {
  console.log('MISMATCH DETAILS (first 10):');
  for (let i = 0; i < Math.min(10, mismatches.length); i++) {
    const m = mismatches[i];
    console.log(`  - ${m.name}: "${m.existingUrl ? 'HAS' : 'MISSING'}" vs "${m.newUrl ? 'HAS' : 'MISSING'}"`);
  }
  console.log('');
}

console.log('='.repeat(60));
console.log('');

// Summary verdict
if (stats.missingSupabase === 0 && stats.mismatchedUrls === 0) {
  console.log('✅ ALL POIs WITH GOOGLE IMAGES HAVE SUPABASE URLS');
} else {
  console.log(`⚠️  ${stats.missingSupabase} POIs still need Supabase images`);
  if (stats.mismatchedUrls > 0) {
    console.log(`⚠️  ${stats.mismatchedUrls} POIs have mismatched URLs across paths`);
  }
}
console.log('');
