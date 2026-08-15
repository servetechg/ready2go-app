import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setIdaInvitation } from '@/redux/slices/idaSlice';
import { idaService } from '@/services/ida.service';

export function useActiveIda(token: string | null) {
  const dispatch = useAppDispatch();
  const invitation = useAppSelector((s) => s.ida.invitation);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) {
      dispatch(setIdaInvitation(null));
      return;
    }
    setLoading(true);
    try {
      const { invitation: active } = await idaService.getActive(token);
      dispatch(setIdaInvitation(active));
    } catch {
      dispatch(setIdaInvitation(null));
    } finally {
      setLoading(false);
    }
  }, [dispatch, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasOpenIda =
    invitation != null &&
    (invitation.status === 'pending' ||
      invitation.status === 'opened' ||
      invitation.status === 'needs_info');

  return { invitation, hasOpenIda, loading, refresh };
}
