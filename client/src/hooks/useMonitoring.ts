import { useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import type { TrackedRepository } from '../types';

export function useMonitoring() {
  const [tracking, setTracking] = useState<TrackedRepository | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrackingStatus = useCallback(async (trackingId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getTrackingStatus(trackingId);
      const raw = response.data as any;
      const trackingData: TrackedRepository = raw?.tracking || raw?.data?.tracking || raw;
      setTracking(trackingData);
      return trackingData;
    } catch (err: unknown) {
      // If 404, it just means repository is not tracked yet - don't treat as fatal error
      setTracking(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startTracking = useCallback(async (analysisId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.startTracking(analysisId);
      const raw = response.data as any;
      const trackingData: TrackedRepository = raw?.tracking || raw?.data || raw;
      setTracking(trackingData);
      return trackingData;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start monitoring';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopTracking = useCallback(async (trackingId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.stopTracking(trackingId);
      const raw = response.data as any;
      const trackingData: TrackedRepository = raw?.tracking || raw?.data || raw;
      setTracking(trackingData);
      return trackingData;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to stop monitoring';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    tracking,
    setTracking,
    isLoading,
    error,
    setError,
    fetchTrackingStatus,
    startTracking,
    stopTracking,
    isTrackingActive: tracking?.status === 'active',
  };
}

export default useMonitoring;
