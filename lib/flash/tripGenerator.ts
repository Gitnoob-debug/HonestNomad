// Flash Trip Generator - Batch generates diverse trip packages
import { v4 as uuidv4 } from 'uuid';
import type {
  FlashVacationPreferences,
  FlashGenerateParams,
  FlashTripPackage,
  Destination,
} from '@/types/flash';
import { selectDestinations, calculateDiversityScore } from './diversityEngine';
import { getDestinationImages, getPrimaryDestinationImage } from './destinationImages';
import { getTransferInfo } from './hubAirports';
import { generateTagline } from './taglines';
import { generateCityPitch } from './cityPitches';
import { getPOICount } from './poi-loader';
import type { RevealedPreferences } from './preferenceEngine';

/** Add WebP auto-format to Unsplash fallback URLs for faster loading */
function optimizeUnsplashUrl(url: string): string {
  if (url.includes('unsplash.com') && !url.includes('auto=format')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}q=80&auto=format`;
  }
  return url;
}

export interface GenerationProgress {
  stage: 'finding_destinations' | 'building_trips' | 'complete';
  progress: number; // 0-100
  message: string;
}

export type ProgressCallback = (progress: GenerationProgress) => void;

/**
 * Generate a batch of diverse trip packages based on user profile and request
 */
export async function generateTripBatch(
  params: FlashGenerateParams,
  profile: FlashVacationPreferences,
  revealedPreferences?: RevealedPreferences,
  onProgress?: ProgressCallback
): Promise<{
  trips: FlashTripPackage[];
  generationTime: number;
  diversityScore: number;
}> {
  const startTime = Date.now();
  const count = params.count || 8;

  // Report progress helper
  const report = (stage: GenerationProgress['stage'], progress: number, message: string) => {
    onProgress?.({ stage, progress, message });
  };

  report('finding_destinations', 0, 'Finding perfect destinations...');

  // Step 1: Select diverse destinations (with revealed preference learning)
  const destinations = selectDestinations({
    profile,
    departureDate: params.departureDate,
    returnDate: params.returnDate,
    vibes: params.vibe,
    region: params.region,
    count: count,
    originAirport: params.originAirport || profile.homeBase.airportCode,
    revealedPreferences, // Pass learned preferences for smarter selection
    excludeDestinations: params.excludeDestinations, // Exclude already shown cities
  });

  report('building_trips', 50, 'Building your trip packages...');

  // Step 2: Build trip packages for each destination
  const trips: FlashTripPackage[] = [];

  for (const dest of destinations) {
    const tripPackage = buildTripPackage(
      dest,
      params,
      profile
    );
    trips.push(tripPackage);
  }

  // Sort by match score
  trips.sort((a, b) => b.matchScore - a.matchScore);

  report('complete', 100, `Found ${trips.length} amazing trips!`);

  const generationTime = Date.now() - startTime;
  const diversityScore = calculateDiversityScore(
    trips.map(t => ({
      id: t.id,
      city: t.destination.city,
      country: t.destination.country,
      airportCode: t.destination.airportCode,
      region: t.destination.region as any,
      vibes: t.destination.vibes as any,
      bestMonths: [],
      averageCost: t.pricing.total,
      highlights: t.highlights,
      imageUrl: t.imageUrl,
      latitude: 0,
      longitude: 0,
    }))
  );

  return {
    trips,
    generationTime,
    diversityScore,
  };
}

/**
 * Build a trip package for a destination
 */
function buildTripPackage(
  destination: Destination,
  params: FlashGenerateParams,
  profile: FlashVacationPreferences
): FlashTripPackage {
  // Calculate nights
  const nights = Math.ceil(
    (new Date(params.returnDate).getTime() - new Date(params.departureDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate match score
  let matchScore = 0.5;
  const primaryInterests = profile.interests?.primary || [];
  const matchingVibes = destination.vibes.filter(v =>
    primaryInterests.some(i => {
      const vibeMap: Record<string, string[]> = {
        beaches: ['beach'],
        museums: ['culture', 'history'],
        nightlife: ['nightlife'],
        food_tours: ['food'],
        hiking: ['adventure', 'nature'],
      };
      return vibeMap[i]?.includes(v);
    })
  );
  matchScore += matchingVibes.length * 0.1;

  const month = new Date(params.departureDate).getMonth() + 1;
  const isPerfectTiming = destination.bestMonths.includes(month);
  if (isPerfectTiming) {
    matchScore += 0.2;
  }
  matchScore = Math.min(1.0, matchScore);

  // Get images and transfer info
  // Prefer Supabase Storage images (curated) over Unsplash URLs (often wrong)
  const destinationImages = getDestinationImages(destination.id);
  const primaryImage = getPrimaryDestinationImage(destination.id);
  const transferInfo = getTransferInfo(destination.id);

  // Card personality data
  const tagline = generateTagline(destination);
  const pitch = generateCityPitch(destination);
  const poiCount = getPOICount(destination.id);

  return {
    id: uuidv4(),
    destination: {
      city: destination.city,
      country: destination.country,
      airportCode: destination.airportCode,
      region: destination.region,
      vibes: destination.vibes,
      latitude: destination.latitude,
      longitude: destination.longitude,
      transferInfo,
    },
    itinerary: {
      days: nights,
      highlights: destination.highlights.slice(0, 4),
      activities: generateActivitySummary(destination, profile),
    },
    pricing: {
      hotel: 0,
      total: 0,
      currency: profile.budget.currency || 'USD',
      perPerson: 0,
    },
    highlights: destination.highlights.slice(0, 4),
    matchScore,
    imageUrl: primaryImage || optimizeUnsplashUrl(destination.imageUrl),
    images: destinationImages.length > 0 ? destinationImages : undefined,
    transferInfo,
    tagline,
    pitch,
    perfectTiming: isPerfectTiming || undefined,
    poiCount: poiCount > 0 ? poiCount : undefined,
  };
}

/**
 * Generate activity suggestions based on destination and profile
 */
function generateActivitySummary(
  destination: Destination,
  profile: FlashVacationPreferences
): string[] {
  const activities: string[] = [];

  // Add based on destination vibes
  if (destination.vibes.includes('beach')) {
    activities.push('Beach relaxation & water activities');
  }
  if (destination.vibes.includes('culture')) {
    activities.push('Cultural tours & museums');
  }
  if (destination.vibes.includes('food')) {
    activities.push('Local food experiences');
  }
  if (destination.vibes.includes('adventure')) {
    activities.push('Adventure activities');
  }
  if (destination.vibes.includes('history')) {
    activities.push('Historical site visits');
  }
  if (destination.vibes.includes('nightlife')) {
    activities.push('Nightlife & entertainment');
  }

  // Add based on profile interests
  const interests = profile.interests?.primary || [];
  if (interests.includes('photography')) {
    activities.push('Photo opportunities');
  }
  if (interests.includes('spa_wellness')) {
    activities.push('Spa & wellness');
  }

  return activities.slice(0, 5);
}
