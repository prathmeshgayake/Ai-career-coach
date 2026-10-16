import { useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import type { Analysis, AssessmentVersion } from '../types';

export function useAnalysis() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<AssessmentVersion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getAnalyses();
      const raw = response.data;
      let list: Analysis[] = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && typeof raw === 'object' && Array.isArray((raw as any).data)) {
        list = (raw as any).data;
      }
      setAnalyses(list);
      return list;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analyses';
      setError(message);
      setAnalyses([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAnalysis = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getAnalysis(id);
      const raw = response.data;
      const data: Analysis = (raw && typeof raw === 'object' && 'data' in raw) ? (raw as any).data : raw;
      setCurrentAnalysis(data);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analysis details';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getAnalysisHistory(id);
      const raw = response.data;
      let list: AssessmentVersion[] = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && typeof raw === 'object') {
        if (Array.isArray((raw as any).versions)) {
          list = (raw as any).versions;
        } else if (Array.isArray((raw as any).data?.versions)) {
          list = (raw as any).data.versions;
        }
      }
      setHistory(list);
      return list;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analysis history';
      setError(message);
      setHistory([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAnalysis = useCallback(async (data: { jobUrl?: string; jobDescription?: string; repositoryUrl: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.createAnalysis(data);
      const raw = response.data;
      const analysisObj = (raw as any)?.analysis || (raw as any)?.data?.analysis || raw;
      setCurrentAnalysis(analysisObj);
      return raw;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create analysis';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAnalysis = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.deleteAnalysis(id);
      setAnalyses(prev => (Array.isArray(prev) ? prev.filter(a => a.id !== id) : []));
      if (currentAnalysis?.id === id) {
        setCurrentAnalysis(null);
      }
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete analysis';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentAnalysis?.id]);

  return {
    analyses,
    currentAnalysis,
    history,
    isLoading,
    error,
    setError,
    fetchAnalyses,
    fetchAnalysis,
    fetchHistory,
    createAnalysis,
    deleteAnalysis,
    setCurrentAnalysis,
  };
}

export default useAnalysis;
