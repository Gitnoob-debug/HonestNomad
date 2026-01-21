# HonestNomad - Development TODO

## Legend
- 🔴 **Blocker** - Can't launch without this
- 🟠 **Critical** - Major feature gap
- 🟡 **Important** - Should have for good UX
- 🟢 **Nice to Have** - Polish and delight
- ✅ **Done**
- 🔄 **In Progress**
- ⏸️ **Blocked**

---

## Phase 1: Get to Bookable (MVP)

### API & Infrastructure

- [ ] 🔴 **Duffel Stays API Approval**
  - Current: Using mock hotel data
  - Action: Follow up on Duffel developer access request
  - If rejected: Evaluate Booking.com Affiliate API as backup

- [ ] 🔴 **Stripe Integration**
  - [ ] Create Stripe account
  - [ ] Install @stripe/stripe-js and stripe packages
  - [ ] Create `/api/create-payment-intent` endpoint
  - [ ] Build PaymentForm component with Stripe Elements
  - [ ] Handle 3D Secure authentication
  - [ ] Test with Stripe test cards

- [ ] 🔴 **Booking API**
  - [ ] Create `/api/book` endpoint
  - [ ] Implement flight booking via Duffel
  - [ ] Implement hotel booking via Duffel
  - [ ] Handle partial failures (rollback logic)
  - [ ] Store booking in Supabase
  - [ ] Return booking confirmation

- [ ] 🟠 **Email Notifications**
  - [ ] Set up Resend or SendGrid account
  - [ ] Create email templates:
    - [ ] Booking confirmation
    - [ ] Itinerary PDF attachment
    - [ ] Flight reminder (1 day before)
  - [ ] Create `/api/send-email` utility

- [ ] 🟠 **Error Handling**
  - [ ] Add try-catch to all API routes
  - [ ] Create error boundary components
  - [ ] Set up Sentry for error tracking
  - [ ] User-friendly error messages
  - [ ] Retry logic for transient failures

### Booking Flow UI

- [ ] 🔴 **Create `/trip/[id]/book` page**
  - [ ] Trip summary sidebar
  - [ ] Guest details form (per traveler)
  - [ ] Payment form (Stripe Elements)
  - [ ] Terms acceptance checkbox
  - [ ] "Book Now" button with loading state

- [ ] 🔴 **Guest Details Form**
  - [ ] First name, last name
  - [ ] Email, phone
  - [ ] Date of birth (for flights)
  - [ ] Passport number (international)
  - [ ] Special requests field
  - [ ] Form validation

- [ ] 🟠 **Booking Confirmation Page**
  - [ ] `/trip/[id]/confirmation`
  - [ ] Booking reference numbers
  - [ ] Flight details with times
  - [ ] Hotel address and check-in info
  - [ ] Itinerary summary
  - [ ] "Add to Calendar" button
  - [ ] "Download PDF" button
  - [ ] "Share Trip" button

- [ ] 🟠 **Price Refresh Before Booking**
  - [ ] Check if prices are still valid
  - [ ] Show price change warning if needed
  - [ ] Allow user to accept new price
  - [ ] Re-run search if price significantly changed

---

## Phase 2: Intelligence & Personalization

### AI Improvements

- [ ] 🟠 **Dynamic Itinerary Generation**
  - [ ] Create `/lib/claude/itinerary-generator.ts`
  - [ ] Build rich prompt with:
    - Trip dates and duration
    - Hotel location
    - Flight arrival/departure times
    - User interests/preferences
    - Traveler type (solo, couple, family)
  - [ ] Generate real venue recommendations
  - [ ] Include opening hours, costs
  - [ ] Validate with Google Places API

- [ ] 🟡 **Origin Auto-Detection**
  - [ ] Add IP geolocation (ipapi.co)
  - [ ] Map to nearest airport codes
  - [ ] Show "Departing from [City]" in UI
  - [ ] Allow override in chat or settings

- [ ] 🟡 **Better Intent Parsing**
  - [ ] Handle date ranges ("sometime in March")
  - [ ] Parse budget constraints naturally
  - [ ] Understand multi-city requests
  - [ ] Handle group compositions ("me and 2 kids")

- [ ] 🟡 **Smart Defaults**
  - [ ] Default to 4-star hotels unless budget specified
  - [ ] Prefer direct flights for short trips
  - [ ] Morning departures, evening returns
  - [ ] Central hotel locations

### External Data

- [ ] 🟠 **Google Places Integration**
  - [ ] Set up Google Cloud project
  - [ ] Enable Places API
  - [ ] Create `/lib/google/places.ts`
  - [ ] Fetch restaurant, attraction details
  - [ ] Get photos, ratings, hours

- [ ] 🟡 **Real Destination Images**
  - [ ] Unsplash API integration
  - [ ] Cache images per destination
  - [ ] Fallback to static placeholders
  - [ ] Image optimization via Next.js

- [ ] 🟢 **Weather Integration**
  - [ ] WeatherAPI or OpenWeather
  - [ ] Show forecast on trip card
  - [ ] Packing suggestions

---

## Phase 3: User Experience Polish

### Mobile Optimization

- [ ] 🟠 **Responsive TripCard**
  - [ ] Stack layout on mobile
  - [ ] Collapsible itinerary section
  - [ ] Swipe to see alternatives
  - [ ] Touch-friendly buttons

- [ ] 🟠 **Mobile Chat Interface**
  - [ ] Full-screen keyboard handling
  - [ ] Sticky input at bottom
  - [ ] Quick action buttons
  - [ ] Voice input (speech-to-text)

- [ ] 🟡 **Mobile Landing Page**
  - [ ] Larger touch targets
  - [ ] Simplified example prompts
  - [ ] Thumb-zone optimized layout

### Loading & Feedback

- [ ] 🟡 **Search Progress Indicator**
  - [ ] "Searching 50+ airlines..."
  - [ ] "Finding hotels in Paris..."
  - [ ] "Creating your itinerary..."
  - [ ] Animated illustrations

- [ ] 🟡 **Skeleton Screens**
  - [ ] TripCard skeleton
  - [ ] Flight/hotel list skeletons
  - [ ] Chat message loading dots

- [ ] 🟢 **Micro-interactions**
  - [ ] Button hover/press states
  - [ ] Smooth transitions
  - [ ] Success confetti on booking

### Features

- [ ] 🟡 **Trip Sharing**
  - [ ] Generate shareable URL
  - [ ] OG meta tags for preview
  - [ ] "Invite to trip" for group travel

- [ ] 🟡 **Save Trip for Later**
  - [ ] Save to localStorage (no auth)
  - [ ] "My Saved Trips" page
  - [ ] Price change notifications

- [ ] 🟢 **PDF Itinerary Export**
  - [ ] Generate PDF with @react-pdf/renderer
  - [ ] Include all trip details
  - [ ] QR codes for flight check-in
  - [ ] Offline-friendly format

- [ ] 🟢 **Calendar Integration**
  - [ ] Generate .ics file
  - [ ] Google Calendar deep link
  - [ ] Apple Calendar support

---

## Phase 4: Trust & Business

### User Accounts

- [ ] 🟡 **Authentication**
  - [ ] Supabase Auth integration
  - [ ] Google OAuth
  - [ ] Email/password signup
  - [ ] Magic link option

- [ ] 🟡 **User Profile**
  - [ ] Home airport preference
  - [ ] Traveler details (save for booking)
  - [ ] Notification preferences

- [ ] 🟡 **Booking History**
  - [ ] `/bookings` page (already exists)
  - [ ] Connect to actual booking data
  - [ ] Upcoming vs past trips
  - [ ] Modify/cancel functionality

### Trust Signals

- [ ] 🟡 **Price Transparency**
  - [ ] Show price breakdown
  - [ ] No hidden fees messaging
  - [ ] "Price includes all taxes"

- [ ] 🟡 **Reviews & Ratings**
  - [ ] Display TripAdvisor/Google ratings
  - [ ] User testimonials
  - [ ] "Why we picked this" explanation

- [ ] 🟢 **Comparison Widget**
  - [ ] "See this trip on Expedia"
  - [ ] Prove competitive pricing
  - [ ] Build trust through transparency

### Operations

- [ ] 🟡 **Admin Dashboard**
  - [ ] View all bookings
  - [ ] Revenue tracking
  - [ ] Error monitoring
  - [ ] User analytics

- [ ] 🟡 **Customer Support**
  - [ ] Contact form
  - [ ] FAQ page
  - [ ] Intercom or similar chat widget

---

## Technical Debt & Cleanup

- [ ] 🟡 **Type Safety**
  - [ ] Strict TypeScript throughout
  - [ ] Zod schemas for API validation
  - [ ] Remove `any` types

- [ ] 🟡 **Testing**
  - [ ] Jest unit tests for utils
  - [ ] Playwright E2E tests
  - [ ] API route testing

- [ ] 🟡 **Performance**
  - [ ] Lighthouse audit (90+ score)
  - [ ] Code splitting
  - [ ] Image optimization
  - [ ] API response caching

- [ ] 🟢 **Code Quality**
  - [ ] ESLint rules
  - [ ] Prettier formatting
  - [ ] Pre-commit hooks (husky)
  - [ ] CI/CD pipeline

---

## This Week's Focus

### Monday-Tuesday
1. [ ] Apply for Duffel Stays production access (if not done)
2. [ ] Set up Stripe account and API keys
3. [ ] Create basic `/api/create-payment-intent`
4. [ ] Build PaymentForm component

### Wednesday-Thursday
5. [ ] Create `/trip/[id]/book` page
6. [ ] Build GuestDetailsForm component
7. [ ] Wire up booking flow end-to-end
8. [ ] Test with Stripe test cards

### Friday
9. [ ] Set up Resend for emails
10. [ ] Create booking confirmation email template
11. [ ] Add error handling and Sentry
12. [ ] Deploy and test on production

---

## Quick Wins (< 2 hours each)

- [ ] Add loading spinner while searching
- [ ] Improve empty state messaging
- [ ] Add "Back to search" button on trip page
- [ ] Fix any mobile layout issues
- [ ] Add favicon and OG image
- [ ] Improve meta tags for SEO
- [ ] Add analytics (Mixpanel/Plausible)

---

## Blocked Items

| Item | Blocker | Action Needed |
|------|---------|---------------|
| Hotel booking | Duffel Stays approval | Follow up with Duffel |
| Payment testing | Stripe account | Create and verify account |
| Real itineraries | Google Places API | Set up GCP project |

---

*Last Updated: January 2026*
