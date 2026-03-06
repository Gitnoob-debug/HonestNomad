import * as fs from 'fs';
import * as path from 'path';

const MEGA_CITIES = [
  'paris', 'rome', 'barcelona', 'london', 'vienna', 'milan', 'madrid', 'berlin', 'istanbul'
];

const MAJOR_CITIES = [
  'amsterdam', 'lisbon', 'santorini', 'prague', 'dubrovnik', 'reykjavik',
  'amalfi', 'florence', 'venice', 'munich', 'brussels', 'copenhagen',
  'stockholm', 'oslo', 'helsinki', 'edinburgh', 'dublin', 'budapest',
  'krakow', 'athens', 'mykonos', 'crete', 'porto', 'marseille'
];

const PATH_TYPES = ['classic', 'foodie', 'adventure', 'cultural', 'relaxation', 'nightlife', 'trendy'];

interface POI {
  id: string;
  name: string;
  pathType: string;
  googleRating?: number;
  latitude: number;
  longitude: number;
  address?: string;
  imageUrl?: string;
  description?: string;
}

interface AuditResult {
  city: string;
  tier: string;
  totalPois: number;
  uniquePlaces: number;
  samePathDupes: number;
  missingPaths: string[];
  missingFields: { field: string; count: number }[];
  avgRating: number;
  poiCountByPath: Record<string, number>;
  issues: string[];
}

function auditCity(city: string, tier: string, targetPois: number): AuditResult {
  const filePath = path.join('data/pois', city + '.json');
  const result: AuditResult = {
    city,
    tier,
    totalPois: 0,
    uniquePlaces: 0,
    samePathDupes: 0,
    missingPaths: [],
    missingFields: [],
    avgRating: 0,
    poiCountByPath: {},
    issues: []
  };

  if (!fs.existsSync(filePath)) {
    result.issues.push('FILE NOT FOUND');
    return result;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // Check metadata
  if (!data.destinationId) result.issues.push('Missing destinationId');
  if (!data.city) result.issues.push('Missing city name');
  if (!data.latitude || !data.longitude) result.issues.push('Missing coordinates');

  // Collect all POIs
  const pois: POI[] = [];
  if (data.paths) {
    for (const pathType of PATH_TYPES) {
      const pathPois = data.paths[pathType] || [];
      result.poiCountByPath[pathType] = pathPois.length;

      if (pathPois.length === 0) {
        result.missingPaths.push(pathType);
      }

      for (const poi of pathPois) {
        pois.push({ ...poi, pathType });
      }
    }
  } else {
    result.issues.push('Missing paths object');
  }

  result.totalPois = pois.length;

  // Check unique places
  const uniqueIds = new Set(pois.map(p => p.id));
  result.uniquePlaces = uniqueIds.size;

  // Check for same-path duplicates
  const pathPoiIds = new Map<string, Set<string>>();
  for (const poi of pois) {
    if (!pathPoiIds.has(poi.pathType)) {
      pathPoiIds.set(poi.pathType, new Set());
    }
    const pathSet = pathPoiIds.get(poi.pathType)!;
    if (pathSet.has(poi.id)) {
      result.samePathDupes++;
    }
    pathSet.add(poi.id);
  }

  // Check missing fields
  const fieldChecks = [
    { field: 'id', check: (p: POI) => !p.id },
    { field: 'name', check: (p: POI) => !p.name },
    { field: 'latitude', check: (p: POI) => !p.latitude },
    { field: 'longitude', check: (p: POI) => !p.longitude },
    { field: 'googleRating', check: (p: POI) => p.googleRating === undefined },
    { field: 'description', check: (p: POI) => !p.description },
    { field: 'imageUrl', check: (p: POI) => !p.imageUrl },
  ];

  for (const { field, check } of fieldChecks) {
    const count = pois.filter(check).length;
    if (count > 0) {
      result.missingFields.push({ field, count });
    }
  }

  // Calculate average rating
  const withRating = pois.filter(p => p.googleRating);
  if (withRating.length > 0) {
    result.avgRating = withRating.reduce((sum, p) => sum + (p.googleRating || 0), 0) / withRating.length;
  }

  // Check if under target
  if (result.totalPois < targetPois * 0.8) {
    result.issues.push('Under target (' + result.totalPois + '/' + targetPois + ')');
  }

  if (result.samePathDupes > 0) {
    result.issues.push(result.samePathDupes + ' same-path duplicates');
  }

  return result;
}

console.log('='.repeat(70));
console.log('COMPREHENSIVE POI AUDIT');
console.log('='.repeat(70));
console.log();

const allResults: AuditResult[] = [];
let totalIssues = 0;

// Audit Mega Cities
console.log('MEGA CITIES (target: 300 POIs)');
console.log('-'.repeat(70));
for (const city of MEGA_CITIES) {
  const result = auditCity(city, 'mega', 300);
  allResults.push(result);

  const status = result.issues.length === 0 ? '✅' : '⚠️';
  console.log(status + ' ' + city.toUpperCase().padEnd(15) + ' | ' +
    String(result.totalPois).padStart(3) + ' POIs | ' +
    String(result.uniquePlaces).padStart(3) + ' unique | ' +
    'Rating: ' + result.avgRating.toFixed(2) + '★' +
    (result.issues.length > 0 ? ' | Issues: ' + result.issues.join(', ') : '')
  );
  totalIssues += result.issues.length;
}
console.log();

// Audit Major Cities
console.log('MAJOR CITIES (target: 200 POIs)');
console.log('-'.repeat(70));
for (const city of MAJOR_CITIES) {
  const result = auditCity(city, 'major', 200);
  allResults.push(result);

  const status = result.issues.length === 0 ? '✅' : '⚠️';
  console.log(status + ' ' + city.toUpperCase().padEnd(15) + ' | ' +
    String(result.totalPois).padStart(3) + ' POIs | ' +
    String(result.uniquePlaces).padStart(3) + ' unique | ' +
    'Rating: ' + result.avgRating.toFixed(2) + '★' +
    (result.issues.length > 0 ? ' | Issues: ' + result.issues.join(', ') : '')
  );
  totalIssues += result.issues.length;
}
console.log();

// Summary stats
const megaResults = allResults.filter(r => r.tier === 'mega');
const majorResults = allResults.filter(r => r.tier === 'major');

console.log('='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

console.log();
console.log('MEGA CITIES:');
console.log('  Cities: ' + megaResults.length);
console.log('  Total POIs: ' + megaResults.reduce((s, r) => s + r.totalPois, 0));
console.log('  Unique places: ' + megaResults.reduce((s, r) => s + r.uniquePlaces, 0));
console.log('  Same-path dupes: ' + megaResults.reduce((s, r) => s + r.samePathDupes, 0));
console.log('  Avg rating: ' + (megaResults.reduce((s, r) => s + r.avgRating, 0) / megaResults.length).toFixed(2) + '★');

console.log();
console.log('MAJOR CITIES:');
console.log('  Cities: ' + majorResults.length);
console.log('  Total POIs: ' + majorResults.reduce((s, r) => s + r.totalPois, 0));
console.log('  Unique places: ' + majorResults.reduce((s, r) => s + r.uniquePlaces, 0));
console.log('  Same-path dupes: ' + majorResults.reduce((s, r) => s + r.samePathDupes, 0));
console.log('  Avg rating: ' + (majorResults.reduce((s, r) => s + r.avgRating, 0) / majorResults.length).toFixed(2) + '★');

console.log();
console.log('COMBINED:');
console.log('  Total cities: ' + allResults.length);
console.log('  Total POIs: ' + allResults.reduce((s, r) => s + r.totalPois, 0));
console.log('  Total unique places: ' + allResults.reduce((s, r) => s + r.uniquePlaces, 0));
console.log('  Total same-path dupes: ' + allResults.reduce((s, r) => s + r.samePathDupes, 0));

console.log();
console.log('='.repeat(70));
if (totalIssues === 0) {
  console.log('✅ ALL CHECKS PASSED - No issues found');
} else {
  console.log('⚠️  ISSUES FOUND: ' + totalIssues + ' total');
  console.log();
  console.log('Cities with issues:');
  for (const r of allResults.filter(r => r.issues.length > 0)) {
    console.log('  - ' + r.city + ': ' + r.issues.join(', '));
  }
}
console.log('='.repeat(70));
