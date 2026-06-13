import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchAlerts,
  fetchMoreAlerts,
  setAlertsSearchQuery,
} from '@/redux/slices/alertsSlice';

const STALE_MS = 2 * 60_000;
const SEARCH_DEBOUNCE_MS = 300;

/** Loads GET /alerts on focus; debounces global search into API `q` param. */
export function useAlertsDashboard() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.alerts.items ?? []);
  const loading = useAppSelector((s) => s.alerts.loading);
  const loadingMore = useAppSelector((s) => s.alerts.loadingMore);
  const error = useAppSelector((s) => s.alerts.error);
  const hasMore = useAppSelector((s) => s.alerts.hasMore);
  const filters = useAppSelector((s) => s.alerts.filters);
  const lastFetchedAt = useAppSelector((s) => s.alerts.lastFetchedAt);
  const searchQuery = useAppSelector((s) => s.dashboard.searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSearchRef = useRef(searchQuery);
  const focusFetchedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      focusFetchedRef.current = false;
      dispatch(setAlertsSearchQuery(searchQuery));

      const isStale = !lastFetchedAt || Date.now() - lastFetchedAt > STALE_MS;
      if (isStale && !focusFetchedRef.current) {
        focusFetchedRef.current = true;
        void dispatch(fetchAlerts());
      }

      return () => {
        focusFetchedRef.current = false;
      };
    }, [dispatch, lastFetchedAt, searchQuery]),
  );

  useEffect(() => {
    if (prevSearchRef.current === searchQuery) return;
    prevSearchRef.current = searchQuery;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(setAlertsSearchQuery(searchQuery));
      void dispatch(fetchAlerts());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [dispatch, searchQuery]);

  const reload = useCallback(() => dispatch(fetchAlerts()).unwrap(), [dispatch]);
  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading && items.length > 0) {
      void dispatch(fetchMoreAlerts());
    }
  }, [dispatch, hasMore, loadingMore, loading, items.length]);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    filters,
    reload,
    loadMore,
  };
}
