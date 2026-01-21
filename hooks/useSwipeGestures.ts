'use client';

import { useRef, useCallback, useState, useEffect } from 'react';

interface SwipeGesturesConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance to trigger swipe
  velocityThreshold?: number; // Minimum velocity for quick swipes
}

interface SwipeState {
  isSwiping: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  offset: { x: number; y: number };
  progress: number; // 0 to 1, how close to completing swipe
}

export function useSwipeGestures(config: SwipeGesturesConfig) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 100,
    velocityThreshold = 0.5,
  } = config;

  const ref = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startTime = useRef(0);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    direction: null,
    offset: { x: 0, y: 0 },
    progress: 0,
  });

  const handleStart = useCallback((clientX: number, clientY: number) => {
    startPos.current = { x: clientX, y: clientY };
    startTime.current = Date.now();
    setSwipeState({
      isSwiping: true,
      direction: null,
      offset: { x: 0, y: 0 },
      progress: 0,
    });
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!swipeState.isSwiping) return;

    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;

    // Determine primary direction
    let direction: SwipeState['direction'] = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    const primaryDelta = Math.abs(direction === 'left' || direction === 'right' ? deltaX : deltaY);
    const progress = Math.min(1, primaryDelta / threshold);

    setSwipeState({
      isSwiping: true,
      direction,
      offset: { x: deltaX, y: deltaY },
      progress,
    });
  }, [swipeState.isSwiping, threshold]);

  const handleEnd = useCallback(() => {
    if (!swipeState.isSwiping) return;

    const deltaX = swipeState.offset.x;
    const deltaY = swipeState.offset.y;
    const elapsed = Date.now() - startTime.current;
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / elapsed;

    // Check if swipe meets threshold (distance or velocity)
    const meetsThreshold = swipeState.progress >= 1 || velocity > velocityThreshold;

    if (meetsThreshold && swipeState.direction) {
      switch (swipeState.direction) {
        case 'left':
          onSwipeLeft?.();
          break;
        case 'right':
          onSwipeRight?.();
          break;
        case 'up':
          onSwipeUp?.();
          break;
        case 'down':
          onSwipeDown?.();
          break;
      }
    }

    // Reset state
    setSwipeState({
      isSwiping: false,
      direction: null,
      offset: { x: 0, y: 0 },
      progress: 0,
    });
  }, [swipeState, velocityThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }, [handleMove]);

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Mouse event handlers (for desktop)
  const handleMouseDown = useCallback((e: MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Attach event listeners
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Touch events
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);

    // Mouse events
    element.addEventListener('mousedown', handleMouseDown);

    // Mouse move and up on document for better UX
    const handleDocumentMouseMove = (e: MouseEvent) => {
      if (swipeState.isSwiping) {
        handleMove(e.clientX, e.clientY);
      }
    };

    const handleDocumentMouseUp = () => {
      if (swipeState.isSwiping) {
        handleEnd();
      }
    };

    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMove,
    handleEnd,
    swipeState.isSwiping,
  ]);

  // Calculate transform style for the card
  const getTransformStyle = () => {
    if (!swipeState.isSwiping) return {};

    const { x, y } = swipeState.offset;
    const rotate = (x / threshold) * 10; // Max 10 degrees rotation

    return {
      transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)`,
      transition: 'none',
    };
  };

  return {
    ref,
    swipeState,
    getTransformStyle,
  };
}
