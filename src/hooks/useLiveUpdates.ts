import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../services/api';

interface PollConfig {
  endpoint: string;
  interval: number; // in milliseconds
  enabled?: boolean;
  onUpdate?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface PollState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

/**
 * Hook for polling an API endpoint at regular intervals
 * Provides WebSocket-like real-time updates through HTTP polling
 */
export function usePoll<T = any>(config: PollConfig): PollState<T> & { refetch: () => Promise<void> } {
  const { endpoint, interval, enabled = true, onUpdate, onError } = config;
  const [state, setState] = useState<PollState<T>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!enabled || !mountedRef.current) return;

    try {
      const response = await apiClient.get(endpoint);

      if (mountedRef.current) {
        setState(prev => ({
          data: response,
          loading: false,
          error: null,
          lastUpdated: new Date()
        }));

        if (onUpdate) {
          onUpdate(response);
        }
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err
        }));

        if (onError) {
          onError(err);
        }
      }
    }
  }, [endpoint, enabled, onUpdate, onError]);

  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      // Initial fetch
      fetchData();

      // Set up polling
      if (interval > 0) {
        intervalRef.current = setInterval(fetchData, interval);
      }
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, interval, enabled]);

  return {
    ...state,
    refetch: fetchData
  };
}

/**
 * Hook for live telemetry updates
 */
export function useLiveTelemetry(vehicleId?: number, interval = 5000) {
  const endpoint = vehicleId
    ? `/telemetry/live?vehicle_id=${vehicleId}`
    : '/telemetry/live';

  return usePoll({
    endpoint,
    interval,
    enabled: true
  });
}

/**
 * Hook for live notification count
 */
export function useNotificationCount(interval = 30000) {
  return usePoll<{ count: number }>({
    endpoint: '/notifications/unread-count',
    interval,
    enabled: true
  });
}

/**
 * Hook for live wallet balance
 */
export function useWalletBalance(interval = 60000) {
  return usePoll({
    endpoint: '/wallet/balance',
    interval,
    enabled: true
  });
}

/**
 * Hook for live driver metrics
 */
export function useDriverMetrics(interval = 30000) {
  return usePoll({
    endpoint: '/drivers/metrics',
    interval,
    enabled: true
  });
}

/**
 * Hook for live fleet status
 */
export function useFleetStatus(interval = 10000) {
  return usePoll({
    endpoint: '/telemetry/live',
    interval,
    enabled: true
  });
}

/**
 * Hook for live swap task status (for drivers)
 */
export function useActiveSwapTask(interval = 10000) {
  return usePoll({
    endpoint: '/fleet/drivers/me/active-task',
    interval,
    enabled: true
  });
}

/**
 * Hook for system health monitoring (admin)
 */
export function useSystemHealth(interval = 30000) {
  return usePoll({
    endpoint: '/admin/dashboard/system-health',
    interval,
    enabled: true
  });
}

/**
 * Hook for portfolio summary (investors)
 */
export function usePortfolioSummary(interval = 60000) {
  return usePoll({
    endpoint: '/investments/portfolio',
    interval,
    enabled: true
  });
}

/**
 * Event emitter for cross-component updates
 */
class LiveUpdateEventEmitter {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  subscribe(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

export const liveUpdateEmitter = new LiveUpdateEventEmitter();

/**
 * Hook to subscribe to live update events
 */
export function useLiveUpdateSubscription(event: string, callback: (data: any) => void) {
  useEffect(() => {
    const unsubscribe = liveUpdateEmitter.subscribe(event, callback);
    return unsubscribe;
  }, [event, callback]);
}

export default {
  usePoll,
  useLiveTelemetry,
  useNotificationCount,
  useWalletBalance,
  useDriverMetrics,
  useFleetStatus,
  useActiveSwapTask,
  useSystemHealth,
  usePortfolioSummary,
  liveUpdateEmitter,
  useLiveUpdateSubscription
};
