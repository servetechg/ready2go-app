import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppInput } from '@/components/form/AppInput';
import { IdaSelectOption } from '@/components/ida/IdaSelectOption';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomButtonBar } from '@/components/layout/BottomButtonBar';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { SimpleYesNoQuestion } from '@/components/profile/SimpleYesNoQuestion';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import {
  IDA_HOUSING_DAMAGE_IDS,
  IDA_HOUSING_DAMAGE_LABELS,
  IDA_LIVING_SITUATION_IDS,
  IDA_LIVING_SITUATION_LABELS,
  IDA_SAFE_TO_LIVE_IDS,
  IDA_SAFE_TO_LIVE_LABELS,
  type IdaHousingDamageId,
  type IdaLivingSituationId,
  type IdaSafeToLiveId,
} from '@/constants/ida';
import { IDA_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { patchIdaDraft } from '@/redux/slices/idaSlice';
import { spacing } from '@/theme';
import type { IdaStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<IdaStackParamList, typeof IDA_ROUTES.DISASTER_HOUSING>;

export function IdaDisasterHousingScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const { showError } = useToast();
  const invitation = useAppSelector((s) => s.ida.invitation);
  const draft = useAppSelector((s) => s.ida.draft);

  const disaster = invitation?.prefill?.disaster;
  const disasterType =
    disaster?.disasterType || invitation?.campaign.disasterType || '—';
  const disasterDate =
    disaster?.dateOfImpact || invitation?.campaign.disasterDate || '—';

  const handleContinue = () => {
    if (draft.didEvacuate == null) {
      showError('Please indicate whether you evacuated.');
      return;
    }
    if (!draft.currentLocation.trim()) {
      showError('Please enter your current location.');
      return;
    }
    if (draft.homeAccessible == null) {
      showError('Please indicate whether your home is accessible.');
      return;
    }
    if (!draft.housingDamage) {
      showError('Please select housing damage level.');
      return;
    }
    if (!draft.safeToLive) {
      showError('Please select whether it is safe to live there.');
      return;
    }
    if (!draft.livingSituation) {
      showError('Please select your current living situation.');
      return;
    }
    if (draft.livingSituation === 'other' && !draft.livingSituationOther.trim()) {
      showError('Please describe your living situation.');
      return;
    }
    navigation.navigate(IDA_ROUTES.NEEDS_INSURANCE);
  };

  return (
    <View style={styles.wrapper}>
      <ScreenWrapper contentContainerStyle={styles.content}>
        <AppHeader showBack onBack={() => navigation.goBack()} />

        <AppText variant="h3" color={colors.primary} center style={styles.title}>
          DISASTER & HOUSING
        </AppText>
        <AppText variant="label" color={colors.textSecondary} center style={styles.subtitle}>
          Sections 3–4
        </AppText>

        <AppCard style={styles.card}>
          <AppText variant="label" color={colors.primary} style={styles.sectionLabel}>
            3. Disaster
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            Type
          </AppText>
          <AppText variant="bodySmall" style={styles.readOnly}>
            {disasterType}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            Date of impact
          </AppText>
          <AppText variant="bodySmall">{disasterDate}</AppText>
        </AppCard>

        <SimpleYesNoQuestion
          question="Did you evacuate?"
          value={draft.didEvacuate}
          onChange={(didEvacuate) => dispatch(patchIdaDraft({ didEvacuate }))}
        />

        <AppInput
          label="Current location"
          placeholder="Where are you staying now?"
          value={draft.currentLocation}
          onChangeText={(currentLocation) => dispatch(patchIdaDraft({ currentLocation }))}
          containerStyle={styles.field}
        />

        <SimpleYesNoQuestion
          question="Is your home accessible?"
          value={draft.homeAccessible}
          onChange={(homeAccessible) => dispatch(patchIdaDraft({ homeAccessible }))}
        />

        <AppText variant="label" style={styles.groupLabel}>
          Housing damage
        </AppText>
        {IDA_HOUSING_DAMAGE_IDS.map((id) => (
          <IdaSelectOption
            key={id}
            label={IDA_HOUSING_DAMAGE_LABELS[id]}
            selected={draft.housingDamage === id}
            mode="radio"
            onPress={() =>
              dispatch(patchIdaDraft({ housingDamage: id as IdaHousingDamageId }))
            }
          />
        ))}

        <AppText variant="label" style={styles.groupLabel}>
          Safe to live there?
        </AppText>
        {IDA_SAFE_TO_LIVE_IDS.map((id) => (
          <IdaSelectOption
            key={id}
            label={IDA_SAFE_TO_LIVE_LABELS[id]}
            selected={draft.safeToLive === id}
            mode="radio"
            onPress={() => dispatch(patchIdaDraft({ safeToLive: id as IdaSafeToLiveId }))}
          />
        ))}

        <AppText variant="label" style={styles.groupLabel}>
          Current living situation
        </AppText>
        {IDA_LIVING_SITUATION_IDS.map((id) => (
          <IdaSelectOption
            key={id}
            label={IDA_LIVING_SITUATION_LABELS[id]}
            selected={draft.livingSituation === id}
            mode="radio"
            onPress={() =>
              dispatch(patchIdaDraft({ livingSituation: id as IdaLivingSituationId }))
            }
          />
        ))}

        {draft.livingSituation === 'other' ? (
          <AppInput
            label="Describe living situation"
            value={draft.livingSituationOther}
            onChangeText={(livingSituationOther) =>
              dispatch(patchIdaDraft({ livingSituationOther }))
            }
            containerStyle={styles.field}
          />
        ) : null}
      </ScreenWrapper>

      <BottomButtonBar primaryTitle="CONTINUE" onPrimaryPress={handleContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  title: { marginBottom: spacing.xs, marginTop: spacing.sm },
  subtitle: { marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  sectionLabel: { marginBottom: spacing.sm },
  readOnly: { marginBottom: spacing.sm },
  field: { marginTop: spacing.md },
  groupLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
});
