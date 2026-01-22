# Image Migration Workflow

Downloads images from Unsplash for all 410 destinations with manual validation.

## Setup

1. Get an Unsplash API key at https://unsplash.com/developers (free)
2. Set environment variable: `export UNSPLASH_ACCESS_KEY=your_key`

## Workflow

### Step 1: Initialize Queue
```bash
npx tsx scripts/image-migration/migrate-images.ts --init
```
This creates an alternating queue: popular (30 imgs) + regular (20 imgs) = 50 requests per batch.

### Step 2: Run a Batch
```bash
UNSPLASH_ACCESS_KEY=xxx npx tsx scripts/image-migration/migrate-images.ts
```
Downloads 2 destinations (1 popular + 1 regular) using exactly 50 API calls.

### Step 3: Wait for Rate Limit
The script tells you when the next batch is available (~70 minutes).
Check status anytime:
```bash
npx tsx scripts/image-migration/migrate-images.ts --status
```

### Step 4: Review Images (Manual Validation)
```bash
npx tsx scripts/image-migration/generate-preview.ts
```
Then open `scripts/image-migration/preview.html` in your browser.

- Click individual images to approve/reject
- Use "Approve All" / "Reject All" for entire destinations
- Click "Export Decisions" when done

### Step 5: Apply Validation
Save the exported `validation-decisions.json` to `scripts/image-migration/`, then:
```bash
npx tsx scripts/image-migration/apply-validation.ts
```
This removes rejected images and updates the manifest.

### Step 6: Repeat
Go back to Step 2 until all destinations are done.

## Continuous Mode (Overnight)
```bash
UNSPLASH_ACCESS_KEY=xxx npx tsx scripts/image-migration/migrate-images.ts --continuous
```
Runs batches automatically with 70-minute waits. ~14 hours to complete all 410 destinations.

## Files

| File | Purpose |
|------|---------|
| `config.ts` | Settings, popular destinations list |
| `migrate-images.ts` | Main download script |
| `generate-preview.ts` | Creates HTML review page |
| `apply-validation.ts` | Applies approve/reject decisions |
| `progress.json` | Tracks queue and completion |
| `manifest.json` | Image metadata + credits |
| `downloaded-images/` | Downloaded images by destination |
| `preview.html` | Generated review page |

## Image Credits

Each image stores:
- `credit`: Display text ("Photo by Name on Unsplash")
- `photographerName`: For linking
- `photographerUrl`: Profile link
- `unsplashUrl`: Original image link

Use these in your UI to comply with Unsplash terms.

## Stats

- **410 destinations** total
- **~45 popular** (30 images each = 1,350 images)
- **~365 regular** (20 images each = 7,300 images)
- **~8,650 total images**
- **~205 batches** needed
- **~14 hours** if run continuously
