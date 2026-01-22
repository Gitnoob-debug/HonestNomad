/**
 * Generate Photo Search Terms using OpenRouter (Claude)
 *
 * Creates curated, visually-searchable terms for each destination.
 * Run once, review the output, then use for image migration.
 *
 * Run with: npx tsx scripts/image-migration/generate-search-terms.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { DESTINATIONS } from '../../lib/flash/destinations';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const OUTPUT_FILE = path.join(process.cwd(), 'scripts/image-migration/search-terms.json');
const BATCH_SIZE = 25; // Process 25 destinations per API call

interface SearchTerms {
  [destinationId: string]: {
    city: string;
    country: string;
    terms: string[];
  };
}

async function generateTermsForBatch(destinations: typeof DESTINATIONS): Promise<SearchTerms> {
  const destList = destinations.map(d =>
    `- ${d.id}: ${d.city}, ${d.country} (vibes: ${d.vibes.join(', ')}; highlights: ${d.highlights.join(', ')})`
  ).join('\n');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://honestnomad.com',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Generate 5-6 photo search terms for each destination below. These terms will be used to search Unsplash for travel photos.

Requirements for search terms:
- Must be VISUALLY SEARCHABLE (landmarks, scenery, architecture, not abstract concepts)
- Include the city name in each term for specificity
- Mix of: iconic landmarks, scenic views, local atmosphere, architecture
- Avoid generic terms like "cityscape" or "travel" - be specific
- Consider what makes each place UNIQUE and PHOTOGENIC

Example output format:
{
  "paris": {
    "city": "Paris",
    "country": "France",
    "terms": ["Paris Eiffel Tower sunset", "Paris Louvre pyramid", "Montmartre Sacre Coeur", "Seine River bridges Paris", "Parisian cafe terrace", "Champs Elysees Arc de Triomphe"]
  }
}

Destinations:
${destList}

Return ONLY valid JSON, no markdown or explanation.`
      }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

  // Parse JSON, handling potential markdown wrapper
  let jsonStr = text.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
  }

  return JSON.parse(jsonStr);
}

async function main() {
  console.log('\n🔍 GENERATING PHOTO SEARCH TERMS\n');

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ Missing OPENROUTER_API_KEY in .env.local');
    process.exit(1);
  }

  console.log(`Total destinations: ${DESTINATIONS.length}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Estimated API calls: ${Math.ceil(DESTINATIONS.length / BATCH_SIZE)}\n`);

  // Load existing progress if any
  let allTerms: SearchTerms = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      allTerms = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
      console.log(`Loaded ${Object.keys(allTerms).length} existing terms\n`);
    } catch (e) {
      console.log('Starting fresh...\n');
    }
  }

  // Filter out already processed destinations
  const remaining = DESTINATIONS.filter(d => !allTerms[d.id]);
  console.log(`Remaining to process: ${remaining.length}\n`);

  if (remaining.length === 0) {
    console.log('✅ All destinations already have search terms!\n');
    return;
  }

  // Process in batches
  const batches = [];
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    batches.push(remaining.slice(i, i + BATCH_SIZE));
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} destinations)...`);

    try {
      const terms = await generateTermsForBatch(batch);

      // Merge into allTerms
      Object.assign(allTerms, terms);

      // Save progress after each batch
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allTerms, null, 2));

      const processed = Object.keys(terms).slice(0, 3).join(', ');
      console.log(`   ✅ Generated: ${processed}... (+${Object.keys(terms).length - 3} more)`);
      console.log(`   📁 Progress: ${Object.keys(allTerms).length}/${DESTINATIONS.length}\n`);

      // Delay between batches to avoid rate limits
      if (i < batches.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      console.log('   Saving progress and stopping...\n');
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allTerms, null, 2));
      process.exit(1);
    }
  }

  console.log('='.repeat(50));
  console.log(`✅ Complete! Generated terms for ${Object.keys(allTerms).length} destinations`);
  console.log(`📁 Output: ${OUTPUT_FILE}`);
  console.log('='.repeat(50) + '\n');
}

main().catch(console.error);
