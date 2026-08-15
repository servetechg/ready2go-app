import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomButtonBar } from '@/components/layout/BottomButtonBar';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { IDA_DEFAULT } from '@/constants/ida';
import { IDA_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { dismissToHomeTabs } from '@/navigation/navigationHelpers';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { clearIda, setIdaInvitation } from '@/redux/slices/idaSlice';
import { idaService } from '@/services/ida.service';
import { spacing } from '@/theme';
import type { IdaStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<IdaStackParamList, typeof IDA_ROUTES.INTRO>;

export function IdaIntroScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const authToken = useAppSelector((s) => s.auth.token);
  const invitation = useAppSelector((s) => s.ida.invitation);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    void idaService.getActive(authToken).then(({ invitation: active }) => {
      if (cancelled) return;
      if (!active || active.status === 'submitted') {
        dispatch(clearIda());
        dismissToHomeTabs(navigation);
        return;
      }
      dispatch(setIdaInvitation(active));
    });

    return () => {
      cancelled = true;
    };
  }, [authToken, dispatch, navigation]);

  const continueFlow = () => {
    if (!invitation || invitation.status === 'submitted') return;
    if (invitation.status === 'needs_info') {
      navigation.navigate(IDA_ROUTES.DOCUMENTS);
      return;
    }
    navigation.navigate(IDA_ROUTES.APPLICANT);
  };

  const canStart =
    invitation != null &&
    (invitation.status === 'pending' ||
      invitation.status === 'opened' ||
      invitation.status === 'needs_info');

  const title = invitation?.campaign.title?.trim() || IDA_DEFAULT.title;
  const description =
    invitation?.status === 'needs_info'
      ? 'Responders need a few more details for your Initial Disaster Assistance application.'
      : invitation?.campaign.description?.trim() || IDA_DEFAULT.description;

  return (
    <View style={styles.wrapper}>
      <ScreenWrapper contentContainerStyle={styles.content}>
        <AppText variant="h2" color={colors.primary} center style={styles.title}>
          {title}
        </AppText>

        <AppText variant="body" color={colors.textSecondary} center style={styles.intro}>
          {description}
        </AppText>

        <AppCard style={styles.disclaimer}>
          <AppText variant="label" color={colors.primary} style={styles.disclaimerTitle}>
            Please note
          </AppText>
          <AppText variant="bodySmall" color={colors.textSecondary} style={styles.disclaimerBody}>
            This starts the reimbursement process only. Allow a minimum of 3 days after the disaster
            for federal, state, and insurance entities to respond. A copy of your responses with a
            claim number will be emailed to the address on your Ready2Go profile.
          </AppText>
        </AppCard>
      </ScreenWrapper>

      <BottomButtonBar
        primaryTitle={invitation?.status === 'needs_info' ? 'ADD DETAILS' : 'CONTINUE'}
        onPrimaryPress={() => {
          if (canStart) continueFlow();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  title: { marginBottom: spacing.md, letterSpacing: 0.5 },
  intro: { marginBottom: spacing.xl, lineHeight: 22 },
  disclaimer: { marginTop: spacing.sm },
  disclaimerTitle: { marginBottom: spacing.sm },
  disclaimerBody: { lineHeight: 20 },
});
