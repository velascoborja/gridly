"use client";

import { useEffect } from "react";

/**
 * Client component that prevents pinch-to-zoom gestures on mobile devices.
 * iOS Safari ignores the viewport meta tag's user-scalable=no, 
 * so this JS fallback provides a more robust solution.
 */
export function PinchZoomDisabler() {
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      // Prevent the default behavior (zooming) when multiple touches are detected
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // { passive: false } is required to allow e.preventDefault()
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return null;
}
