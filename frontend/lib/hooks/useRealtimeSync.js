"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Universal Real-Time Data Synchronization Hook
 * Combines Server-Sent Events (SSE) push + adaptive background polling + window focus revalidation.
 * Avoids duplicate network storms by backing off polling when SSE `isLive === true` and
 * stabilizing `events` filter arrays by value rather than object identity.
 */
export function useRealtimeSync(onSync, options = {}) {
  const {
    pollingInterval = 5000,
    events = null, // null means all events
    enabled = true,
  } = options;

  const [isLive, setIsLive] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const onSyncRef = useRef(onSync);
  const isLiveRef = useRef(false);

  // Value-stable key prevents inline `events: [...]` arrays from tearing down EventSource on every render
  const eventsKey = Array.isArray(events) ? events.join("|") : "";

  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  const triggerSync = useCallback(async () => {
    if (typeof onSyncRef.current === "function") {
      try {
        await onSyncRef.current();
        setLastSync(new Date());
      } catch (err) {
        console.warn("[RealtimeSync] Sync error:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let eventSource = null;
    let pollTimer = null;
    let isMounted = true;
    const allowedEvents = eventsKey ? eventsKey.split("|") : null;

    // 1. Initial Load
    const executeInitial = async () => {
      if (typeof onSyncRef.current === "function") {
        try {
          await onSyncRef.current();
          if (isMounted) setLastSync(new Date());
        } catch {}
      }
    };
    executeInitial();

    // 2. Setup Server-Sent Events (SSE) stream
    function connectSSE() {
      try {
        eventSource = new EventSource("/api/realtime");

        eventSource.onopen = () => {
          isLiveRef.current = true;
          if (isMounted) setIsLive(true);
        };

        eventSource.onmessage = (e) => {
          if (!isMounted) return;
          try {
            const payload = JSON.parse(e.data);
            if (payload.type === "connected") {
              isLiveRef.current = true;
              setIsLive(true);
              return;
            }

            if (allowedEvents && !allowedEvents.includes(payload.type)) {
              return;
            }

            if (typeof onSyncRef.current === "function") {
              onSyncRef
                .current()
                .then(() => {
                  if (isMounted) setLastSync(new Date());
                })
                .catch(() => {});
            }
          } catch {
            // Ignore heartbeats
          }
        };

        eventSource.onerror = () => {
          isLiveRef.current = false;
          if (isMounted) setIsLive(false);
        };
      } catch {
        isLiveRef.current = false;
        if (isMounted) setIsLive(false);
      }
    }

    connectSSE();

    // 3. Adaptive Polling Fallback:
    // When SSE is healthy (`isLiveRef.current === true`), reconcile only once every ~30s instead of every 3s.
    if (pollingInterval > 0) {
      let lastPollAt = Date.now();
      const baseTick = Math.max(2500, pollingInterval);
      pollTimer = setInterval(() => {
        if (document.visibilityState !== "visible" || typeof onSyncRef.current !== "function") {
          return;
        }
        const now = Date.now();
        const effectiveInterval = isLiveRef.current ? Math.max(30000, pollingInterval * 8) : pollingInterval;
        if (now - lastPollAt >= effectiveInterval) {
          lastPollAt = now;
          onSyncRef
            .current()
            .then(() => {
              if (isMounted) setLastSync(new Date());
            })
            .catch(() => {});
        }
      }, baseTick);
    }

    // 4. Tab visibility & focus revalidation
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && typeof onSyncRef.current === "function") {
        onSyncRef
          .current()
          .then(() => {
            if (isMounted) setLastSync(new Date());
          })
          .catch(() => {});
      }
    };
    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      isMounted = false;
      isLiveRef.current = false;
      if (eventSource) eventSource.close();
      if (pollTimer) clearInterval(pollTimer);
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [enabled, pollingInterval, eventsKey]);

  return { isLive, lastSync, triggerSync };
}
