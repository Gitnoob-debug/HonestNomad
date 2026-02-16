'use client';

import { useState, useEffect } from 'react';

interface BlurUpImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Tailwind gradient classes for the loading/error placeholder */
  fallbackGradient?: string;
  /** Emoji to show on error */
  fallbackEmoji?: string;
  /** Enable subtle Ken Burns zoom animation on loaded images */
  enableKenBurns?: boolean;
}

/**
 * Image component with progressive loading:
 * 1. Shows gradient placeholder with shimmer while loading
 * 2. Crossfades to full image on load
 * 3. Falls back to gradient + emoji on error
 * 4. Optional Ken Burns slow zoom animation for premium feel
 */
export function BlurUpImage({
  src,
  alt,
  className = '',
  fallbackGradient = 'bg-gradient-to-br from-gray-800 to-gray-900',
  fallbackEmoji = '✈️',
  enableKenBurns = false,
}: BlurUpImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Reset state when src changes (carousel navigation)
  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Gradient placeholder — always present, fades away when image loads */}
      <div
        className={`absolute inset-0 ${fallbackGradient} transition-opacity duration-500 ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Shimmer animation while loading */}
        {!loaded && !error && (
          <div className="absolute inset-0 shimmer-overlay" />
        )}
        {/* Error state: show emoji + city name */}
        {error && (
          <div className="flex items-center justify-center h-full">
            <span className="text-6xl opacity-30">{fallbackEmoji}</span>
          </div>
        )}
      </div>

      {/* Actual image */}
      {!error && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${enableKenBurns ? 'animate-ken-burns' : ''}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
