import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useDebounce — delays value update until user stops typing
 * 
 * Critical for SwapPage: prevents excessive API calls during rapid input.
 * Each keystroke resets the timer; fires only when user pauses.
 */
export function useDebounce<T>(value: T, delayMs: number = 600): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

/**
 * useThrottle — limits execution to once per interval
 * Use for frequent events (scroll, resize, rapid price updates)
 */
export function useThrottle<T>(value: T, intervalMs: number = 1000): T {
  const [throttled, setThrottled] = useState<T>(value);
  const lastUpdate = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdate.current >= intervalMs) {
      setThrottled(value);
      lastUpdate.current = now;
    } else {
      const timer = setTimeout(() => {
        setThrottled(value);
        lastUpdate.current = Date.now();
      }, intervalMs - (now - lastUpdate.current));
      return () => clearTimeout(timer);
    }
  }, [value, intervalMs]);

  return throttled;
}

/**
 * useAsyncQueue — serializes async operations to prevent race conditions
 * Critical for swap: prevents multiple concurrent transaction submissions
 */
export function useAsyncQueue() {
  const queue = useRef<Promise<any>>(Promise.resolve());

  const enqueue = useCallback(<T>(fn: () => Promise<T>): Promise<T> => {
    const task = queue.current.then(fn, fn);
    queue.current = task.catch(() => {});
    return task;
  }, []);

  return enqueue;
}

/**
 * useRateLimit — token-bucket rate limiter for API calls
 * Allows burst of `maxBurst` calls, then enforces `intervalMs` between calls
 */
export function useRateLimit(maxBurst: number = 5, intervalMs: number = 1000) {
  const tokens = useRef(maxBurst);
  const lastRefill = useRef(Date.now());

  const tryAcquire = useCallback((): boolean => {
    const now = Date.now();
    const elapsed = now - lastRefill.current;
    
    // Refill tokens
    const refill = Math.floor(elapsed / intervalMs) * maxBurst;
    tokens.current = Math.min(maxBurst, tokens.current + refill);
    if (refill > 0) lastRefill.current = now;

    if (tokens.current > 0) {
      tokens.current--;
      return true;
    }
    return false;
  }, [maxBurst, intervalMs]);

  return tryAcquire;
}
