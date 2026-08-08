import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@/redux/hooks';
import { fetchPersonalizedNews } from '@/services/personalizedNews.service';
import type {
  PersonalizedNewsArticle,
  UsePersonalizedNewsResult,
} from '@/types/personalizedNews';
import { getErrorMessage } from '@/utils/error';

function normalizeStateKey(value?: string | null): string {
  return (value || '').trim().toUpperCase();
}

/**
 * Custom React Hook to fetch and manage state-specific personalized news.
 * Strictly queries the logged-in user's state from profile/auth state.
 */
export function usePersonalizedNews(): UsePersonalizedNewsResult {
  const token = useAppSelector((state) => state.auth.token);
  const userState = useAppSelector((state) => {
    const candidates = [
      (state.auth.user as { state?: string } | null)?.state,
      state.registration?.address?.state,
      state.registration?.alertLocations?.[0]?.state,
    ];
    return candidates.find((value) => typeof value === 'string' && value.trim())?.trim() ?? null;
  });

  const [articles, setArticles] = useState<PersonalizedNewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPersonalized, setIsPersonalized] = useState<boolean>(false);
  const [userStateCode, setUserStateCode] = useState<string | null>(null);
  const [mappedStateName, setMappedStateName] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);

  /** Identifies the account + state a fetch was made for, so a change triggers a refetch. */
  const fetchedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchKey = `${token ?? ''}|${normalizeStateKey(userState)}`;
    if (fetchedKeyRef.current === fetchKey) return;
    fetchedKeyRef.current = fetchKey;
    void loadInitial();
  }, [token, userState, loadInitial]);

  const loadInitial = useCallback(async () => {
    if (!token) {
      setArticles([]);
      setNextPage(null);
      setLoading(false);
      setError('Please log in to view your personalized news feed.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setArticles([]);
      setNextPage(null);
      const response = await fetchPersonalizedNews(token, null, userState);

      setArticles(response.results || []);
      setIsPersonalized(response.isPersonalized);
      setUserStateCode(response.userStateCode);
      setMappedStateName(response.mappedStateName);
      setNextPage(response.nextPage);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch news feed'));
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [token, userState]);

  const reload = useCallback(async () => {
    if (!token) return;

    try {
      setRefreshing(true);
      setError(null);
      const response = await fetchPersonalizedNews(token, null, userState, { forceRefresh: true });

      setArticles(response.results || []);
      setIsPersonalized(response.isPersonalized);
      setUserStateCode(response.userStateCode);
      setMappedStateName(response.mappedStateName);
      setNextPage(response.nextPage);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to refresh news feed'));
    } finally {
      setRefreshing(false);
    }
  }, [token, userState]);

  const loadMore = useCallback(async () => {
    if (!token || !nextPage || loadingMore || loading || refreshing) return;

    try {
      setLoadingMore(true);
      const response = await fetchPersonalizedNews(token, nextPage, userState);

      setArticles((prev) => {
        const seen = new Set(prev.map((a) => a.article_id || a.link));
        const fresh = (response.results || []).filter((a) => !seen.has(a.article_id || a.link));
        return [...prev, ...fresh];
      });
      setNextPage(response.nextPage);
    } catch (err) {
      console.warn('Error loading more news:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [token, nextPage, userState, loadingMore, loading, refreshing]);

  useFocusEffect(
    useCallback(() => {
      const fetchKey = `${token ?? ''}|${normalizeStateKey(userState)}`;
      if (fetchedKeyRef.current === fetchKey) return;
      fetchedKeyRef.current = fetchKey;
      setArticles([]);
      setNextPage(null);
      void loadInitial();
    }, [token, userState, loadInitial]),
  );

  return {
    articles,
    loading,
    refreshing,
    loadingMore,
    error,
    isPersonalized,
    userStateCode,
    mappedStateName,
    hasMore: Boolean(nextPage),
    reload,
    loadMore,
  };
}
