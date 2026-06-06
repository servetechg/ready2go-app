import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AddLocationModal, type AddLocationFormData } from '@/components/onboarding/AddLocationModal';
import { BottomButtonBar } from '@/components/layout/BottomButtonBar';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import { ONBOARDING_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setAlertLocations, setCurrentStep } from '@/redux/slices/registrationSlice';
import { borderRadius, palette, shadows, spacing } from '@/theme';
import type { OnboardingStackParamList } from '@/types/navigation';
import type { AlertLocation } from '@/types/registration';
import { formatAddressLine } from '@/utils/formatAddress';

type Nav = StackNavigationProp<
  OnboardingStackParamList,
  typeof ONBOARDING_ROUTES.STEP_ALERT_LOCATIONS
>;

function newLocationId() {
  return `loc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatOtherLocationLine(loc: AlertLocation): string {
  return [loc.streetAddress, loc.city, loc.state, loc.zipCode].filter(Boolean).join(', ');
}

export function StepAlertLocationsScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const address = useAppSelector((s) => s.registration.address);
  const alertLocations = useAppSelector((s) => s.registration.alertLocations);
  const [modalVisible, setModalVisible] = useState(false);

  const primaryLine = formatAddressLine(address);

  const goNext = () => {
    dispatch(setCurrentStep(3));
    navigation.navigate(ONBOARDING_ROUTES.STEP_HOUSEHOLD);
  };

  const handleBack = () => {
    dispatch(setCurrentStep(1));
    navigation.navigate(ONBOARDING_ROUTES.STEP_ADDRESS);
  };

  const handleSkip = () => {
    dispatch(setAlertLocations([]));
    goNext();
  };

  const handleSaveLocation = (data: AddLocationFormData) => {
    dispatch(
      setAlertLocations([
        ...alertLocations,
        {
          id: newLocationId(),
          label: data.label.trim(),
          streetAddress: data.streetAddress?.trim() ?? '',
          city: data.city.trim(),
          state: data.state,
          zipCode: data.zipCode?.trim() ?? '',
        },
      ]),
    );
  };

  const removeLocation = (id: string) => {
    dispatch(setAlertLocations(alertLocations.filter((loc) => loc.id !== id)));
  };

  return (
    <View style={styles.wrapper}>
      <ScreenWrapper contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={12} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={24} color={palette.primary} />
          </Pressable>
          <AppText variant="h3" style={styles.headerTitle}>
            Add Locations
          </AppText>
          <Pressable onPress={handleSkip} hitSlop={8} accessibilityLabel="Skip">
            <AppText variant="label" color={colors.primary}>
              Skip
            </AppText>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcons}>
            <View style={[styles.heroIconCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="home" size={22} color={palette.white} />
            </View>
            <View style={styles.heroLine} />
            <View style={[styles.heroIconCircle, { backgroundColor: colors.accent }]}>
              <Ionicons name="location" size={22} color={colors.primary} />
            </View>
          </View>
          <AppText variant="h2" center={true} style={styles.heroTitle}>
            Stay Informed for the Places That Matter
          </AppText>
          <AppText variant="body" color={colors.textSecondary} center={true}>
            Add other locations you&apos;d like to receive alerts for. You can add family, vacation
            homes, or anywhere important to you.
          </AppText>
        </View>

        <AppText variant="caption" color={colors.textMuted} style={styles.sectionLabel}>
          Primary Location
        </AppText>
        <View style={[styles.locationCard, shadows.sm, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="home" size={20} color={palette.white} />
          </View>
          <View style={styles.cardText}>
            <AppText variant="label">Home</AppText>
            <AppText variant="bodySmall" color={colors.textSecondary} numberOfLines={2}>
              {primaryLine}
            </AppText>
          </View>
          <Ionicons name="checkmark-circle" size={26} color={colors.primary} />
        </View>

        <AppText variant="caption" color={colors.textMuted} style={styles.sectionLabel}>
          Other Locations (Optional)
        </AppText>

        {alertLocations.map((loc) => (
          <View
            key={loc.id}
            style={[styles.locationCard, shadows.sm, { backgroundColor: colors.surface }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
              <Ionicons name="home-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.cardText}>
              <AppText variant="label">{loc.label}</AppText>
              <AppText variant="bodySmall" color={colors.textSecondary}>
                {formatOtherLocationLine(loc)}
              </AppText>
            </View>
            <Pressable
              onPress={() => removeLocation(loc.id)}
              hitSlop={8}
              accessibilityLabel={`Remove ${loc.label}`}>
              <Ionicons name="trash-outline" size={22} color={colors.textMuted} />
            </Pressable>
          </View>
        ))}

        <Pressable
          style={[styles.addBtn, { borderColor: colors.primary, backgroundColor: colors.accent }]}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button">
          <Ionicons name="add" size={22} color={colors.primary} />
          <AppText variant="label" color={colors.primary}>
            Add Another Location
          </AppText>
        </Pressable>
      </ScreenWrapper>

      <BottomButtonBar primaryTitle="Continue" onPrimaryPress={goNext} />

      <AddLocationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  headerTitle: { flex: 1, textAlign: 'center' },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  heroIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  heroIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLine: {
    width: 48,
    height: 2,
    backgroundColor: palette.border,
  },
  heroTitle: { marginTop: spacing.sm },
  sectionLabel: {
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: spacing.xs },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});
