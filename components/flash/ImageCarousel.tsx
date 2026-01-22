'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { DestinationImage } from '@/types/flash';

interface ImageCarouselProps {
  images: DestinationImage[];
  primaryImage: string;  // Fallback single image
  alt: string;
  className?: string;
  showCaptions?: boolean;
  onImageChange?: (index: number) => void;
}

export function ImageCarousel({
  images,
  primaryImage,
  alt,
  className = '',
  showCaptions = false,
  onImageChange,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use images array if available, otherwise create array from primaryImage
  const allImages: DestinationImage[] = images && images.length > 0
    ? images
    : [{ url: primaryImage }];

  const goToNext = useCallback(() => {
    if (currentIndex < allImages.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onImageChange?.(newIndex);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [currentIndex, allImages.length, isTransitioning, onImageChange]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onImageChange?.(newIndex);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [currentIndex, isTransitioning, onImageChange]);

  const goToIndex = useCallback((index: number) => {
    if (index !== currentIndex && !isTransitioning && index >= 0 && index < allImages.length) {
      setIsTransitioning(true);
      setCurrentIndex(index);
      onImageChange?.(index);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [currentIndex, isTransitioning, allImages.length, onImageChange]);

  // Handle tap on left/right sides of image
  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (allImages.length <= 1) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const relativeX = clientX - rect.left;
    const tapZoneWidth = rect.width * 0.3; // 30% on each side for tap zones

    if (relativeX < tapZoneWidth) {
      goToPrevious();
      e.stopPropagation();
    } else if (relativeX > rect.width - tapZoneWidth) {
      goToNext();
      e.stopPropagation();
    }
  }, [allImages.length, goToPrevious, goToNext]);

  // Handle horizontal swipe within the carousel
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (allImages.length <= 1) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Only handle horizontal swipes (ignore if vertical movement is greater)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
      if (deltaX < 0) {
        goToNext();
      } else {
        goToPrevious();
      }
      e.stopPropagation();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [allImages.length, goToNext, goToPrevious]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [goToPrevious, goToNext]);

  const currentImage = allImages[currentIndex];

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleTap}
      tabIndex={0}
      role="region"
      aria-label="Image carousel"
      aria-roledescription="carousel"
    >
      {/* Image container with slide animation */}
      <div
        className="relative w-full h-full transition-transform duration-300 ease-out"
        style={{
          display: 'flex',
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {allImages.map((image, index) => (
          <div
            key={index}
            className="w-full h-full flex-shrink-0"
            aria-hidden={index !== currentIndex}
          >
            <img
              src={image.url}
              alt={image.caption || `${alt} - Image ${index + 1}`}
              className="w-full h-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      {allImages.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          {allImages.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-white w-4'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to image ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      )}

      {/* Image counter badge */}
      {allImages.length > 1 && (
        <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-10">
          {currentIndex + 1} / {allImages.length}
        </div>
      )}

      {/* Caption overlay */}
      {showCaptions && currentImage.caption && (
        <div className="absolute bottom-10 left-0 right-0 text-center z-10">
          <span className="bg-black/50 text-white text-sm px-3 py-1 rounded-full">
            {currentImage.caption}
          </span>
        </div>
      )}

      {/* Tap zone hints (only visible briefly on first interaction) */}
      {allImages.length > 1 && (
        <>
          {/* Left tap zone indicator */}
          <div className="absolute left-0 top-0 bottom-0 w-[30%] flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            {currentIndex > 0 && (
              <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            )}
          </div>
          {/* Right tap zone indicator */}
          <div className="absolute right-0 top-0 bottom-0 w-[30%] flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            {currentIndex < allImages.length - 1 && (
              <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
