# Lessons Learned

A log of mistakes made during development so we don't repeat them.

---

## 1. API Key Leaked in Git Commit (2026-02-02)

**What happened:**
- Google Places API key was committed to the repository in `MIGRATION-STATUS.md`
- Key was also embedded in POI `imageUrl` fields (Google Photos URLs contain the key)
- GitHub detected the leak within minutes and sent a security alert
- Key was exposed in 164 locations across POI data files

**Root cause:**
- Documented the API key directly in a markdown file for "convenience"
- Didn't realize Google Photos URLs contain the API key as a query parameter

**Impact:**
- Had to revoke and rotate the API key
- Key remains in git history (requires history rewrite to fully remove)

**Lessons:**
1. **NEVER put API keys in any file that gets committed** - not even "documentation"
2. **Use `.env.local` or environment variables** for all secrets
3. **Add secrets to `.gitignore`** before they ever touch the repo
4. **Review `git diff` before committing** - look for keys, passwords, tokens
5. **Google Photos URLs contain API keys** - don't commit raw Google API responses
6. **If a key leaks, revoke immediately** - don't just remove from repo, the key is compromised

**Prevention checklist:**
- [ ] Is there an API key in this file? → Move to `.env.local`
- [ ] Does this URL contain a key parameter? → Strip it or don't commit
- [ ] Am I committing data from an API response? → Check for embedded credentials

---

## 2. Unexpected $900 Google Cloud Bill (2026-01-29)

**What happened:**
- Ran POI image migration script that made 111,232 Google Places Photo API calls
- Google Photos API costs $7 per 1,000 calls
- Total cost: ~$778 just for photos, plus search API costs

**Root cause:**
- Didn't check Google Cloud pricing before running bulk operations
- Assumed "free tier" or low cost without verifying
- No spending alerts configured
- Script had no cost estimation or confirmation prompt

**Impact:**
- $900 unexpected bill
- Had to disable scripts to prevent further charges

**Lessons:**
1. **Check API pricing BEFORE running bulk operations**
2. **Set up billing alerts** in Google Cloud Console (e.g., alert at $50, $100, $200)
3. **Set hard budget limits** where possible
4. **Add cost estimation to scripts** - "This will make ~100k calls at $7/1k = $700. Continue? y/n"
5. **Start with small batches** - test with 10 items before running 10,000
6. **Monitor usage during long-running jobs** - check Cloud Console mid-run

**Prevention checklist:**
- [ ] What does this API cost per call?
- [ ] How many calls will this script make?
- [ ] Total estimated cost = calls × price per call
- [ ] Is there a billing alert set?
- [ ] Did I test with a small batch first?

---

## 3. Template for Future Entries

**What happened:**
[Description of the mistake]

**Root cause:**
[Why it happened]

**Impact:**
[What damage was done]

**Lessons:**
[What we learned]

**Prevention checklist:**
[Steps to prevent recurrence]

---

## Quick Reference: Things to Never Do

| Don't | Do Instead |
|-------|------------|
| Commit API keys to git | Use `.env.local` + `.gitignore` |
| Run bulk API calls without cost check | Calculate cost first, set alerts |
| Store secrets in documentation | Reference "see .env.local" |
| Assume APIs are cheap/free | Check pricing page before coding |
| Commit raw API responses | Strip sensitive fields first |
| Push without reviewing diff | Run `git diff` and scan for secrets |
| Run scripts on production data first | Test on 10 items, then 100, then all |

---

## Environment Variables Checklist

These should ONLY exist in `.env.local` (never committed):

```
GOOGLE_PLACES_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LITEAPI_API_KEY=
PEXELS_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
```

If you see any of these in a `.ts`, `.js`, `.md`, or `.json` file, **STOP** and move it to `.env.local`.
