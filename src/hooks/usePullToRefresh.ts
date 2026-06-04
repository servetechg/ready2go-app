import { useCallback, useState } from 'react';
import type { RefreshControlProps } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

export function usePullToRefresh(onRefresh: () => Promise<unknown>) {
  const { colors } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const refreshControlProps: RefreshControlProps = {
    refreshing,
    onRefresh: handleRefresh,
    colors: [colors.primary],
    tintColor: colors.primary,
  };

  return { refreshing, refresh: handleRefresh, refreshControlProps };
}
