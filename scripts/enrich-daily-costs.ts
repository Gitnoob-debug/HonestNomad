/**
 * Enrich destinations with daily cost-of-living estimates
 *
 * Uses Claude to generate per-person daily cost estimates (USD) for:
 *   - Food: mix of casual breakfast/lunch + mid-range dinner
 *   - Activities: museums, tours, entertainment, typical tourist activities
 *   - Transport: local taxis, transit, rideshare
 *
 * Outputs to data/daily-costs.json, then a merge step patches destinations.ts.
 *
 * Usage:
 *   npx tsx scripts/enrich-daily-costs.ts              # Generate all
 *   npx tsx scripts/enrich-daily-costs.ts --test       # 5 test cities
 *   npx tsx scripts/enrich-daily-costs.ts --merge      # Merge into destinations.ts
 *   npx tsx scripts/enrich-daily-costs.ts --review     # Show summary stats
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
import OpenAI from 'openai';

// ── Config ───────────────────────────────────────────────────────────
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'daily-costs.json');
const DEST_FILE = path.join(__dirname, '..', 'lib', 'flash', 'destinations.ts');

const MODEL = 'anthropic/claude-3.5-haiku'; // Haiku is fast + cheap for structured data
const BATCH_SIZE = 50; // cities per API call
const DELAY_MS = 1500; // between batches
const TODAY = new Date().toISOString().split('T')[0];

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
});

// ── Types ────────────────────────────────────────────────────────────
interface DailyCostEntry {
  id: string;
  city: string;
  country: string;
  foodPerDay: number;
  activitiesPerDay: number;
  transportPerDay: number;
  totalPerDay: number;
  source: 'claude';
  lastUpdated: string;
}

interface DestInfo {
  id: string;
  city: string;
  country: string;
}

// ── Load destinations from the TS file ───────────────────────────────
function loadDestinations(): DestInfo[] {
  const content = fs.readFileSync(DEST_FILE, 'utf-8');
  const dests: DestInfo[] = [];

  const regex = /id:\s*'([^']+)',\s*city:\s*'([^']+)',\s*country:\s*'([^']+)'/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    dests.push({ id: match[1], city: match[2], country: match[3] });
  }
  return dests;
}

// ── Load existing results (for resume support) ───────────────────────
function loadExisting(): Map<string, DailyCostEntry> {
  if (!fs.existsSync(OUTPUT_PATH)) return new Map();
  try {
    const data: DailyCostEntry[] = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
    return new Map(data.map(d => [d.id, d]));
  } catch {
    return new Map();
  }
}

// ── Save results ─────────────────────────────────────────────────────
function saveResults(results: Map<string, DailyCostEntry>) {
  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const sorted = [...results.values()].sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sorted, null, 2));
}

// ── Claude batch call ────────────────────────────────────────────────
async function estimateCosts(batch: DestInfo[]): Promise<DailyCostEntry[]> {
  const cityList = batch.map(d => `${d.id}: ${d.city}, ${d.country}`).join('\n');

  const prompt = `You are a travel cost expert. For each destination below, estimate the DAILY cost in USD per person for a typical tourist (mid-range, not backpacker, not luxury).

CATEGORIES:
1. **foodPerDay** — Breakfast (casual cafe), lunch (casual restaurant), dinner (mid-range restaurant). Include 1-2 drinks. Round to nearest $5.
2. **activitiesPerDay** — Average tourist spending on 1-2 activities: museums, guided tours, boat trips, adventure activities, shows/entertainment. Round to nearest $5.
3. **transportPerDay** — Local getting-around costs: 2-3 taxi/rideshare trips + some public transit. Round to nearest $5.

IMPORTANT:
- All values in USD
- Round to nearest $5 (e.g., 15, 20, 25, 30...)
- Be realistic — Bangkok food should be ~$20/day, not $50. Zurich food should be ~$120/day, not $60.
- Consider actual local prices, not tourist-trap prices
- For remote/island destinations, costs are typically higher (supply chain)
- For developing countries, costs are genuinely low — don't inflate

DESTINATIONS:
${cityList}

Return ONLY a JSON array with this exact format (no markdown, no explanation):
[
  {"id": "paris", "foodPerDay": 70, "activitiesPerDay": 30, "transportPerDay": 15},
  ...
]`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3, // low temp for consistent estimates
    max_tokens: 4000,
  });

  const text = response.choices[0]?.message?.content?.trim() || '';

  // Parse JSON (strip markdown fences if present)
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const parsed: Array<{ id: string; foodPerDay: number; activitiesPerDay: number; transportPerDay: number }> =
    JSON.parse(cleaned);

  // Enrich with metadata
  return parsed.map(p => {
    const dest = batch.find(d => d.id === p.id);
    return {
      id: p.id,
      city: dest?.city || p.id,
      country: dest?.country || '',
      foodPerDay: p.foodPerDay,
      activitiesPerDay: p.activitiesPerDay,
      transportPerDay: p.transportPerDay,
      totalPerDay: p.foodPerDay + p.activitiesPerDay + p.transportPerDay,
      source: 'claude' as const,
      lastUpdated: TODAY,
    };
  });
}

// ── Merge into destinations.ts ──────────────────────────────────────
function mergeIntoDestinations() {
  if (!fs.existsSync(OUTPUT_PATH)) {
    console.error('No daily-costs.json found. Run enrichment first.');
    process.exit(1);
  }

  const costs: DailyCostEntry[] = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
  const costMap = new Map(costs.map(c => [c.id, c]));

  let content = fs.readFileSync(DEST_FILE, 'utf-8');
  let patchCount = 0;

  for (const [id, cost] of costMap) {
    // Find the destination block and add dailyCosts after averageCost
    const pattern = new RegExp(
      `(id:\\s*'${id}'[\\s\\S]*?averageCost:\\s*\\d+,)`,
    );

    const replacement = `$1\n    dailyCosts: { foodPerDay: ${cost.foodPerDay}, activitiesPerDay: ${cost.activitiesPerDay}, transportPerDay: ${cost.transportPerDay}, source: 'claude', lastUpdated: '${TODAY}' },`;

    if (pattern.test(content) && !content.includes(`id: '${id}'`) === false) {
      // Check if dailyCosts already exists for this destination
      const blockStart = content.indexOf(`id: '${id}'`);
      if (blockStart === -1) continue;

      // Find the next destination block to scope our search
      const nextId = content.indexOf("\n  {", blockStart + 10);
      const block = nextId > -1 ? content.slice(blockStart, nextId) : content.slice(blockStart);

      if (block.includes('dailyCosts')) {
        // Already has dailyCosts — update it
        const dcRegex = new RegExp(
          `(id:\\s*'${id}'[\\s\\S]*?)dailyCosts:\\s*\\{[^}]+\\},?`,
        );
        content = content.replace(dcRegex, `$1dailyCosts: { foodPerDay: ${cost.foodPerDay}, activitiesPerDay: ${cost.activitiesPerDay}, transportPerDay: ${cost.transportPerDay}, source: 'claude', lastUpdated: '${TODAY}' },`);
      } else {
        // Add dailyCosts after averageCost
        content = content.replace(pattern, replacement);
      }
      patchCount++;
    }
  }

  fs.writeFileSync(DEST_FILE, content);
  console.log(`\n✅ Patched ${patchCount}/${costMap.size} destinations in destinations.ts`);
}

// ── Review / summary stats ──────────────────────────────────────────
function reviewResults() {
  if (!fs.existsSync(OUTPUT_PATH)) {
    console.error('No daily-costs.json found. Run enrichment first.');
    process.exit(1);
  }

  const costs: DailyCostEntry[] = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));

  console.log(`\n📊 Daily Cost Summary (${costs.length} destinations)\n`);

  // Sort by total for extremes
  const sorted = [...costs].sort((a, b) => a.totalPerDay - b.totalPerDay);

  console.log('── Cheapest 10 ──');
  sorted.slice(0, 10).forEach(c =>
    console.log(`  $${c.totalPerDay}/day  ${c.city}, ${c.country} (food: $${c.foodPerDay}, activities: $${c.activitiesPerDay}, transport: $${c.transportPerDay})`),
  );

  console.log('\n── Most Expensive 10 ──');
  sorted.slice(-10).reverse().forEach(c =>
    console.log(`  $${c.totalPerDay}/day  ${c.city}, ${c.country} (food: $${c.foodPerDay}, activities: $${c.activitiesPerDay}, transport: $${c.transportPerDay})`),
  );

  // Averages by region — need to cross-reference with destinations
  const dests = loadDestinations();
  const destMap = new Map(dests.map(d => [d.id, d]));

  const regionTotals: Record<string, number[]> = {};
  for (const c of costs) {
    // We don't have region in the cost data, so just show global stats
  }

  const totals = costs.map(c => c.totalPerDay);
  const avg = Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
  const median = totals.sort((a, b) => a - b)[Math.floor(totals.length / 2)];

  console.log(`\n── Global Stats ──`);
  console.log(`  Mean: $${avg}/day/person`);
  console.log(`  Median: $${median}/day/person`);
  console.log(`  Range: $${totals[0]} - $${totals[totals.length - 1]}`);

  // Sanity checks
  console.log('\n── Sanity Checks ──');
  const bangkok = costs.find(c => c.id === 'bangkok');
  const zurich = costs.find(c => c.id === 'zurich');
  const nyc = costs.find(c => c.id === 'new-york');
  const tirana = costs.find(c => c.id === 'tirana');
  if (bangkok) console.log(`  Bangkok: $${bangkok.totalPerDay}/day (expect ~$40)`);
  if (zurich) console.log(`  Zurich: $${zurich.totalPerDay}/day (expect ~$170)`);
  if (nyc) console.log(`  New York: $${nyc.totalPerDay}/day (expect ~$120)`);
  if (tirana) console.log(`  Tirana: $${tirana.totalPerDay}/day (expect ~$50)`);
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--merge')) {
    mergeIntoDestinations();
    return;
  }

  if (args.includes('--review')) {
    reviewResults();
    return;
  }

  const isTest = args.includes('--test');
  const allDests = loadDestinations();
  const dests = isTest ? allDests.slice(0, 5) : allDests;

  console.log(`\n🌍 Daily Cost Enrichment — ${dests.length} destinations`);
  console.log(`   Model: ${MODEL}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log(`   Output: ${OUTPUT_PATH}\n`);

  const existing = loadExisting();
  const todo = dests.filter(d => !existing.has(d.id));

  if (todo.length === 0) {
    console.log('✅ All destinations already enriched. Use --review to check or --merge to apply.');
    return;
  }

  console.log(`   Already done: ${existing.size}`);
  console.log(`   Remaining: ${todo.length}\n`);

  // Process in batches
  const batches: DestInfo[][] = [];
  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    batches.push(todo.slice(i, i + BATCH_SIZE));
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`  Batch ${i + 1}/${batches.length} (${batch.length} cities)...`);

    try {
      const results = await estimateCosts(batch);
      for (const r of results) {
        existing.set(r.id, r);
      }
      saveResults(existing);
      console.log(`    ✓ Got ${results.length} estimates. Total: ${existing.size}/${dests.length}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`    ✗ Batch failed: ${msg}`);
      console.log(`    Saving progress and continuing...`);
      saveResults(existing);
    }

    if (i < batches.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\n✅ Done! ${existing.size} destinations enriched.`);
  console.log(`   Run with --review to check results`);
  console.log(`   Run with --merge to apply to destinations.ts`);
}

main().catch(console.error);
