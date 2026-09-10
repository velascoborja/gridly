"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FixedExpenseStats } from "@/lib/fixed-stats";
import type { TagStats } from "@/lib/tag-stats";

type DrilldownKind = "tags" | "fixed";
type StatsFor<K extends DrilldownKind> = K extends "tags" ? TagStats : FixedExpenseStats;

interface RequestState<K extends DrilldownKind> {
  key: string;
  data: StatsFor<K> | null;
  error: boolean;
  loading: boolean;
}

export function useEvolutionDrilldown<K extends DrilldownKind>(
  kind: K,
  year: number | null,
  includeFuture: boolean,
  enabled: boolean,
) {
  const cache = useRef(new Map<string, StatsFor<K>>());
  const [retryToken, setRetryToken] = useState(0);
  const key = `${kind}:${year ?? "all"}:${includeFuture}`;
  const [state, setState] = useState<RequestState<K>>({
    key: "",
    data: null,
    error: false,
    loading: false,
  });

  useEffect(() => {
    if (!enabled) return;

    const cached = cache.current.get(key);
    if (cached) {
      setState({ key, data: cached, error: false, loading: false });
      return;
    }

    const controller = new AbortController();
    setState({ key, data: null, error: false, loading: true });

    const params = new URLSearchParams({
      kind,
      year: year === null ? "all" : String(year),
      includeFuture: String(includeFuture),
    });

    fetch(`/api/evolution/drilldown?${params}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Drilldown request failed: ${response.status}`);
        return response.json() as Promise<{ kind: DrilldownKind; year: number | null; stats: StatsFor<K> }>;
      })
      .then((response) => {
        if (response.kind !== kind || response.year !== year) {
          throw new Error("Drilldown response did not match the requested page");
        }
        cache.current.set(key, response.stats);
        setState({ key, data: response.stats, error: false, loading: false });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ key, data: null, error: true, loading: false });
      });

    return () => controller.abort();
  }, [enabled, includeFuture, key, kind, retryToken, year]);

  return useMemo(() => ({
    data: state.key === key ? state.data : null,
    error: state.key === key && state.error,
    loading: enabled && (state.key !== key || state.loading),
    retry: () => {
      setState({ key, data: null, error: false, loading: true });
      setRetryToken((token) => token + 1);
    },
  }), [enabled, key, state]);
}
