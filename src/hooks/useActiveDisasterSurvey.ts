import { useCallback, useEffect, useState } from 'react';

import { disasterSurveyService } from '@/services/disasterSurvey.service';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setDisasterSurveyInvitation } from '@/redux/slices/disasterSurveySlice';

export function useActiveDisasterSurvey(token: string | null) {
  const dispatch = useAppDispatch();
  const invitation = useAppSelector((s) => s.disasterSurvey.invitation);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) {
      dispatch(setDisasterSurveyInvitation(null));
      return;
    }
    setLoading(true);
    try {
      const { invitation: active } = await disasterSurveyService.getActive(token);
      dispatch(setDisasterSurveyInvitation(active));
    } catch {
      dispatch(setDisasterSurveyInvitation(null));
    } finally {
      setLoading(false);
    }
  }, [dispatch, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasOpenSurvey =
    invitation != null && (invitation.status === 'pending' || invitation.status === 'opened');

  return { invitation, hasOpenSurvey, loading, refresh };
}
