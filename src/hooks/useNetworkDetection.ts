import { useState, useEffect, useRef } from 'react';
import type { BandwidthTier } from '../types';

interface NetworkMetrics {
  currentTier: BandwidthTier;
  downlinkSpeed: number; // in Mbps
  effectiveType: string;
}

export const useNetworkDetection = (initialTier: BandwidthTier = 'high'): NetworkMetrics => {
  const [currentTier, setCurrentTier] = useState<BandwidthTier>(initialTier);
  const [downlinkSpeed, setDownlinkSpeed] = useState<number>(3.5); // Default speed
  const [effectiveType, setEffectiveType] = useState<string>('4g'); // Default type

  // Majority vote buffer for hysteresis (stores the last 3 measurements)
  const bufferRef = useRef<BandwidthTier[]>([initialTier, initialTier, initialTier]);

  // Run the fetch-based speed test
  const runSpeedTest = async (): Promise<number> => {
    try {
      const startTime = performance.now();
      // Fetch the speedtest file with cache: no-store to avoid cached responses
      const response = await fetch(`/speedtest.bin?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Speed test download failed');
      
      await response.blob();
      const endTime = performance.now();

      const durationSeconds = (endTime - startTime) / 1000;
      if (durationSeconds <= 0) return 100; // Localhost / immediate speed safety

      // Payload size is 51,200 bytes. Convert to bits: 51200 * 8 = 409600 bits
      const fileSizeBits = 51200 * 8;
      const speedBps = fileSizeBits / durationSeconds;
      const speedMbps = speedBps / 1000000; // Mbps

      return parseFloat(speedMbps.toFixed(2));
    } catch (error) {
      console.warn('Network speed test error:', error);
      return 0.1; // Fallback to low speed if offline/error
    }
  };

  // Process a new reading and update the majority buffer
  const processNewReading = (tier: BandwidthTier, speed: number, type: string) => {
    setDownlinkSpeed(speed);
    setEffectiveType(type);

    // Push new measurement to buffer and slide
    const buffer = [...bufferRef.current, tier];
    if (buffer.length > 3) {
      buffer.shift();
    }
    bufferRef.current = buffer;

    // Calculate majority
    const counts = buffer.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<BandwidthTier, number>);

    let majorityTier: BandwidthTier = currentTier;
    let maxCount = 0;

    (Object.keys(counts) as BandwidthTier[]).forEach((key) => {
      if (counts[key] > maxCount) {
        maxCount = counts[key];
        majorityTier = key;
      }
    });

    // Update state only if the majority tier is different
    if (majorityTier !== currentTier && maxCount >= 2) {
      setCurrentTier(majorityTier);
    }
  };

  useEffect(() => {
    const conn = (navigator as any).connection;

    const performMeasurement = async () => {
      let speedMbps = 1.5;
      let connType = 'unknown';
      let mappedTier: BandwidthTier = 'high';

      if (conn) {
        // Read directly from connection API
        speedMbps = conn.downlink || 1.5;
        connType = conn.effectiveType || 'unknown';

        // Use effectiveType as primary signal if available
        if (connType === '4g') {
          mappedTier = 'high';
        } else if (connType === '3g') {
          mappedTier = 'medium';
        } else if (connType === '2g' || connType === 'slow-2g') {
          mappedTier = 'low';
        } else {
          // Fall back to downlink speed mapping if type is unmapped
          if (speedMbps > 1.5) mappedTier = 'high';
          else if (speedMbps >= 0.3) mappedTier = 'medium';
          else mappedTier = 'low';
        }
      } else {
        // Fall back fully to measured speed test for unsupported browsers (Safari/Firefox)
        speedMbps = await runSpeedTest();
        connType = 'speed-test';

        if (speedMbps > 1.5) mappedTier = 'high';
        else if (speedMbps >= 0.3) mappedTier = 'medium';
        else mappedTier = 'low';
      }

      processNewReading(mappedTier, speedMbps, connType);
    };

    // Initial measurement
    performMeasurement();

    // Setup network change listener if supported
    if (conn) {
      conn.addEventListener('change', performMeasurement);
    }

    // Set up periodic speed check every 5 seconds (as fallback and to keep speeds updated)
    const testInterval = setInterval(async () => {
      await performMeasurement();
    }, 5000);

    return () => {
      if (conn) {
        conn.removeEventListener('change', performMeasurement);
      }
      clearInterval(testInterval);
    };
  }, [currentTier]);

  return { currentTier, downlinkSpeed, effectiveType };
};
export default useNetworkDetection;
