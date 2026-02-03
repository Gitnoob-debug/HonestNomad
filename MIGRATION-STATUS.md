# HonestNomad Migration Status Log

**Last Updated:** 2026-02-02
**Session:** Hotel Booking API Research Complete

---

## CURRENT STATUS SUMMARY

| Migration | Status | Progress |
|-----------|--------|----------|
| POI Data (Google Places) | ✅ COMPLETE | 65,626 unique POIs |
| POI Images → Supabase | ✅ 86% DONE | 56,490 / 65,626 POIs have images |
| Pexels Destination Images | ✅ COMPLETE | 494/494 (29,250 images) |
| Pexels → Supabase Storage | ✅ COMPLETE | 29,209 images uploaded |

---

## 1. POI Images → Supabase Storage
**Status: 86% COMPLETE (remaining are expired Google refs)**

Downloaded Google Places photos and uploaded to Supabase for permanent storage.

| Metric | Count |
|--------|-------|
| Unique POIs | 65,626 |
| POIs with Google imageUrl | 64,651 |
| POIs with Supabase imageUrl | 56,490 |
| **Coverage** | **86.1%** |
| Missing Supabase (has Google, no Supabase) | 8,161 |
| No images at all | 975 |
| Confirmed failed downloads | 3,080 |
| All cities processed | 494/494 |

**Note:** The 8,161 missing are mostly **expired Google photo references** (403/404 errors). These cannot be recovered - Google Places photo URLs expire over time.

**Fixed Issues (2026-01-29):**
- ✅ Fixed path sanitization for special characters (e.g., "malmö" → "malmo")
- ✅ Propagated supabaseImageUrl to all duplicate POI entries (17,855 instances updated)
- ✅ Increased delay to 1 second to avoid rate limits

**Key Files:**
- Script: `scripts/poi-image-migration/migrate-poi-images.ts`
- Progress: `scripts/poi-image-migration/progress.json`
- Supabase bucket: `poi-images`
- Audit script: `scripts/audit-pois.ts`

**Run Audit:**
```bash
cd /c/HonestNomad && npx tsx scripts/audit-pois.ts
```

---

## 2. POI Data Migration (Google Places API)
**Status: ✅ COMPLETE**

Migrated POIs for all 500 destinations using Google Places API (New).

| Metric | Count |
|--------|-------|
| Total POI entries | 85,415 |
| Unique POIs | 65,626 |
| Duplicate entries (same POI in multiple paths) | 19,789 |
| Same-path duplicates (bad) | 0 |

**Key Files:**
- POI data: `data/pois/*.json`
- Migration script: `scripts/poi-migration/migrate-pois-google.ts`

---

## 3. Pexels Destination Images
**Status: ✅ COMPLETE**

Downloaded hero/banner images for all destinations from Pexels API.

| Metric | Value |
|--------|-------|
| Progress | 494/494 batches (100%) |
| Images downloaded | 29,250 |
| API calls used | 9,872 |
| Destinations | 494 |
| Completed | 2026-02-01 |

**Background Task ID:** `b151616`

**Check Progress:**
```bash
# Quick status
cd /c/HonestNomad && node -e "const p = require('./scripts/image-migration/pexels-progress.json'); console.log('Progress:', p.currentBatch + '/' + p.totalBatches, '(' + ((p.currentBatch/p.totalBatches)*100).toFixed(1) + '%)'); console.log('Images:', p.stats.totalImagesDownloaded);"

# Live output
tail -30 "C:/Users/scarl/AppData/Local/Temp/claude/C--HonestNomad/tasks/b151616.output"
```

**Resume if stopped:**
```bash
cd /c/HonestNomad
npx tsx scripts/image-migration/pexels-migrate.ts --continuous
```

**Key Files:**
- Script: `scripts/image-migration/pexels-migrate.ts`
- Config: `scripts/image-migration/pexels-config.ts`
- Progress: `scripts/image-migration/pexels-progress.json`
- Downloaded images: `scripts/image-migration/pexels-images/`

---

## ENVIRONMENT & CREDENTIALS

### Google Places API
- **Key:** REVOKED - Do not store API keys in repo
- **Quotas set:** 4000/day for SearchNearby and SearchText
- **Budget:** $200 (set alerts in Google Cloud Console)
- **Photo API:** Separate rate limit (not configurable) - caused 11k failures in first run

### Supabase
- Credentials in `.env.local`
- Storage bucket: `poi-images` (public)

### Pexels
- API key in `.env.local`
- Rate limit: 200 requests/hour
- Batch cooldown: 6.75 minutes

---

## IF RESUMING IN NEW CONTEXT

### Quick Status Check
```bash
# Check Pexels migration progress
tail -30 "C:/Users/scarl/AppData/Local/Temp/claude/C--HonestNomad/tasks/b986def.output"

# OR check progress JSON
cd /c/HonestNomad && node -e "const p = require('./scripts/image-migration/pexels-progress.json'); console.log('Progress:', p.currentBatch + '/' + p.totalBatches); console.log('Images:', p.stats.totalImagesDownloaded);"

# Full POI audit
cd /c/HonestNomad && npx tsx scripts/audit-pois-full.ts

# Check Supabase image stats
cd /c/HonestNomad && node -e "const p = require('./scripts/poi-image-migration/progress.json'); console.log('Images uploaded:', p.stats.successfulUploads); console.log('Failed:', p.stats.failedUploads);"
```

### If Pexels migration stopped, restart:
```bash
cd /c/HonestNomad
npx tsx scripts/image-migration/pexels-migrate.ts --continuous
```

### If retrying failed POI images (after 24h rate limit reset):
```bash
cd /c/HonestNomad
GOOGLE_PLACES_API_KEY="your-key-here" npx tsx scripts/poi-image-migration/migrate-poi-images.ts
```

All scripts track progress in JSON files and will resume from where they left off.

---

## DATA QUALITY NOTES

1. **POI Duplicates:** Cross-path duplicates are expected (Louvre in "classic" AND "cultural"). Same-path duplicates = 0.

2. **Under-target cities:** Some cities like Milan, Mykonos, Crete are slightly under target because Google Places didn't have enough results. This is acceptable.

3. **Image URLs:** POIs have both:
   - `imageUrl`: Google Places URL (temporary, rate-limited)
   - `supabaseImageUrl`: Permanent Supabase URL (after migration completes)

4. **Incremental uploads:** The POI image script checks each POI for existing `supabaseImageUrl` before downloading - no duplicate uploads or wasted API calls.

---

## REMAINING WORK

### Migrations (ALL COMPLETE)
1. ✅ POI data migration - DONE (65,626 unique POIs)
2. ✅ POI images to Supabase - 86% DONE (56,490 images, remaining are expired Google refs)
3. ✅ Pexels destination images - COMPLETE (29,250 images for 494 destinations)
4. ✅ Upload Pexels images to Supabase - COMPLETE (29,209 images)
5. ✅ Update frontend to use Supabase image URLs - COMPLETE

### Hotel Booking MVP (CURRENT PRIORITY)
6. ⏳ Contact LiteAPI - answer open questions (prebook expiration, emails, support)
7. ⏳ Create hotel checkout UI with LiteAPI payment SDK
8. ⏳ Create `/api/hotels/prebook` endpoint
9. ⏳ Create `/api/hotels/book` endpoint
10. ⏳ Create Supabase `bookings` table (reference IDs only)
11. ⏳ Build booking confirmation email
12. ⏳ Test end-to-end in sandbox

### Post-MVP
13. ⏳ "My Bookings" page
14. ⏳ Cancellation/refund flow
15. ⏳ Terms of service and support pages

---

## COST SUMMARY

| Service | Usage | Cost |
|---------|-------|------|
| Google Places API | ~3,500 calls | ~$110 |
| Google Photos API | ~60,000 downloads | Included in Places API |
| Supabase Storage | ~60,000 images | Included in plan |
| Pexels API | Free | $0 |

**Total estimated:** ~$110-120 (well under $200 budget)

---

## SESSION NOTES: Checkout Architecture (2026-01-27)

### Research Completed

Researched API requirements for final checkout:

**Duffel (Flights) - Required Fields:**
- First name, last name, email, phone (E.164 format)
- Date of birth, gender, title (mr/ms/mrs/miss/dr)
- Passport info (if international): number, country, expiry
- Optional: frequent flyer numbers, baggage add-ons, seat selection

**LiteAPI (Hotels) - Required Fields:**
- Holder: first name, last name, email
- Guests: first name, last name, email, occupancy number
- Optional: special requests/remarks
- Payment: card details or transaction ID from their SDK

### Security Decision: Passthrough Architecture

**Key insight:** As a bootstrapped startup, we should NOT store sensitive PII.

**What the big players do:**
- Airlines/OTAs store everything (passports, cards, DOB)
- But they have $20-50M/year security budgets, SOC 2, PCI DSS Level 1
- Average breach cost: $150-200 per record

**Our approach (passthrough):**
```
User Form → Your API → Duffel/LiteAPI → Response
              ↓
    (Data passes through memory only,
     NEVER written to DB or logs)
```

**Store in Supabase:**
- Booking reference IDs (duffel_order_id, liteapi_booking_id)
- Stripe payment ID
- Traveler names (for display only)
- Trip dates, destination, total amount
- Status

**DO NOT Store:**
- Credit card numbers (use Stripe Elements - tokenized)
- Passport numbers
- Full dates of birth
- CVV/CVC
- Identity document details

**Rationale:** "You can't leak what you don't have." If breached, attackers find only booking IDs and trip preferences - embarrassing but survivable. No identity theft liability.

### Checkout Implementation Plan

1. **Stripe Elements** for payment (card data never touches our server)
2. **Guest details form** collects all required fields
3. **API endpoint** passes data through to Duffel + LiteAPI
4. **Save only references** to Supabase after successful booking
5. **"My Bookings" page** fetches details from Duffel/LiteAPI on-demand

### Next Steps for Checkout

1. Create checkout form UI with Stripe Elements integration
2. Create `/api/bookings/create` endpoint (passthrough logic)
3. Create Supabase `bookings` table (minimal schema)
4. Test in sandbox (Duffel test mode + LiteAPI ACC_CREDIT_CARD)

---

## SESSION NOTES: Chargeback & Refund Research (2026-01-28)

### Merchant of Record & Liability

| Aspect | Duffel (Flights) | LiteAPI (Hotels) |
|--------|------------------|------------------|
| **Merchant of Record** | Airline (card shows airline name) | Depends on payment method |
| **Chargeback Liability** | **HonestNomad** (unless Managed Content) | **HonestNomad** if using own payment |
| **Refund Control** | Airlines control, Duffel passes through | Hotels control, LiteAPI passes through |

### Key Finding: We Bear the Risk

**Duffel Terms:**
> "As the owner of the relationship with the Traveller you are contractually liable for any chargebacks or fraud that may occur."

**Exception:** Duffel "Managed Content" tier - they handle chargebacks but requires different service level.

### Three Payment Architecture Options

**Option 1: Accept Risk (Full Control)**
- You collect via Stripe, book via Duffel/LiteAPI accounts
- Pros: Unified checkout, full margins
- Cons: You handle all chargebacks, need fraud prevention

**Option 2: Let Suppliers Handle (Zero Risk)**
- Customer pays airline/hotel directly
- Pros: Zero chargeback risk
- Cons: Split checkout, commission-only revenue

**Option 3: Hybrid (Recommended for Launch)**
- Flights: Use Duffel's card form (airline is MoR)
- Hotels: Use LiteAPI's User Payment SDK (LiteAPI is MoR)
- Pros: Reduced risk, still earn commission
- Cons: Two payment flows, different merchant names on statements

### Recommended Approach for Bootstrapped Launch

**Start with Option 3 (Hybrid):**
1. Flights via Duffel card payment (airline handles chargebacks)
2. Hotels via LiteAPI SDK (LiteAPI handles chargebacks)
3. Earn commission, avoid chargeback liability
4. Later move to Option 1 when revenue supports chargeback reserves

### Chargeback Protection (If Option 1 Later)

1. Stripe Radar - fraud detection ($0.05/tx)
2. 3D Secure - shifts liability to card issuer
3. Clear cancellation policies with checkbox
4. Booking confirmation emails (paper trail)
5. Reserve fund (2-5% of revenue)

### Refund Reality

- Refundable bookings: Supplier processes (takes days-weeks)
- Non-refundable: Customer out of luck or you eat cost
- Chargebacks: Hit YOU, not airline/hotel
- Airline bankruptcy: You're liable if customer paid you

---

## CURRENT STATUS (2026-02-02)

### Project Phase: Hotel Booking MVP

All migrations complete. Now building hotel booking checkout flow.

### Active Background Tasks

None.

### Google API Scripts (DISABLED - DO NOT RUN)

| Script | Status | Reason |
|--------|--------|--------|
| `migrate-poi-images.ts` | 🔒 DISABLED | Caused $900 bill (111k API calls) |
| `migrate-pois-google.ts` | 🔒 DISABLED | Prevent accidental billing |

**WARNING:** Do not re-enable these scripts without explicit approval. They caused unexpected Google Cloud charges.

### Booking API Status

| API | Status | Notes |
|-----|--------|-------|
| LiteAPI (Hotels) | ✅ Integrated | Using SDK payment mode (zero chargeback risk) |
| Duffel (Flights) | ❌ Dropped | Too risky for bootstrapped launch |

### Quick Commands
```bash
# Full POI audit
cd /c/HonestNomad && npx tsx scripts/audit-pois.ts

# Check destination images
cd /c/HonestNomad && node -e "const p = require('./scripts/image-migration/pexels-progress.json'); console.log('Images:', p.stats.totalImagesDownloaded);"
```

---

## TO-DO LIST

### Completed
- [x] Fix Malmö path sanitization issue (special characters)
- [x] Propagate supabaseImageUrls to all POI duplicates
- [x] Run comprehensive POI audit
- [x] Pexels migration - 494/494 destinations, 29,250 images
- [x] Upload Pexels images to Supabase - 29,209 images
- [x] Update frontend to use Supabase image URLs
- [x] Disable Google API scripts to prevent billing
- [x] Research hotel booking APIs (LiteAPI vs RateHawk vs Amadeus)
- [x] Document LiteAPI payment modes and tradeoffs
- [x] Decision: Use LiteAPI SDK mode (zero chargeback risk)
- [x] Decision: Drop flights, focus on hotels only

### Immediate Priority
- [ ] **Contact LiteAPI** - Get answers to 6 open questions (see SESSION NOTES above)
- [ ] Appeal Google Cloud $900 bill (optional)

### Short Term (Hotel Booking MVP)
- [ ] Create hotel checkout UI with guest details form
- [ ] Integrate LiteAPI payment SDK/iframe
- [ ] Create `/api/hotels/prebook` endpoint
- [ ] Create `/api/hotels/book` endpoint (post-payment confirmation)
- [ ] Create Supabase `bookings` table (reference IDs only, no PII)
- [ ] Build booking confirmation email template
- [ ] Test end-to-end in sandbox mode

### Medium Term
- [ ] "My Bookings" page (fetch details from LiteAPI on-demand)
- [ ] Cancellation/refund request flow
- [ ] Support contact page and policy
- [ ] Terms of service page

---

## KNOWN ISSUES

### 1. Missing POI Images (8,161 POIs)
**Impact:** 14% of POIs don't have Supabase images
**Cause:** Expired Google Places photo references (403/404 errors)
**Resolution:** These cannot be recovered. Consider:
- Using fallback destination images
- Fetching new Google Place photos (costs API calls)
- Leaving as-is (frontend should handle missing gracefully)

### 2. Cities with Most Missing Images
Top 10 cities with missing Supabase images:
1. Istanbul: 219 POIs
2. Barcelona: 173 POIs
3. Berlin: 167 POIs
4. London: 165 POIs
5. Vienna: 163 POIs
6. Madrid: 160 POIs
7. Paris: 159 POIs
8. Rome: 158 POIs
9. Milan: 139 POIs
10. Rishikesh: 132 POIs

---

## SESSION NOTES: Hotel Booking API Research (2026-02-02)

### Decision: Drop Flights, Focus on Hotels

**Rationale:** Flights have significantly higher chargeback risk:
- Delays, cancellations, missed connections
- "I didn't take the flight" disputes
- Schedule changes by airlines
- Rebooking nightmares

Hotels are simpler: guest showed up or didn't, room was as described or wasn't.

---

### Hotel API Comparison

| Factor | LiteAPI | RateHawk | Amadeus |
|--------|---------|----------|---------|
| **Properties** | 2M+ | 2.6M | ~150k (weaker) |
| **Pricing Model** | Pay-per-use, markup on net | B2B net rates + your markup | Per-API-call fees |
| **Payment Handling** | They can be MoR (their SDK) | You handle payment | You handle payment |
| **Chargeback Risk** | **Zero if using their SDK** | On you | On you |
| **Free Tier** | No (pay per booking) | Sandbox only | 900 calls/month |
| **API Quality** | Modern REST, good docs | REST, decent docs | Excellent docs |
| **Best For** | Startups wanting zero risk | Agencies wanting best margins | Devs wanting free tier |

**Decision:** Stick with LiteAPI using their Payment SDK for zero chargeback liability.

---

### LiteAPI: Two Payment Modes

#### Mode 1: You Handle Payment (Credit Card Mode)
```
Customer → Your Checkout (Stripe) → Your Server → LiteAPI → Hotel
```
- You are Merchant of Record
- Customer sees "HonestNomad" on statement
- **You handle all chargebacks**
- Higher margins (15-25% markup)
- Requires PCI compliance or prepaid wallet

#### Mode 2: LiteAPI Handles Payment (SDK Mode) ✅ RECOMMENDED
```
Customer → Your Site → LiteAPI Payment Page → LiteAPI → Hotel
```
- LiteAPI is Merchant of Record
- Customer sees "LiteAPI" on statement
- **Zero chargeback liability**
- Lower margins (~8-12% commission)
- No PCI compliance needed

**Revenue Comparison ($600 booking):**

| Mode | Net Cost | You Charge | Your Profit | Risk |
|------|----------|------------|-------------|------|
| Mode 1 (your payment) | $510 | $600 | $90 (15%) | You handle chargebacks |
| Mode 2 (their SDK) | N/A | $600 | ~$60 (10% commission) | Zero risk |

**Recommendation:** Start with Mode 2 for launch. Switch to Mode 1 when you have volume and chargeback reserves.

---

### LiteAPI SDK Payment Flow

```
1. Call `prebook` with `usePaymentSdk: true` → get `prebookId`, `secretKey`, `transactionId`
2. Load LiteAPI payment script/iframe on frontend
3. Customer enters card on THEIR page (not yours)
4. LiteAPI charges card, books hotel
5. Redirect to your returnURL
6. You store booking reference, show confirmation
7. Commission paid out weekly (Mondays)
```

**Test Card:** `4242424242424242` with any CVV and future expiry

---

### LiteAPI Documentation Findings

| Topic | What Docs Say | Status |
|-------|---------------|--------|
| **White-label emails** | "It is usually best to email them a copy" - implies YOU send them | ⚠️ You must build this |
| **Prebook expiration** | NOT DOCUMENTED | ❓ Must ask them |
| **Support (white-label)** | "24/7 customer support for White Label bookings" | ✅ They handle |
| **Support (API direct)** | Not clearly documented | ❓ Must ask them |
| **Minimum volume** | "Not specified" in Terms | ✅ No minimums |
| **Payout schedule** | Weekly on Mondays, after check-out | ✅ Documented |

---

### LiteAPI Terms of Service Summary

| Aspect | What They Say |
|--------|---------------|
| **Exclusivity** | None - "non-exclusive license" |
| **Minimum volume** | None specified |
| **Termination** | They can suspend "with or without notice" |
| **Contract term** | Ongoing, no fixed period |
| **Modifications** | "Continued use = acceptance of modifications" |
| **Liability** | They disclaim indirect/consequential damages |
| **Your obligation** | Indemnify them against claims from your misuse |
| **Restrictions** | Can't resell data or use for competitive analysis |

---

### ⚠️ OPEN QUESTIONS - MUST ASK LITEAPI

| # | Question | Why It Matters |
|---|----------|----------------|
| 1 | **How long does a prebookId stay valid?** | Need to set checkout timeout in UI |
| 2 | **Who sends booking confirmation emails in API mode?** | Branding + customer expectations |
| 3 | **Can confirmation emails be white-labeled with our brand?** | Professional appearance |
| 4 | **What's the support process for API-direct bookings (not white-label)?** | Who does guest call when hotel is bad? |
| 5 | **What's the exact commission % for SDK payment mode?** | Calculate actual revenue |
| 6 | **What's the payment hold behavior if booking fails mid-process?** | Avoid angry customers with held funds |

**Contact:** LiteAPI support via dashboard or Discord

---

### Other Important Considerations

#### Price Changes Between Search → Book
Rate can change between search and prebook. The `prebook` step locks price temporarily (duration unknown - see question #1). UI must handle price jumps gracefully.

#### Cancellation & Refund Flow (Mode 2)
- Customer contacts LiteAPI for refunds
- Non-refundable: LiteAPI handles disputes
- Refundable: LiteAPI processes, timeline 7-30 days typical

#### Hotel Oversells / No Room Available
- Even confirmed bookings can fail at check-in
- In Mode 2, LiteAPI should handle, but customer may contact you first
- Need support email and policy page

#### Tax Handling
- Mode 2: LiteAPI handles tax collection/remittance
- Mode 1: You may owe sales tax/VAT (complicated for EU)

---

### Alternative APIs Evaluated

| API | Access | Best For | Why Not Primary |
|-----|--------|----------|-----------------|
| **RateHawk** | Free signup, sandbox | Best margins (20%+) | You handle chargebacks |
| **Amadeus** | Public, 900 free calls/mo | Free tier testing | Weak hotel inventory (150k) |
| **Hotelbeds** | Developer signup | Large inventory | Enterprise-focused |
| **Booking.com** | Affiliate approval | Huge inventory | Commission-only, less control |

---

### LiteAPI Key Files in Codebase

| File | Purpose |
|------|---------|
| `lib/liteapi/client.ts` | API client with searchHotelsByLocation, getHotelRates, etc. |
| `lib/supabase/images.ts` | Image URL utilities (includes POI image resolver) |
| `.env.local` | Contains LITEAPI_API_KEY |

---

### Next Steps for Hotel Booking

1. ⏳ **Contact LiteAPI** - Get answers to open questions above
2. ⏳ **Create checkout UI** - Guest details form + LiteAPI payment iframe
3. ⏳ **Implement prebook endpoint** - `/api/hotels/prebook`
4. ⏳ **Implement book confirmation** - `/api/hotels/book` (after payment)
5. ⏳ **Create bookings table** - Minimal schema (reference IDs only)
6. ⏳ **Build confirmation email** - Send from your domain
7. ⏳ **Test in sandbox** - End-to-end with test card

---

## IF RESUMING IN NEW CONTEXT

### 1. Check Background Tasks
```bash
# See if Pexels is still running
tail -20 "C:/Users/scarl/AppData/Local/Temp/claude/C--HonestNomad/tasks/b151616.output"
```

### 2. If Pexels Stopped, Restart
```bash
cd /c/HonestNomad
npx tsx scripts/image-migration/pexels-migrate.ts --continuous
```

### 3. Full Status Check
```bash
cd /c/HonestNomad && npx tsx scripts/audit-pois.ts
```

### 4. Key Files to Review
- `MIGRATION-STATUS.md` - This file
- `scripts/image-migration/pexels-progress.json` - Pexels progress
- `scripts/poi-image-migration/progress.json` - POI image progress
- `data/pois/*.json` - All POI data
