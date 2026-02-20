/**
 * Validate Destination Intelligence fact sheets
 *
 * Checks:
 * 1. All country facts match schema
 * 2. All destination facts match schema
 * 3. Every destination's country exists in country-facts.json
 * 4. Weather arrays have exactly 12 entries
 * 5. Flags stale data (lastVerified > 6 months ago)
 * 6. Reports destinations with POI data but no fact sheet
 *
 * Usage:
 *   npx tsx scripts/validate-destination-facts.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');
const COUNTRY_FACTS_PATH = path.join(DATA_DIR, 'country-facts.json');
const DEST_FACTS_DIR = path.join(DATA_DIR, 'destination-facts');
const POIS_DIR = path.join(DATA_DIR, 'pois');

// ── Schema validation ────────────────────────────────────────────────

const VALID_SAFETY = ['very-safe', 'safe', 'exercise-caution', 'exercise-increased-caution'];
const VALID_COST = ['budget', 'moderate', 'expensive', 'very-expensive'];
const VALID_WATER = ['tap-safe', 'bottled-recommended', 'bottled-required'];
const VALID_RAIN = ['low', 'moderate', 'high'];
const VALID_HUMIDITY = ['low', 'moderate', 'high'];
const VALID_DRIVING = ['left', 'right'];
const VALID_REVIEW = ['auto-generated', 'human-verified'];

interface ValidationError {
  file: string;
  field: string;
  message: string;
}

function validateCountryFact(country: string, fact: any): ValidationError[] {
  const errors: ValidationError[] = [];
  const file = `country-facts.json#${country}`;

  if (!fact.countryName) errors.push({ file, field: 'countryName', message: 'Missing' });
  if (!fact.currencyName) errors.push({ file, field: 'currencyName', message: 'Missing' });
  if (!fact.currencyCode || fact.currencyCode.length !== 3) errors.push({ file, field: 'currencyCode', message: 'Missing or not 3 chars' });
  if (!fact.currencySymbol) errors.push({ file, field: 'currencySymbol', message: 'Missing' });
  if (!Array.isArray(fact.plugTypes) || fact.plugTypes.length === 0) errors.push({ file, field: 'plugTypes', message: 'Missing or empty' });
  if (!fact.voltage) errors.push({ file, field: 'voltage', message: 'Missing' });
  if (!fact.emergencyNumber) errors.push({ file, field: 'emergencyNumber', message: 'Missing' });
  if (!fact.tippingNorm) errors.push({ file, field: 'tippingNorm', message: 'Missing' });
  if (!fact.visaInfo) errors.push({ file, field: 'visaInfo', message: 'Missing' });
  if (!Array.isArray(fact.languages) || fact.languages.length === 0) errors.push({ file, field: 'languages', message: 'Missing or empty' });
  if (!VALID_DRIVING.includes(fact.drivingSide)) errors.push({ file, field: 'drivingSide', message: `Invalid: ${fact.drivingSide}` });
  if (!fact._meta) errors.push({ file, field: '_meta', message: 'Missing' });
  if (fact._meta && !VALID_REVIEW.includes(fact._meta.reviewStatus)) errors.push({ file, field: '_meta.reviewStatus', message: `Invalid: ${fact._meta.reviewStatus}` });

  return errors;
}

function validateDestinationFact(id: string, fact: any): ValidationError[] {
  const errors: ValidationError[] = [];
  const file = `destination-facts/${id}.json`;

  if (!fact.destinationId) errors.push({ file, field: 'destinationId', message: 'Missing' });
  if (fact.destinationId !== id) errors.push({ file, field: 'destinationId', message: `Mismatch: ${fact.destinationId} vs ${id}` });
  if (!fact.city) errors.push({ file, field: 'city', message: 'Missing' });
  if (!fact.country) errors.push({ file, field: 'country', message: 'Missing' });
  if (!fact.transportAdvice) errors.push({ file, field: 'transportAdvice', message: 'Missing' });
  if (!VALID_SAFETY.includes(fact.safetyLevel)) errors.push({ file, field: 'safetyLevel', message: `Invalid: ${fact.safetyLevel}` });
  if (!VALID_WATER.includes(fact.waterSafety)) errors.push({ file, field: 'waterSafety', message: `Invalid: ${fact.waterSafety}` });
  if (!VALID_COST.includes(fact.costLevel)) errors.push({ file, field: 'costLevel', message: `Invalid: ${fact.costLevel}` });
  if (!fact.timeZone) errors.push({ file, field: 'timeZone', message: 'Missing' });

  // Weather validation
  if (!Array.isArray(fact.weather)) {
    errors.push({ file, field: 'weather', message: 'Not an array' });
  } else {
    if (fact.weather.length !== 12) {
      errors.push({ file, field: 'weather', message: `Has ${fact.weather.length} entries, expected 12` });
    }
    for (const w of fact.weather) {
      if (typeof w.month !== 'number' || w.month < 1 || w.month > 12) {
        errors.push({ file, field: `weather[${w.month}].month`, message: `Invalid month: ${w.month}` });
      }
      if (typeof w.avgHighC !== 'number') errors.push({ file, field: `weather[${w.month}].avgHighC`, message: 'Not a number' });
      if (typeof w.avgLowC !== 'number') errors.push({ file, field: `weather[${w.month}].avgLowC`, message: 'Not a number' });
      if (!VALID_RAIN.includes(w.rainProbability)) errors.push({ file, field: `weather[${w.month}].rainProbability`, message: `Invalid: ${w.rainProbability}` });
      if (!VALID_HUMIDITY.includes(w.humidity)) errors.push({ file, field: `weather[${w.month}].humidity`, message: `Invalid: ${w.humidity}` });
    }
  }

  if (!fact._meta) errors.push({ file, field: '_meta', message: 'Missing' });

  return errors;
}

// ── Main ─────────────────────────────────────────────────────────────

function main() {
  console.log('\n🔍 DESTINATION INTELLIGENCE VALIDATOR\n');

  let totalErrors = 0;
  let totalWarnings = 0;

  // 1. Country facts
  console.log('📋 Validating country facts...');
  if (!fs.existsSync(COUNTRY_FACTS_PATH)) {
    console.log('   ❌ country-facts.json not found!');
    totalErrors++;
  } else {
    const countryFacts = JSON.parse(fs.readFileSync(COUNTRY_FACTS_PATH, 'utf-8'));
    const countries = Object.keys(countryFacts);
    console.log(`   Found ${countries.length} countries`);

    for (const country of countries) {
      const errors = validateCountryFact(country, countryFacts[country]);
      for (const err of errors) {
        console.log(`   ❌ ${err.file} → ${err.field}: ${err.message}`);
        totalErrors++;
      }
    }

    if (countries.length === 0) {
      console.log('   ⚠️ No country facts found');
      totalWarnings++;
    }
  }

  // 2. Destination facts
  console.log('\n📍 Validating destination fact sheets...');
  if (!fs.existsSync(DEST_FACTS_DIR)) {
    console.log('   ❌ destination-facts/ directory not found!');
    totalErrors++;
  } else {
    const destFiles = fs.readdirSync(DEST_FACTS_DIR).filter(f => f.endsWith('.json'));
    console.log(`   Found ${destFiles.length} destination fact sheets`);

    // Load country facts for cross-reference
    let countryFacts: Record<string, any> = {};
    if (fs.existsSync(COUNTRY_FACTS_PATH)) {
      countryFacts = JSON.parse(fs.readFileSync(COUNTRY_FACTS_PATH, 'utf-8'));
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    let staleCount = 0;
    let missingCountry = 0;

    for (const file of destFiles) {
      const id = file.replace('.json', '');
      const factPath = path.join(DEST_FACTS_DIR, file);
      const fact = JSON.parse(fs.readFileSync(factPath, 'utf-8'));

      const errors = validateDestinationFact(id, fact);
      for (const err of errors) {
        console.log(`   ❌ ${err.file} → ${err.field}: ${err.message}`);
        totalErrors++;
      }

      // Cross-reference country
      if (fact.country && !countryFacts[fact.country]) {
        console.log(`   ⚠️ ${file} → country "${fact.country}" not in country-facts.json`);
        missingCountry++;
        totalWarnings++;
      }

      // Staleness check
      if (fact._meta?.lastVerified) {
        const verified = new Date(fact._meta.lastVerified);
        if (verified < sixMonthsAgo) {
          staleCount++;
        }
      }
    }

    if (staleCount > 0) {
      console.log(`\n   ⚠️ ${staleCount} destination(s) have stale data (>6 months since lastVerified)`);
      totalWarnings += staleCount;
    }
    if (missingCountry > 0) {
      console.log(`   ⚠️ ${missingCountry} destination(s) reference countries not in country-facts.json`);
    }

    // 3. Coverage check — destinations with POI data but no fact sheet
    if (fs.existsSync(POIS_DIR)) {
      const poiFiles = fs.readdirSync(POIS_DIR).filter(f => f.endsWith('.json'));
      const destFactIds = new Set(destFiles.map(f => f.replace('.json', '')));
      const missingFacts = poiFiles.filter(f => !destFactIds.has(f.replace('.json', '')));

      if (missingFacts.length > 0) {
        console.log(`\n   📊 ${missingFacts.length} destination(s) have POI data but no fact sheet:`);
        for (const f of missingFacts.slice(0, 10)) {
          console.log(`      - ${f.replace('.json', '')}`);
        }
        if (missingFacts.length > 10) {
          console.log(`      ... and ${missingFacts.length - 10} more`);
        }
        totalWarnings += missingFacts.length;
      } else {
        console.log(`\n   ✅ All ${poiFiles.length} destinations with POI data have fact sheets`);
      }
    }
  }

  // Summary
  console.log('\n==============================');
  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('✅ All validations passed!');
  } else {
    if (totalErrors > 0) console.log(`❌ ${totalErrors} errors`);
    if (totalWarnings > 0) console.log(`⚠️ ${totalWarnings} warnings`);
  }
  console.log('==============================\n');

  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
