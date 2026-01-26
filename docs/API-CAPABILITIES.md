# API Capabilities & Product Ideas

*Last updated: 2026-01-26*

This document catalogs all available features from our travel APIs (Duffel for flights, LiteAPI for hotels) and identifies product opportunities.

---

## DUFFEL API - Complete Capabilities

### Core Flight Data (Currently Using)
| Feature | Data Available | We Use? |
|---------|---------------|---------|
| Offer search | Origin, destination, dates, passengers, cabin class | ✅ Yes |
| Pricing | Total, base, tax amounts + currency | ✅ Yes |
| Slices/Segments | Departure/arrival times, duration, stops | ✅ Yes |
| Airlines | Name, IATA code, logo URLs | ✅ Yes |
| Aircraft | Aircraft type/model | ✅ Yes |
| Terminals | Departure/arrival terminals | ✅ Yes |
| Baggage | Carry-on, checked bags, weight limits | ✅ Yes |
| Restrictions | Changeable, refundable, penalty amounts | ✅ Yes |
| CO2 Emissions | `total_emissions_kg` per flight | ✅ Yes |
| Offer expiry | `expires_at` timestamp | ✅ Yes |

### Flight Features We DON'T Use Yet
| Feature | What It Provides | Product Opportunity |
|---------|-----------------|---------------------|
| **Seat Maps** | Cabin layout, seat pricing, availability, wing position | Interactive seat selection |
| **Seat Selection** | Book specific seats with pricing | Upsell premium seats |
| **Extra Baggage** | Buy additional checked bags | Baggage add-on flow |
| **Fare Brand Names** | "Basic Economy", "Main Cabin", etc. | Clearer fare comparisons |
| **Loyalty Programs** | `supported_loyalty_programmes` per airline | "Add your FF number" |
| **Cabin Amenities** | WiFi cost (free/paid), power type, seat pitch | Rich flight comparisons |
| **Marketing vs Operating Carrier** | Codeshare details | Transparency on who operates |
| **Payment Requirements** | `instant_payment`, guarantee expiry | Flexible hold options |
| **Partial Offers** | Multi-step booking for complex itineraries | Advanced routing |
| **Batch Requests** | Search multiple routes in one call | Background price alerts |

### Post-Booking Features (For Phase 2)
| Feature | Capability |
|---------|-----------|
| **Order Changes** | Modify flights, dates, passengers |
| **Order Cancellations** | Cancel with refund handling |
| **Airline-Initiated Changes** | Handle schedule changes automatically |
| **Airline Credits** | Track and apply travel credits |
| **Webhooks** | Real-time booking status updates |

---

## LITEAPI - Complete Capabilities

### Hotel Data (Currently Using)
| Feature | Data Available | We Use? |
|---------|---------------|---------|
| Hotel search by location | Lat/lng + radius | ✅ Yes |
| Basic info | Name, stars, rating, review count | ✅ Yes |
| Photos | Main photo, gallery images | ✅ Yes |
| Amenities/Facilities | List of hotel facilities | ✅ Yes |
| Check-in/out times | Times for planning | ✅ Yes |
| Rates | Total price, per night, currency | ✅ Yes |
| Board types | Room only, breakfast, etc. | ✅ Yes |
| Cancellation | Refundable tag (RFN/NRFN/PRFN) | ✅ Yes |

### Hotel Features We DON'T Use Yet
| Feature | What It Provides | Product Opportunity |
|---------|-----------------|---------------------|
| **Hotel Reviews** | Individual reviews with pros/cons, scores, language | Show real guest feedback |
| **Room-Level Details** | Bed types, room size (sqft), max occupancy, views | Better room selection |
| **Room Amenities** | Per-room amenities (not just hotel-level) | "This room has a balcony" |
| **Room Photos** | Photos per room type | Visual room comparison |
| **Detailed Cancellation** | `cancelPolicyInfos` with dates/amounts | "Free cancel until Dec 15" |
| **Taxes Breakdown** | Individual tax line items | Transparent pricing |
| **Hotel Chains** | Chain affiliation | "Marriott property" badge |
| **Important Information** | `hotelImportantInformation` | Surface need-to-knows |
| **Semantic Search (Beta)** | Natural language hotel search | "Hotel with rooftop bar near beach" |
| **Image Search (Beta)** | Find rooms by visual attributes | "Rooms that look like this" |
| **Ask Hotel (Beta)** | AI Q&A about specific hotels | "Does this hotel have EV charging?" |

### Analytics & Loyalty (Untapped)
| Feature | What It Provides | Product Opportunity |
|---------|-----------------|---------------------|
| **Guest Loyalty** | Points accrual, redemption, history | HonestNomad rewards program |
| **Price Index** | City-level and hotel pricing trends | "Prices are 20% below average" |
| **Market Analytics** | Popular destinations, booking trends | "Trending destinations" feature |
| **Most Booked Hotels** | Top-performing properties | "Popular with travelers" badge |
| **Vouchers** | Create/manage discount codes | Promotional campaigns |
| **Weather Data** | Forecasts by lat/lng (7-14 days) | "Weather during your trip" |

---

## Product Ideas by Implementation Effort

### Tier 1: Low Effort, High Impact (1-2 days each)

1. **Climate/Weather on Trip Cards**
   - For near-term: LiteAPI `GET /data/weather`
   - For future trips: Historical climate averages
   - Show "Typically 24°C, Sunny in April"

2. **Real Hotel Reviews**
   - LiteAPI: `GET /data/reviews`
   - Show top 3 reviews with pros/cons
   - Already have reviewCount, just need actual text

3. **CO2 Emissions Display**
   - Already have `totalEmissionsKg` in flight data
   - Show "This flight: 245kg CO2"
   - Compare to average, show eco-friendly options

4. **Fare Brand Names**
   - Already getting `fareBrandName` from Duffel
   - Display "Basic Economy" vs "Main Cabin Extra"
   - Helps users understand what they're buying

5. **Price Trend Indicator**
   - LiteAPI: `GET /price-index/city`
   - Show "Hotels are 15% cheaper than usual"

### Tier 2: Medium Effort (3-5 days each)

6. **Seat Selection Flow**
   - Duffel Seat Maps API
   - Show aircraft layout after flight selection
   - Revenue: Commission on seat upgrades

7. **Baggage Add-On**
   - Duffel baggage services
   - "Add a checked bag for $35"
   - Revenue: Commission on bag purchases

8. **Room Type Selector**
   - LiteAPI room details
   - Show room sizes, bed configurations, views
   - Photos per room type

9. **Flexible Cancellation Timeline**
   - Parse `cancelPolicyInfos` from LiteAPI
   - Visual timeline: "Free cancel until Dec 15"

10. **Loyalty Program Integration**
    - Duffel: Capture frequent flyer numbers
    - LiteAPI: HonestNomad points program

### Tier 3: Bigger Features (1-2 weeks)

11. **Price Alerts / Watch List**
    - Duffel batch requests for monitoring
    - "This route dropped $50!"

12. **AI Hotel Concierge**
    - LiteAPI "Ask Hotel" beta
    - "Does this hotel have late checkout?"

13. **Destination Intelligence**
    - LiteAPI analytics + price index
    - "Best time to visit Paris"

14. **Post-Booking Management**
    - Duffel order changes/cancellations
    - Self-service flight modifications

---

## Revenue Opportunities

| Add-On | Est. Revenue per Booking | API Source |
|--------|-------------------------|------------|
| Seat selection | $15-75 | Duffel |
| Extra baggage | $25-60 | Duffel |
| Travel insurance | $20-50 | Third party |
| Room upgrades | $30-100/night | LiteAPI |
| Loyalty points | Customer retention | LiteAPI |

---

## API Documentation Links

- [Duffel API](https://duffel.com/docs/api)
- [Duffel Ancillaries](https://duffel.com/flights/ancillaries)
- [Duffel Seat Maps](https://duffel.com/docs/api/seat-maps)
- [LiteAPI Documentation](https://docs.liteapi.travel)
- [LiteAPI Hotel Reviews](https://docs.liteapi.travel/docs/hotel-reviews)
- [LiteAPI Endpoints](https://docs.liteapi.travel/reference/api-endpoints-overview)

---

## Implementation Status

- [x] Weather/Climate on cards (2026-01-26) - Static monthly averages for all 500 destinations
- [x] CO2 emissions display (2026-01-26) - Shows kg CO₂ on flight cards
- [x] Fare brand names (2026-01-26) - Shows "Basic Economy", "Main Cabin", etc.
- [x] Hotel reviews (2026-01-26) - Real guest reviews via LiteAPI
- [ ] Seat selection
- [ ] Baggage add-ons
- [ ] Room type selector
- [ ] Price alerts
