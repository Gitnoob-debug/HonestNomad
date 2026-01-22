# Image Migration Script

Batch downloads images from Unsplash for all 410 destinations, respecting rate limits.

## Setup

1. Get an Unsplash API key at https://unsplash.com/developers (free)
2. Set the environment variable:
   ```bash
   export UNSPLASH_ACCESS_KEY=your_key_here
   ```

## Usage

### Check current status
```bash
npx tsx scripts/image-migration/check-status.ts
```

### Run migration (50 destinations per session)
```bash
UNSPLASH_ACCESS_KEY=your_key npx tsx scripts/image-migration/migrate-images.ts
```

### Dry run (preview without making requests)
```bash
npx tsx scripts/image-migration/migrate-images.ts --dry-run
```

### Continuous mode (runs forever with automatic delays)
```bash
npx tsx scripts/image-migration/migrate-images.ts --continuous
```

### Reset progress and start fresh
```bash
npx tsx scripts/image-migration/migrate-images.ts --reset
```

## How it works

1. **Rate limit aware**: 50 requests/hour (Unsplash free tier)
2. **Resumable**: Progress saved to `progress.json` after each destination
3. **Prioritized**: Popular destinations processed first
4. **Smart search**: Combines city + country + vibe for better results

## Image counts

- **Popular destinations** (Paris, Tokyo, etc.): 30 images each
- **Regular destinations**: 20 images each

## Time estimate

- 410 destinations ÷ 50/hour = ~9 sessions
- At 1hr 15min each = ~11-12 hours total
- Can run 1 session per day or use `--continuous` to run overnight

## Files

- `config.ts` - Settings and popular destination list
- `migrate-images.ts` - Main migration script
- `check-status.ts` - View progress
- `progress.json` - Auto-generated progress tracker
