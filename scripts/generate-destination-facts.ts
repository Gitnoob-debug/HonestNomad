/**
 * Generate Destination Intelligence fact sheets
 *
 * Uses OpenRouter (Claude) to generate:
 * 1. Country facts (currency, plugs, visa, etc.) → data/country-facts.json
 * 2. Destination fact sheets (weather, transport, safety) → data/destination-facts/{id}.json
 *
 * Usage:
 *   npx tsx scripts/generate-destination-facts.ts                    # Generate all
 *   npx tsx scripts/generate-destination-facts.ts --country-only     # Only country facts
 *   npx tsx scripts/generate-destination-facts.ts --dest-only        # Only destination facts (requires country-facts.json)
 *   npx tsx scripts/generate-destination-facts.ts --city=paris       # Single city
 *   npx tsx scripts/generate-destination-facts.ts --test             # 3 test cities
 *   npx tsx scripts/generate-destination-facts.ts --dry-run          # Preview, don't save
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local explicitly (Next.js convention)
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
import OpenAI from 'openai';

// ── Config ───────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '..', 'data');
const COUNTRY_FACTS_PATH = path.join(DATA_DIR, 'country-facts.json');
const DEST_FACTS_DIR = path.join(DATA_DIR, 'destination-facts');
const PROGRESS_PATH = path.join(__dirname, 'destination-facts-progress.json');

const MODEL = 'anthropic/claude-sonnet-4.6';
const TODAY = new Date().toISOString().split('T')[0];
const DATA_VERSION = '2026-Q1';

// Rate limiting — be conservative
const DELAY_BETWEEN_CALLS_MS = 2000;

// ── Load destinations ────────────────────────────────────────────────
interface DestInfo {
  id: string;
  city: string;
  country: string;
  region: string;
  vibes: string[];
  bestMonths: number[];
  latitude: number;
  longitude: number;
}

function loadDestinations(): DestInfo[] {
  // Dynamic require to avoid TS import issues with the massive file
  const destFile = path.join(__dirname, '..', 'lib', 'flash', 'destinations.ts');
  const content = fs.readFileSync(destFile, 'utf-8');

  const destinations: DestInfo[] = [];
  // Extract destination objects using regex — simpler than compiling TS
  const regex = /\{\s*id:\s*'([^']+)',\s*city:\s*'([^']+)',\s*country:\s*'([^']+)',\s*airportCode:\s*'[^']+',\s*region:\s*'([^']+)',\s*vibes:\s*\[([^\]]*)\],\s*bestMonths:\s*\[([^\]]*)\],\s*averageCost:\s*\d+,\s*highlights:\s*\[[^\]]*\],[^}]*latitude:\s*([\d.-]+),\s*longitude:\s*([\d.-]+)/g;

  let match;
  while ((match = regex.exec(content)) !== null) {
    destinations.push({
      id: match[1],
      city: match[2],
      country: match[3],
      region: match[4],
      vibes: match[5].replace(/'/g, '').split(',').map(v => v.trim()).filter(Boolean),
      bestMonths: match[6].split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)),
      latitude: parseFloat(match[7]),
      longitude: parseFloat(match[8]),
    });
  }

  return destinations;
}

function getUniqueCountries(destinations: DestInfo[]): string[] {
  return Array.from(new Set(destinations.map(d => d.country))).sort();
}

// ── OpenRouter client ────────────────────────────────────────────────
function getClient(): OpenAI {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY required in .env.local');
  }
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'HonestNomad-DataGen',
    },
  });
}

async function callAI(client: OpenAI, prompt: string, maxTokens: number = 4096): Promise<string> {
  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    temperature: 0.2, // Low temp for factual consistency
    messages: [
      {
        role: 'system',
        content: 'You are a travel data specialist. Return ONLY valid JSON, no markdown code fences, no explanations. Be factual and conservative — use general descriptions, not specific prices or app names.',
      },
      { role: 'user', content: prompt },
    ],
  });

  let text = response.choices[0]?.message?.content || '';
  // Strip markdown code fences if present
  text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  return text;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Progress tracking ────────────────────────────────────────────────
interface Progress {
  countriesGenerated: boolean;
  destinationsCompleted: string[];
  lastUpdated: string;
}

function loadProgress(): Progress {
  if (fs.existsSync(PROGRESS_PATH)) {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
  }
  return { countriesGenerated: false, destinationsCompleted: [], lastUpdated: TODAY };
}

function saveProgress(progress: Progress): void {
  progress.lastUpdated = TODAY;
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

// ── Country facts generation ─────────────────────────────────────────
async function generateCountryFacts(
  client: OpenAI,
  countries: string[],
  dryRun: boolean
): Promise<Record<string, any>> {
  console.log(`\n🌍 Generating country facts for ${countries.length} countries...\n`);

  const allFacts: Record<string, any> = {};

  // Batch 10 countries per prompt for efficiency
  const batchSize = 10;
  for (let i = 0; i < countries.length; i += batchSize) {
    const batch = countries.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(countries.length / batchSize);

    console.log(`   Batch ${batchNum}/${totalBatches}: ${batch.join(', ')}`);

    const prompt = `Generate country travel facts for these ${batch.length} countries. Return a JSON object where each key is the country name exactly as given.

Countries: ${JSON.stringify(batch)}

For EACH country, provide:
{
  "countryName": "exact country name",
  "currencyName": "local currency name",
  "currencyCode": "ISO 4217 code",
  "currencySymbol": "symbol",
  "plugTypes": ["Type X", "Type Y"],
  "voltage": "XXV / XXHz",
  "emergencyNumber": "number",
  "tippingNorm": "General tipping culture in 1 sentence. NO specific percentages — just whether it's expected, appreciated, or not customary.",
  "visaInfo": "General visa info for Western passport holders (US/UK/EU/Canada/Australia) in 1 sentence. Focus on whether visa-free, visa-on-arrival, or visa required. NO specific costs.",
  "languages": ["Primary language", "Secondary language if commonly spoken in tourist areas"],
  "drivingSide": "left" or "right"
}

IMPORTANT:
- tippingNorm must be GENERAL (e.g., "Tipping is appreciated but not expected" not "Tip 15-20%")
- visaInfo must be GENERAL (e.g., "Visa-free for most Western passports up to 90 days")
- For territories/dependencies, use the parent country's currency and standards
- For US territories (Puerto Rico, Guam, US Virgin Islands), use USD and US standards
- Hong Kong and Taiwan have their own currencies and systems`;

    if (dryRun) {
      console.log(`   [DRY RUN] Would generate for: ${batch.join(', ')}`);
      continue;
    }

    try {
      const result = await callAI(client, prompt, 4096);
      const parsed = JSON.parse(result);

      for (const country of batch) {
        if (parsed[country]) {
          allFacts[country] = {
            ...parsed[country],
            _meta: {
              dataVersion: DATA_VERSION,
              lastVerified: TODAY,
              lastUpdated: TODAY,
              generatedBy: 'script-v1',
              reviewStatus: 'auto-generated',
            },
          };
          console.log(`   ✅ ${country}`);
        } else {
          console.log(`   ⚠️ ${country} — missing from response`);
        }
      }
    } catch (err: any) {
      console.error(`   ❌ Batch failed: ${err.message}`);
      // Try one at a time for this batch
      for (const country of batch) {
        try {
          await sleep(DELAY_BETWEEN_CALLS_MS);
          const singlePrompt = `Generate travel facts for ${country}. Return a single JSON object (not wrapped in a parent key):
{
  "countryName": "${country}",
  "currencyName": "...",
  "currencyCode": "...",
  "currencySymbol": "...",
  "plugTypes": [...],
  "voltage": "...",
  "emergencyNumber": "...",
  "tippingNorm": "General 1-sentence description",
  "visaInfo": "General 1-sentence description for Western passport holders",
  "languages": [...],
  "drivingSide": "left" or "right"
}`;
          const result = await callAI(client, singlePrompt, 1024);
          const parsed = JSON.parse(result);
          allFacts[country] = {
            ...parsed,
            _meta: {
              dataVersion: DATA_VERSION,
              lastVerified: TODAY,
              lastUpdated: TODAY,
              generatedBy: 'script-v1',
              reviewStatus: 'auto-generated',
            },
          };
          console.log(`   ✅ ${country} (retry)`);
        } catch (retryErr: any) {
          console.error(`   ❌ ${country} failed: ${retryErr.message}`);
        }
      }
    }

    await sleep(DELAY_BETWEEN_CALLS_MS);
  }

  return allFacts;
}

// ── Destination fact sheet generation ────────────────────────────────
async function generateDestinationFact(
  client: OpenAI,
  dest: DestInfo,
  dryRun: boolean
): Promise<any | null> {
  const prompt = `Generate a destination fact sheet for ${dest.city}, ${dest.country}.

Return a JSON object:
{
  "destinationId": "${dest.id}",
  "city": "${dest.city}",
  "country": "${dest.country}",
  "transportAdvice": "1-2 sentences about general transport. Mention the type of public transit if it exists (metro, bus, tram) but do NOT name specific apps, companies, or ride-share services. Focus on whether walking is practical, whether public transit covers tourist areas, and general taxi availability.",
  "safetyLevel": "very-safe" | "safe" | "exercise-caution" | "exercise-increased-caution",
  "waterSafety": "tap-safe" | "bottled-recommended" | "bottled-required",
  "costLevel": "budget" | "moderate" | "expensive" | "very-expensive",
  "timeZone": "UTC offset, e.g. UTC+1 or UTC+5:30",
  "weather": [
    // 12 entries, one per month (January = month 1)
    {
      "month": 1,
      "avgHighC": number,
      "avgLowC": number,
      "rainProbability": "low" | "moderate" | "high",
      "humidity": "low" | "moderate" | "high",
      "description": "1 sentence: general weather character for this month"
    }
    // ... through month 12
  ]
}

IMPORTANT RULES:
- transportAdvice: NO specific app names (no Uber, Grab, Bolt, etc.). NO specific bus route numbers. Just general advice about transit types and walkability.
- safetyLevel: Be conservative. Most major tourist cities are "safe". Use "exercise-caution" only for cities with known tourist-targeted crime. "exercise-increased-caution" only for genuinely risky destinations.
- Weather data should be climate averages, not forecasts. Round temperatures to whole numbers.
- description for each month: Short, practical. What a traveler should expect.
- costLevel: Relative to global travel. "budget" = Southeast Asia / Eastern Europe level. "moderate" = Southern Europe / Latin America. "expensive" = Western Europe / Japan. "very-expensive" = Switzerland / Scandinavia / Maldives.

Location context: ${dest.city} is at ${dest.latitude}°N, ${dest.longitude}°E in ${dest.region}. Known for: ${dest.vibes.join(', ')}.`;

  if (dryRun) {
    console.log(`   [DRY RUN] Would generate: ${dest.city}, ${dest.country}`);
    return null;
  }

  try {
    const result = await callAI(client, prompt, 3000);
    const parsed = JSON.parse(result);

    // Validate weather array
    if (!parsed.weather || parsed.weather.length !== 12) {
      console.warn(`   ⚠️ ${dest.city}: weather array has ${parsed.weather?.length || 0} entries (expected 12)`);
      // Pad if partially complete
      if (parsed.weather && parsed.weather.length > 0 && parsed.weather.length < 12) {
        while (parsed.weather.length < 12) {
          parsed.weather.push({
            month: parsed.weather.length + 1,
            avgHighC: 20,
            avgLowC: 10,
            rainProbability: 'moderate',
            humidity: 'moderate',
            description: 'Data pending verification',
          });
        }
      }
    }

    // Add meta
    parsed._meta = {
      dataVersion: DATA_VERSION,
      lastVerified: TODAY,
      lastUpdated: TODAY,
      generatedBy: 'script-v1',
      reviewStatus: 'auto-generated',
    };

    return parsed;
  } catch (err: any) {
    console.error(`   ❌ ${dest.city}: ${err.message}`);
    return null;
  }
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const countryOnly = args.includes('--country-only');
  const destOnly = args.includes('--dest-only');
  const testMode = args.includes('--test');
  const cityArg = args.find(a => a.startsWith('--city='));
  const specificCity = cityArg?.split('=')[1];

  console.log('\n📊 DESTINATION INTELLIGENCE GENERATOR\n');
  console.log(`   Model: ${MODEL}`);
  console.log(`   Version: ${DATA_VERSION}`);
  if (dryRun) console.log('   Mode: DRY RUN');
  if (testMode) console.log('   Mode: TEST (3 cities)');
  if (specificCity) console.log(`   Mode: Single city (${specificCity})`);

  // Ensure directories exist
  if (!fs.existsSync(DEST_FACTS_DIR)) {
    fs.mkdirSync(DEST_FACTS_DIR, { recursive: true });
  }

  const destinations = loadDestinations();
  console.log(`\n   Loaded ${destinations.length} destinations`);

  const countries = getUniqueCountries(destinations);
  console.log(`   Found ${countries.length} unique countries`);

  const client = dryRun ? (null as unknown as OpenAI) : getClient();
  const progress = loadProgress();

  // ── Step 1: Country facts ──
  if (!destOnly) {
    if (progress.countriesGenerated && !dryRun && !specificCity) {
      console.log('\n   ✅ Country facts already generated (skipping)');
    } else {
      const countryFacts = await generateCountryFacts(client, countries, dryRun);

      if (!dryRun && Object.keys(countryFacts).length > 0) {
        // Merge with existing if any
        let existing: Record<string, any> = {};
        if (fs.existsSync(COUNTRY_FACTS_PATH)) {
          existing = JSON.parse(fs.readFileSync(COUNTRY_FACTS_PATH, 'utf-8'));
        }
        const merged = { ...existing, ...countryFacts };
        fs.writeFileSync(COUNTRY_FACTS_PATH, JSON.stringify(merged, null, 2));
        console.log(`\n   💾 Saved ${Object.keys(merged).length} country facts to ${COUNTRY_FACTS_PATH}`);

        progress.countriesGenerated = true;
        saveProgress(progress);
      }
    }

    if (countryOnly) {
      console.log('\n✅ Country facts complete. Use --dest-only to generate destination facts next.\n');
      return;
    }
  }

  // ── Step 2: Destination fact sheets ──
  let targetDests = destinations;

  if (specificCity) {
    targetDests = destinations.filter(d => d.id === specificCity);
    if (targetDests.length === 0) {
      console.error(`   ❌ City "${specificCity}" not found`);
      return;
    }
  } else if (testMode) {
    // Pick 3 diverse test cities
    targetDests = destinations.filter(d =>
      ['paris', 'bangkok', 'cape-town'].includes(d.id)
    );
    if (targetDests.length === 0) {
      targetDests = destinations.slice(0, 3);
    }
  }

  // Filter already completed
  const remaining = targetDests.filter(d => !progress.destinationsCompleted.includes(d.id));

  console.log(`\n📍 Generating destination fact sheets`);
  console.log(`   Total: ${targetDests.length}, Already done: ${targetDests.length - remaining.length}, Remaining: ${remaining.length}\n`);

  let completed = 0;
  let failed = 0;

  for (const dest of remaining) {
    const idx = remaining.indexOf(dest) + 1;
    process.stdout.write(`   [${idx}/${remaining.length}] ${dest.city}, ${dest.country}...`);

    const factSheet = await generateDestinationFact(client, dest, dryRun);

    if (factSheet && !dryRun) {
      const outPath = path.join(DEST_FACTS_DIR, `${dest.id}.json`);
      fs.writeFileSync(outPath, JSON.stringify(factSheet, null, 2));
      process.stdout.write(` ✅\n`);

      progress.destinationsCompleted.push(dest.id);
      saveProgress(progress);
      completed++;
    } else if (dryRun) {
      process.stdout.write(` [DRY RUN]\n`);
    } else {
      process.stdout.write(` ❌\n`);
      failed++;
    }

    if (!dryRun) {
      await sleep(DELAY_BETWEEN_CALLS_MS);
    }
  }

  console.log(`\n==============================`);
  console.log(`✅ Complete: ${completed}`);
  if (failed > 0) console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total destinations with fact sheets: ${progress.destinationsCompleted.length}/${destinations.length}`);
  console.log(`==============================\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
