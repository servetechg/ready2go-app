import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { HeroBanner } from '@/components/ui/HeroBanner';
import { AUTH_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppDispatch } from '@/redux/hooks';
import { startRegistration } from '@/redux/slices/registrationSlice';
import { borderRadius, spacing } from '@/theme';
import type { AuthStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<AuthStackParamList, typeof AUTH_ROUTES.WELCOME>;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();

  const handleGetStarted = () => {
    dispatch(startRegistration());
  };

  return (
    <ScreenWrapper>
      <HeroBanner compact={true} />

      <View style={styles.body}>
        <AppText variant="h2" center={true}>
          Create Your Account
        </AppText>
        <AppText variant="body" color={colors.textSecondary} center={true} style={styles.desc}>
          Your information helps us get you the right assistance when you need it.
        </AppText>

        <AppButton title="GET STARTED" onPress={handleGetStarted} />
        <AppButton
          title="I ALREADY HAVE AN ACCOUNT"
          variant="outline"
          onPress={() => navigation.navigate(AUTH_ROUTES.LOGIN)}
          style={styles.secondaryBtn}
        />

        <AppCard style={{ ...styles.trustCard, backgroundColor: colors.accent }} padded={true}>
          <View style={styles.trustRow}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <AppText variant="bodySmall" color={colors.textSecondary} style={styles.trustText}>
              Your information is secure and only used to help you during emergencies.
            </AppText>
          </View>
        </AppCard>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  heroImage: {
    width: '100%',
    height: 160,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  body: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  desc: { marginBottom: spacing.lg },
  secondaryBtn: { marginTop: spacing.sm },
  trustCard: { marginTop: spacing.xl },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  trustText: { flex: 1 },
});
