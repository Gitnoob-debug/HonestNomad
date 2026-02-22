'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DESTINATIONS } from '@/lib/flash/destinations';
import type {
  LocationAnalysisResponse,
  MatchedDestination,
  ResolvedLocation,
} from '@/types/location';
import type { Destination } from '@/types/flash';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// ── Destination search for autocomplete ──────────────────────────────

function searchDestinations(query: string): Destination[] {
  if (!query || query.length < 2) return [];
  const lower = query.toLowerCase();
  return DESTINATIONS.filter(
    (d) =>
      d.city.toLowerCase().includes(lower) ||
      d.country.toLowerCase().includes(lower),
  ).slice(0, 8);
}

// ── Main page component ─────────────────────────────────────────────

export default function DiscoverPage() {
  // Input state
  const [urlInput, setUrlInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Analysis state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LocationAnalysisResponse | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // Manual entry state
  const [showManual, setShowManual] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  const [manualResults, setManualResults] = useState<Destination[]>([]);

  // Map
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Image upload handler ───────────────────────────────────────────

  const handleImageSelect = useCallback((file: File) => {
    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Please upload an image under 5MB.');
      return;
    }
    // Validate type
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    ) {
      alert('Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    setImageFile(file);
    setUrlInput(''); // Clear URL when image is selected
    setResult(null);
    setConfirmed(false);
    setShowManual(false);

    // Generate preview
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
    setShowManual(false);

    try {
      let body: Record<string, string> = {};

      if (urlInput) {
        body = { url: urlInput };
      } else if (imageFile) {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            // Strip the data:image/...;base64, prefix
            const base64Data = dataUrl.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });

        body = {
          imageBase64: base64,
          imageMimeType: imageFile.type as string,
        };
      }

      const response = await fetch('/api/location/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data: LocationAnalysisResponse = await response.json();
      setResult(data);

      // If low confidence or no location, show manual entry automatically
      if (!data.location || data.location.confidence === 'low') {
        setShowManual(true);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setResult({
        success: false,
        location: null,
        matchedDestination: null,
        error: 'Network error. Please check your connection and try again.',
      });
      setShowManual(true);
    } finally {
      setLoading(false);
    }
  }, [urlInput, imageFile]);

  // ── Map initialization / update ────────────────────────────────────

  useEffect(() => {
    if (!result?.location || !mapContainerRef.current) return;

    const { lat, lng } = result.location;

    if (mapRef.current) {
      // Update existing map
      mapRef.current.flyTo({ center: [lng, lat], zoom: 10 });
      if (markerRef.current) markerRef.current.remove();
      markerRef.current = new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
      return;
    }

    // Initialize new map
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

    return () => {
      // Don't destroy map on re-render, only on unmount
    };
  }, [result?.location]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ── Manual entry autocomplete ──────────────────────────────────────

  useEffect(() => {
    setManualResults(searchDestinations(manualQuery));
  }, [manualQuery]);

  const handleManualSelect = useCallback(
    (dest: Destination) => {
      // Create a result as if the API resolved this destination
      const location: ResolvedLocation = {
        city: dest.city,
        country: dest.country,
        locationString: `${dest.city}, ${dest.country}`,
        lat: dest.latitude,
        lng: dest.longitude,
        displayName: `${dest.city}, ${dest.country}`,
        confidence: 'high',
        reasoning: 'Manually selected by user.',
        source: 'caption',
      };

      const matched: MatchedDestination = {
        id: dest.id,
        city: dest.city,
        country: dest.country,
        latitude: dest.latitude,
        longitude: dest.longitude,
        highlights: dest.highlights,
        imageUrl: dest.imageUrl,
      };

      setResult({ success: true, location, matchedDestination: matched });
      setShowManual(false);
      setManualQuery('');
    },
    [],
  );

  // ── Reset handler ──────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setUrlInput('');
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setConfirmed(false);
    setShowManual(false);
    setManualQuery('');
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
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

  // ── Render ─────────────────────────────────────────────────────────

  const hasInput = urlInput.trim().length > 0 || imageFile !== null;
  const showResults = result && !loading;
  const isFound =
    showResults && result.location && result.location.confidence === 'high';
  const isNotFound =
    showResults && (!result.location || result.location.confidence === 'low');

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
            {/* Map */}
            <div
              ref={mapContainerRef}
              className="w-full h-[300px] rounded-2xl overflow-hidden shadow-lg"
            />

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="text-4xl mb-3">📍</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {result.location.displayName}
              </h2>

              {result.matchedDestination ? (
                <div className="mt-4 p-4 bg-primary-50 rounded-xl">
                  <p className="text-primary-700 font-medium text-sm mb-2">
                    We have this destination in our collection!
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={result.matchedDestination.imageUrl}
                      alt={result.matchedDestination.city}
                      className="w-16 h-16 rounded-lg object-cover"
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
                  This destination isn&apos;t in our collection yet — but we&apos;re growing!
                </p>
              )}

              <p className="text-green-600 font-medium mt-4">
                Location confirmed!
              </p>
            </div>

            <button
              onClick={handleReset}
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Try another
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
                  <span className="text-gray-400 text-sm font-medium">
                    or
                  </span>
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

                {/* Show the image/URL being analyzed */}
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

            {/* ── Result: Found (high confidence) ─────────────────── */}
            {isFound && !confirmed && (
              <div className="space-y-5">
                {/* Map */}
                <div
                  ref={mapContainerRef}
                  className="w-full h-[300px] rounded-2xl overflow-hidden shadow-lg"
                />

                {/* Location info */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">
                    This looks like
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {result.location!.displayName}
                  </h2>

                  {result.location!.reasoning && (
                    <p className="text-sm text-gray-500 mt-2">
                      {result.location!.reasoning}
                    </p>
                  )}

                  {/* Matched destination card */}
                  {result.matchedDestination && (
                    <div className="mt-4 flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                      <img
                        src={result.matchedDestination.imageUrl}
                        alt={result.matchedDestination.city}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          In our collection
                        </p>
                        <p className="text-xs text-green-600">
                          {result.matchedDestination.highlights
                            .slice(0, 3)
                            .join(' · ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {!result.matchedDestination && (
                    <p className="mt-3 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                      Not in our collection yet — but we&apos;re always expanding!
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => setConfirmed(true)}
                      className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                    >
                      That&apos;s it!
                    </button>
                    <button
                      onClick={() => setShowManual(true)}
                      className="flex-1 py-3 bg-white text-gray-700 rounded-xl font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      Not quite
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Result: Not found (low confidence) ──────────────── */}
            {isNotFound && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
                  <div className="text-4xl mb-3">🤔</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    We couldn&apos;t pin this down
                  </h2>
                  <p className="text-gray-500">
                    {result.error ||
                      result.location?.reasoning ||
                      'Try uploading a clearer image or a different link.'}
                  </p>
                </div>
              </div>
            )}

            {/* ── Manual entry ────────────────────────────────────── */}
            {showManual && (
              <div className="mt-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Where was this filmed?
                </label>
                <input
                  type="text"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  placeholder="Type a city name..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />

                {/* Autocomplete dropdown */}
                {manualResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {manualResults.map((dest) => (
                      <button
                        key={dest.id}
                        onClick={() => handleManualSelect(dest)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <img
                          src={dest.imageUrl}
                          alt={dest.city}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {dest.city}
                          </p>
                          <p className="text-xs text-gray-500">
                            {dest.country}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Try again / start over ──────────────────────────── */}
            {showResults && (
              <div className="text-center mt-6">
                <button
                  onClick={handleReset}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
                >
                  Start over
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
