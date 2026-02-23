'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { LocationAnalysisResponse, AlternativeTile } from '@/types/location';
import { DestinationTile, DiscoverDetailModal, ConfidenceBadge } from '@/components/discover';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// ── Destination thumbnail with error fallback ────────────────────────

function DestinationThumb({
  src,
  city,
  size = 'md',
}: {
  src: string;
  city: string;
  size?: 'sm' | 'md';
}) {
  const [failed, setFailed] = useState(false);
  const dim = size === 'sm' ? 'w-14 h-14' : 'w-16 h-16';

  const optimizedSrc = src.includes('unsplash.com')
    ? src + (src.includes('?') ? '&' : '?') + 'q=80&auto=format&fit=crop&w=128&h=128'
    : src;

  if (failed || !src) {
    return (
      <div
        className={`${dim} rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0`}
      >
        <span className="text-xl">🌍</span>
      </div>
    );
  }

  return (
    <img
      src={optimizedSrc}
      alt={city}
      className={`${dim} rounded-lg object-cover flex-shrink-0`}
      onError={() => setFailed(true)}
    />
  );
}

// ── Client-side image compression ────────────────────────────────────

function compressImage(
  file: File,
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX_SIZE = 1024;
      let { width, height } = img;

      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType: 'image/jpeg' });
    };
    img.onerror = () => reject(new Error('Failed to load image'));

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ── Main page component ─────────────────────────────────────────────

export default function DiscoverPage() {
  const router = useRouter();

  // Input state
  const [urlInput, setUrlInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Analysis state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LocationAnalysisResponse | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedTile, setSelectedTile] = useState<AlternativeTile | null>(null);

  // Map
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Navigate to explore page with a destination tile ──────────────

  const selectDestination = useCallback((dest: AlternativeTile['destination']) => {
    sessionStorage.setItem('discover_destination', JSON.stringify(dest));
    router.push(`/flash/explore?destination=${encodeURIComponent(dest.id)}`);
  }, [router]);

  // ── Image upload handler ───────────────────────────────────────────

  const handleImageSelect = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('Please upload an image under 5MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    setImageFile(file);
    setUrlInput('');
    setResult(null);
    setConfirmed(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // ── Submit handler ─────────────────────────────────────────────────

  const handleAnalyze = useCallback(async () => {
    if (!urlInput && !imageFile) return;

    setLoading(true);
    setResult(null);
    setConfirmed(false);

    try {
      let body: Record<string, string> = {};

      if (urlInput) {
        body = { url: urlInput };
      } else if (imageFile) {
        const { base64, mimeType } = await compressImage(imageFile);
        body = { imageBase64: base64, imageMimeType: mimeType };
      }

      const response = await fetch('/api/location/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data: LocationAnalysisResponse = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Analysis failed:', error);
      setResult({
        success: false,
        location: null,
        matchedDestination: null,
        error: 'Network error. Please check your connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [urlInput, imageFile]);

  // ── Map initialization / update ────────────────────────────────────

  useEffect(() => {
    if (!result?.location || !mapContainerRef.current) return;

    const { lat, lng } = result.location;

    if (mapRef.current) {
      const container = mapRef.current.getContainer();
      if (!document.body.contains(container)) {
        mapRef.current.remove();
        mapRef.current = null;
      } else {
        mapRef.current.flyTo({ center: [lng, lat], zoom: 10 });
        if (markerRef.current) markerRef.current.remove();
        markerRef.current = new mapboxgl.Marker({ color: '#3b82f6' })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);
        return;
      }
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [lng, lat],
      zoom: 10,
      attributionControl: false,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'top-right',
    );

    map.on('load', () => {
      markerRef.current = new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat([lng, lat])
        .addTo(map);
    });

    mapRef.current = map;
  }, [result?.location, confirmed]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ── Reset handler ──────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setUrlInput('');
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setConfirmed(false);
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  }, []);

  // ── Drag and drop ──────────────────────────────────────────────────

  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        handleImageSelect(file);
      }
    },
    [handleImageSelect],
  );

  // ── Keyboard shortcut: Enter to analyze ────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (urlInput || imageFile) && !loading) {
        handleAnalyze();
      }
    },
    [urlInput, imageFile, loading, handleAnalyze],
  );

  // ── Render state logic ─────────────────────────────────────────────

  const hasInput = urlInput.trim().length > 0 || imageFile !== null;
  const showResults = result && !loading;

  // Multi-location (Top 10 type content)
  const isMulti = showResults && result.locations && result.locations.length > 1;

  // Single result with matched destination + alternatives
  const hasMatch = showResults && !isMulti && result.matchedDestination && result.alternatives;

  // Location identified but not in our collection — show location + trending
  const hasLocationNoMatch = showResults && !isMulti && result.location && !result.matchedDestination && result.trendingFallback;

  // Nothing identified — trending-only fallback
  const hasTrendingOnly = showResults && !isMulti && !result.location && result.trendingFallback;

  // Error with no fallback
  const isError = showResults && !isMulti && !hasMatch && !hasLocationNoMatch && !hasTrendingOnly && result.error;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Where is this place?
          </h1>
          <p className="text-gray-500 text-lg">
            Paste a TikTok, Instagram, or YouTube link — or upload a screenshot
          </p>
        </div>

        {/* ── Confirmed state ─────────────────────────────────── */}
        {confirmed && result?.location ? (
          <div className="text-center space-y-6">
            <div
              ref={mapContainerRef}
              className="w-full h-[300px] rounded-2xl overflow-hidden shadow-lg"
            />

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="text-4xl mb-3">📍</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {result.location.displayName}
              </h2>

              {result.confidenceScore && (
                <div className="mt-2">
                  <ConfidenceBadge
                    tier={result.confidenceScore.tier}
                    label={result.confidenceScore.label}
                  />
                </div>
              )}

              {result.matchedDestination ? (
                <div className="mt-4 p-4 bg-primary-50 rounded-xl">
                  <p className="text-primary-700 font-medium text-sm mb-2">
                    We have this destination in our collection!
                  </p>
                  <div className="flex items-center gap-3">
                    <DestinationThumb
                      src={result.matchedDestination.imageUrl}
                      city={result.matchedDestination.city}
                      size="md"
                    />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">
                        {result.matchedDestination.city},{' '}
                        {result.matchedDestination.country}
                      </p>
                      <p className="text-sm text-gray-500">
                        {result.matchedDestination.highlights
                          .slice(0, 3)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 mt-2">
                  This destination isn&apos;t in our collection yet — but
                  we&apos;re growing!
                </p>
              )}

              {result.matchedDestination ? (
                <button
                  onClick={() => selectDestination(result.matchedDestination!)}
                  className="w-full mt-5 py-3.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-sm"
                >
                  Explore {result.matchedDestination.city}
                </button>
              ) : (
                <p className="text-amber-600 font-medium mt-4 text-sm">
                  Not in our collection yet — we&apos;re always expanding!
                </p>
              )}
            </div>

            <button
              onClick={handleReset}
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Try another place
            </button>
          </div>
        ) : (
          <>
            {/* ── Input section ─────────────────────────────────── */}
            {!loading && !showResults && (
              <div className="space-y-5">
                {/* URL input */}
                <div>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      if (e.target.value) {
                        setImageFile(null);
                        setImagePreview(null);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="https://www.tiktok.com/@user/video/..."
                    className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                  />
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-gray-400 text-sm font-medium">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Image upload area */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    dragging
                      ? 'border-primary-500 bg-primary-50'
                      : imagePreview
                        ? 'border-primary-300 bg-primary-50/50'
                        : 'border-gray-300 hover:border-gray-400 bg-white'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageSelect(file);
                    }}
                  />

                  {imagePreview ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {imageFile?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {imageFile
                            ? `${(imageFile.size / 1024 / 1024).toFixed(1)}MB`
                            : ''}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="text-xs text-red-500 hover:text-red-700 mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="w-8 h-8 text-gray-400 mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm text-gray-500">
                        Drop a screenshot here, or{' '}
                        <span className="text-primary-600 font-medium">
                          browse
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        JPEG, PNG, or WebP up to 5MB
                      </p>
                    </>
                  )}
                </div>

                {/* Submit button */}
                <button
                  onClick={handleAnalyze}
                  disabled={!hasInput}
                  className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all ${
                    hasInput
                      ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Find this place
                </button>
              </div>
            )}

            {/* ── Loading state ──────────────────────────────────── */}
            {loading && (
              <div className="text-center py-16">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-sm border border-gray-200">
                  <svg
                    className="animate-spin h-5 w-5 text-primary-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-gray-700 font-medium">
                    Analyzing...
                  </span>
                </div>

                {imagePreview && (
                  <div className="mt-6">
                    <img
                      src={imagePreview}
                      alt="Analyzing"
                      className="w-48 h-48 rounded-xl object-cover mx-auto opacity-60"
                    />
                  </div>
                )}
                {urlInput && !imagePreview && (
                  <p className="mt-4 text-sm text-gray-400 truncate max-w-sm mx-auto">
                    {urlInput}
                  </p>
                )}
              </div>
            )}

            {/* ── Result: Match + Alternatives (4-tile grid) ────── */}
            {hasMatch && !confirmed && (
              <div className="space-y-5">
                {/* Header with confidence */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">This looks like</p>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {result.location!.displayName}
                      </h2>
                      {result.location!.reasoning && (
                        <p className="text-sm text-gray-500 mt-1">
                          {result.location!.reasoning}
                        </p>
                      )}
                    </div>
                    {result.confidenceScore && (
                      <ConfidenceBadge
                        tier={result.confidenceScore.tier}
                        label={result.confidenceScore.label}
                      />
                    )}
                  </div>

                  {/* Small map */}
                  <div
                    ref={mapContainerRef}
                    className="w-full h-[180px] rounded-xl overflow-hidden mt-4"
                  />
                </div>

                {/* 4-tile grid: best match + 3 alternatives */}
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-3 px-1">
                    Choose a destination to explore
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Best match tile */}
                    <DestinationTile
                      tile={{
                        role: 'best_match',
                        label: 'Best Match',
                        destination: result.matchedDestination!,
                        reasoning: result.matchedDestination!.highlights?.slice(0, 2).join(' · ') || 'Top destination',
                        averageCost: result.matchedDestination!.averageCost,
                      }}
                      onSelect={setSelectedTile}
                      isBestMatch
                    />

                    {/* Alternative tiles */}
                    {result.alternatives!.map((tile, i) => (
                      <DestinationTile
                        key={`alt-${i}`}
                        tile={tile}
                        onSelect={setSelectedTile}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                >
                  Try a different photo or link
                </button>
              </div>
            )}

            {/* ── Result: Location found but not in collection ──── */}
            {hasLocationNoMatch && !confirmed && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">We found</p>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {result.location!.displayName}
                      </h2>
                    </div>
                    {result.confidenceScore && (
                      <ConfidenceBadge
                        tier={result.confidenceScore.tier}
                        label={result.confidenceScore.label}
                      />
                    )}
                  </div>

                  <div
                    ref={mapContainerRef}
                    className="w-full h-[180px] rounded-xl overflow-hidden mt-4"
                  />

                  <p className="mt-3 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                    This spot isn&apos;t in our collection yet — but here are similar destinations you can book now:
                  </p>
                </div>

                {/* Trending tiles as suggestions */}
                <div className="grid grid-cols-2 gap-3">
                  {result.trendingFallback!.map((tile, i) => (
                    <DestinationTile
                      key={`trend-${i}`}
                      tile={tile}
                      onSelect={setSelectedTile}
                    />
                  ))}
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                >
                  Try a different photo or link
                </button>
              </div>
            )}

            {/* ── Result: No location found — trending fallback ─── */}
            {hasTrendingOnly && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
                  <div className="text-4xl mb-3">🤔</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    We couldn&apos;t pin this down
                  </h2>
                  <p className="text-sm text-gray-500">
                    No worries — here are some popular destinations for you:
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {result.trendingFallback!.map((tile, i) => (
                    <DestinationTile
                      key={`trend-${i}`}
                      tile={tile}
                      onSelect={setSelectedTile}
                    />
                  ))}
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                >
                  Try a different photo or link
                </button>
              </div>
            )}

            {/* ── Result: Multiple locations (tile grid) ──────────── */}
            {isMulti && !confirmed && (
              <div className="space-y-5">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">
                    We found {result.locations!.length} places in this link
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Where do you want to go?
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {result.locations!.map((loc, i) => {
                    const dest = loc.matchedDestination;
                    const city =
                      dest?.city || loc.location.city || 'Unknown';
                    const country =
                      dest?.country || loc.location.country || '';
                    const imgSrc = dest?.imageUrl || '';
                    const thumbUrl =
                      imgSrc && imgSrc.includes('unsplash.com')
                        ? imgSrc +
                          (imgSrc.includes('?') ? '&' : '?') +
                          'q=80&auto=format&fit=crop&w=400&h=260'
                        : imgSrc;

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setResult({
                            ...result,
                            location: loc.location,
                            matchedDestination: loc.matchedDestination,
                            confidenceScore: loc.confidenceScore,
                            locations: undefined,
                          });
                          setConfirmed(true);
                        }}
                        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-primary-300 transition-all text-left"
                      >
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt={city}
                            className="w-full h-32 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-32 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                            <span className="text-3xl">🌍</span>
                          </div>
                        )}

                        <div className="p-3">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm leading-tight">
                                {city}
                              </p>
                              {country && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {country}
                                </p>
                              )}
                            </div>
                            {loc.confidenceScore && (
                              <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                                loc.confidenceScore.tier === 'high' ? 'bg-green-500' :
                                loc.confidenceScore.tier === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                              }`} title={loc.confidenceScore.label} />
                            )}
                          </div>
                          {dest ? (
                            <p className="text-xs text-green-600 mt-1.5 font-medium">
                              In our collection
                            </p>
                          ) : (
                            <p className="text-xs text-amber-500 mt-1.5">
                              Not in collection yet
                            </p>
                          )}
                        </div>

                        <div className="absolute inset-0 bg-primary-600/0 group-hover:bg-primary-600/5 transition-colors rounded-2xl" />
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                >
                  Try a different link
                </button>
              </div>
            )}

            {/* ── Result: Error with no fallback ───────────────────── */}
            {isError && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
                  <div className="text-4xl mb-3">🤔</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    Something went wrong
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    {result.error}
                  </p>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Pipeline debug trace (temporary) ──────────────────── */}
        {result?._debug && result._debug.length > 0 && (
          <div className="mt-4 bg-gray-900 text-green-400 rounded-xl p-4 text-xs font-mono overflow-auto max-h-64">
            <p className="text-gray-500 mb-2">Pipeline trace:</p>
            {result._debug.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>

      {/* ── Detail modal (opens when user taps a tile) ──────────── */}
      <DiscoverDetailModal
        tile={selectedTile}
        onClose={() => setSelectedTile(null)}
        onExplore={(dest) => {
          setSelectedTile(null);
          selectDestination(dest);
        }}
      />
    </div>
  );
}
