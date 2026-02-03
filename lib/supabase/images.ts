/**
 * Supabase Image URL Utilities
 * Generates URLs for images stored in Supabase Storage
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvhnrtssvdjiefsgilxg.supabase.co';

// Bucket names
const DESTINATION_IMAGES_BUCKET = 'destination-images';
const POI_IMAGES_BUCKET = 'poi-images';

/**
 * Get the public URL for a destination image in Supabase Storage
 */
export function getDestinationImageUrl(destinationId: string, imageNumber: number): string {
  const paddedNumber = String(imageNumber).padStart(3, '0');
  return `${SUPABASE_URL}/storage/v1/object/public/${DESTINATION_IMAGES_BUCKET}/${destinationId}/${destinationId}-${paddedNumber}.jpg`;
}

/**
 * Get an array of destination image URLs (typically 60 images per destination)
 */
export function getDestinationImages(destinationId: string, count: number = 10): string[] {
  return Array.from({ length: count }, (_, i) => getDestinationImageUrl(destinationId, i + 1));
}

/**
 * Get the public URL for a POI image in Supabase Storage
 */
export function getPOIImageUrl(cityId: string, poiId: string): string {
  // Sanitize city name (same logic used during upload)
  const safeCityName = cityId
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .toLowerCase();

  return `${SUPABASE_URL}/storage/v1/object/public/${POI_IMAGES_BUCKET}/${safeCityName}/${poiId}.jpg`;
}

/**
 * Resolve the best available image URL for a POI
 * Prefers Supabase URL, falls back to original imageUrl
 */
export function resolvePOIImageUrl(poi: {
  supabaseImageUrl?: string;
  imageUrl?: string;
}): string | undefined {
  return poi.supabaseImageUrl || poi.imageUrl;
}

/**
 * Resolve the best available image URL for a destination
 * Uses Supabase storage URLs
 */
export function resolveDestinationImageUrl(
  destinationId: string,
  fallbackUrl?: string
): string {
  // Use first Supabase image, or fallback
  return getDestinationImageUrl(destinationId, 1) || fallbackUrl || '';
}
