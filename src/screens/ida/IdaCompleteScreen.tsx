import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomButtonBar } from '@/components/layout/BottomButtonBar';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { IDA_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { dismissToHomeTabs } from '@/navigation/navigationHelpers';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { clearIda } from '@/redux/slices/idaSlice';
import { spacing } from '@/theme';
import type { IdaStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<IdaStackParamList, typeof IDA_ROUTES.COMPLETE>;

export function IdaCompleteScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const claimNumber = useAppSelector((s) => s.ida.claimNumber);

  const goHome = () => {
    dispatch(clearIda());
    requestAnimationFrame(() => {
      dismissToHomeTabs(navigation);
    });
  };

  return (
    <View style={styles.wrapper}>
      <ScreenWrapper contentContainerStyle={styles.content}>
        <AppText variant="h2" color={colors.primary} center style={styles.title}>
          Thank you
        </AppText>
        <AppText variant="body" color={colors.textSecondary} center style={styles.body}>
          {claimNumber
            ? 'Your Initial Disaster Assistance application has been submitted.'
            : 'Your additional information has been submitted.'}
        </AppText>

        {claimNumber ? (
          <AppCard style={styles.claimCard}>
            <AppText variant="caption" color={colors.textMuted} center>
              Claim number
            </AppText>
            <AppText variant="h3" color={colors.primary} center style={styles.claim}>
              {claimNumber}
            </AppText>
            <AppText variant="bodySmall" color={colors.textSecondary} center style={styles.emailNote}>
              A copy of your responses was sent to your Ready2Go email address.
            </AppText>
          </AppCard>
        ) : null}
      </ScreenWrapper>

      <BottomButtonBar primaryTitle="GO HOME" onPrimaryPress={goHome} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
    justifyContent: 'center',
  },
  title: { marginBottom: spacing.md },
  body: { marginBottom: spacing.xl, lineHeight: 22 },
  claimCard: { marginTop: spacing.md },
  claim: { marginTop: spacing.sm, letterSpacing: 0.5 },
  emailNote: { marginTop: spacing.md, lineHeight: 20 },
});
