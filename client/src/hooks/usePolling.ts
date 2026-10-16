import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions {
  intervalMs?: number;
  enabled?: boolean;
  immediate?: boolean;
}

export function usePolling(
  callback: () => Promise<void> | void,
  options: UsePollingOptions = {}
) {
  const { intervalMs = 30000, enabled = true, immediate = false } = options;
  const savedCallback = useRef(callback);
  const isPollingRef = useRef(false);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const execute = useCallback(async () => {
    if (isPollingRef.current) return;
    try {
      isPollingRef.current = true;
      await savedCallback.current();
    } finally {
      isPollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    if (immediate) {
      execute();
    }

    const timer = setInterval(() => {
      execute();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [enabled, intervalMs, immediate, execute]);

  return { trigger: execute };
}

export default usePolling;
