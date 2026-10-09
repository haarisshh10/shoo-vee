import * as React from "react";

export type Coordinates = { latitude: number; longitude: number };

/**
 * Thin wrapper over the browser geolocation API. The success callback receives the coordinates, so
 * callers can fill a form field without an extra effect watching hook state.
 */
export function useGeolocation() {
  const [isLocating, setIsLocating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const request = React.useCallback((onSuccess?: (coords: Coordinates) => void) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Location is not available in this browser. Enter it manually.");
      return;
    }
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        onSuccess?.({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setIsLocating(false);
        setError("We could not access your location. Enter it manually.");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, []);

  return { isLocating, error, request };
}
