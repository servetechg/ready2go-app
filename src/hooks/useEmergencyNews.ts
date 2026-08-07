import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
    fetchEmergencyNewsFeed,
    fetchMoreEmergencyNews,
} from '@/redux/slices/emergencyNewsSlice';

const STALE_MS = 2 * 60_000;

/** Loads GET /emergency/news on focus with pagination support. */
export function useEmergencyNews() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.emergencyNews.items);
  const loading = useAppSelector((s) => s.emergencyNews.loading);
  const loadingMore = useAppSelector((s) => s.emergencyNews.loadingMore);
  const error = useAppSelector((s) => s.emergencyNews.error);
  const hasMore = useAppSelector((s) => s.emergencyNews.hasMore);
  const stateCode = useAppSelector((s) => s.emergencyNews.stateCode);
  const lastFetchedAt = useAppSelector((s) => s.emergencyNews.lastFetchedAt);
  const focusFetchedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      focusFetchedRef.current = false;
      const isStale = !lastFetchedAt || Date.now() - lastFetchedAt > STALE_MS;
      if (isStale && !focusFetchedRef.current) {
        focusFetchedRef.current = true;
        void dispatch(fetchEmergencyNewsFeed());
      }

      return () => {
        focusFetchedRef.current = false;
      };
    }, [dispatch, lastFetchedAt]),
  );

  const reload = useCallback(
    () => dispatch(fetchEmergencyNewsFeed()).unwrap(),
    [dispatch],
  );

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading && items.length > 0) {
      void dispatch(fetchMoreEmergencyNews());
    }
  }, [dispatch, hasMore, loadingMore, loading, items.length]);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    stateCode,
    reload,
    loadMore,
  };
}
