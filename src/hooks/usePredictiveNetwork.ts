import { useState, useEffect, useCallback } from 'react';
import type { BandwidthTier } from '../types';
import networkPatterns from '../data/networkPatterns.json';

interface PredictionResult {
  predictedTier: BandwidthTier | null;
  confidence: number;
  detectedLocation: string;
  detectedWeather: string;
  isLoading: boolean;
  error: string | null;
  locationDenied: boolean;
  setSelectedLocationOverride: (loc: string) => void;
}

// Coordinates for mapping Geolocation
const LOCATIONS = [
  { name: 'Coimbatore City', lat: 11.0168, lon: 76.9558 },
  { name: 'Ooty', lat: 11.4102, lon: 76.6950 },
  { name: 'Kodaikanal', lat: 10.2381, lon: 77.4892 },
];

export const usePredictiveNetwork = (): PredictionResult => {
  const [detectedLocation, setDetectedLocation] = useState<string>('Coimbatore City');
  const [detectedWeather, setDetectedWeather] = useState<string>('clear');
  const [predictedTier, setPredictedTier] = useState<BandwidthTier | null>(null);
  const [confidence, setConfidence] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState<boolean>(false);

  // Manual select override
  const setSelectedLocationOverride = useCallback((locName: string) => {
    setDetectedLocation(locName);
    setLocationDenied(true); // Treat as manual override mode
  }, []);

  // Distance helper (Haversine formula) to find the closest location
  const findClosestLocation = (lat: number, lon: number): string => {
    let minDistance = Infinity;
    let closestName = 'Coimbatore City';

    LOCATIONS.forEach((loc) => {
      const dLat = (loc.lat - lat) * (Math.PI / 180);
      const dLon = (loc.lon - lon) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * (Math.PI / 180)) *
          Math.cos(loc.lat * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = 6371 * c; // Earth's radius in km

      if (distance < minDistance) {
        minDistance = distance;
        closestName = loc.name;
      }
    });

    return closestName;
  };

  // Maps Open-Meteo weather codes to clear/rain/fog
  const mapWeatherCode = (code: number): string => {
    // 0: Clear
    // 1-3: Partly/Mainly cloudy -> clear
    // 45, 48: Fog
    // 51-55: Drizzle -> rain
    // 61-65: Rain -> rain
    // 80-82: Showers -> rain
    // 95-99: Thunderstorms -> rain
    if (code === 45 || code === 48) {
      return 'fog';
    } else if (
      (code >= 51 && code <= 55) ||
      (code >= 61 && code <= 65) ||
      (code >= 80 && code <= 82) ||
      code >= 95
    ) {
      return 'rain';
    }
    return 'clear';
  };

  // Fetch Geolocation
  useEffect(() => {
    if (locationDenied) return; // Skip if manually overridden or denied

    if (!navigator.geolocation) {
      setError('Geolocation not supported by browser.');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const closestLoc = findClosestLocation(latitude, longitude);
        setDetectedLocation(closestLoc);
      },
      (geoErr) => {
        console.warn('Geolocation denied or failed. Falling back to dropdown.', geoErr);
        setLocationDenied(true);
      }
    );
  }, [locationDenied]);

  // Fetch weather and calculate prediction whenever location changes
  useEffect(() => {
    const fetchWeatherAndPredict = async () => {
      setIsLoading(true);
      setError(null);

      // Find the coordinates of active location
      const locDetails = LOCATIONS.find((l) => l.name === detectedLocation) || LOCATIONS[0];
      const currentHour = new Date().getHours();

      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${locDetails.lat}&longitude=${locDetails.lon}&current_weather=true`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch weather data.');
        }

        const data = await response.json();
        const weatherCode = data.current_weather?.weathercode ?? 0;
        const mappedWeather = mapWeatherCode(weatherCode);
        setDetectedWeather(mappedWeather);

        // Perform predictions by matching against the synthetic patterns
        // Match: location === detectedLocation, weather === mappedWeather
        // Hour matching: find closest hour entry
        const matchingEntries = networkPatterns.filter(
          (entry) =>
            entry.location.toLowerCase() === detectedLocation.toLowerCase() &&
            entry.weather === mappedWeather
        );

        if (matchingEntries.length > 0) {
          // Find entry with closest hour
          const matchedEntry = matchingEntries.reduce((prev, curr) => {
            return Math.abs(curr.hour - currentHour) < Math.abs(prev.hour - currentHour) ? curr : prev;
          });

          setPredictedTier(matchedEntry.predictedTier as BandwidthTier);
          setConfidence(matchedEntry.confidence);
        } else {
          // Fallback if no matching weather/loc entry (unlikely)
          setPredictedTier('high');
          setConfidence(0.95);
        }
      } catch (err: any) {
        console.error('Weather forecast prediction error:', err);
        setError('Error retrieving forecast. Defaulting to clear weather prediction.');
        
        // Fallback pattern lookup using clear weather
        const fallbackWeather = 'clear';
        setDetectedWeather(fallbackWeather);

        const matchingEntries = networkPatterns.filter(
          (entry) =>
            entry.location.toLowerCase() === detectedLocation.toLowerCase() &&
            entry.weather === fallbackWeather
        );
        if (matchingEntries.length > 0) {
          const matchedEntry = matchingEntries.reduce((prev, curr) => {
            return Math.abs(curr.hour - currentHour) < Math.abs(prev.hour - currentHour) ? curr : prev;
          });
          setPredictedTier(matchedEntry.predictedTier as BandwidthTier);
          setConfidence(matchedEntry.confidence);
        } else {
          setPredictedTier('high');
          setConfidence(0.8);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeatherAndPredict();
  }, [detectedLocation]);

  return {
    predictedTier,
    confidence,
    detectedLocation,
    detectedWeather,
    isLoading,
    error,
    locationDenied,
    setSelectedLocationOverride,
  };
};

export default usePredictiveNetwork;
