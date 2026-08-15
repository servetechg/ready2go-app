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
import { AppText } from '@/components/ui/AppText';
import {
  IDA_FINANCIAL_IMPACT_IDS,
  IDA_FINANCIAL_IMPACT_LABELS,
  IDA_IMMEDIATE_NEED_IDS,
  IDA_IMMEDIATE_NEED_LABELS,
  IDA_INSURANCE_TYPE_IDS,
  IDA_INSURANCE_TYPE_LABELS,
  type IdaFinancialImpactId,
  type IdaImmediateNeedId,
  type IdaInsuranceTypeId,
} from '@/constants/ida';
import { IDA_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { patchIdaDraft } from '@/redux/slices/idaSlice';
import { spacing } from '@/theme';
import type { IdaStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<IdaStackParamList, typeof IDA_ROUTES.NEEDS_INSURANCE>;

export function IdaNeedsInsuranceScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const { showError } = useToast();
  const draft = useAppSelector((s) => s.ida.draft);

  const toggleNeed = (id: IdaImmediateNeedId) => {
    const next = draft.immediateNeeds.includes(id)
      ? draft.immediateNeeds.filter((item) => item !== id)
      : [...draft.immediateNeeds, id];
    dispatch(patchIdaDraft({ immediateNeeds: next }));
  };

  const toggleInsurance = (id: IdaInsuranceTypeId) => {
    let next: IdaInsuranceTypeId[];
    if (id === 'none') {
      next = draft.insuranceTypes.includes('none') ? [] : ['none'];
    } else {
      next = draft.insuranceTypes.includes(id)
        ? draft.insuranceTypes.filter((item) => item !== id && item !== 'none')
        : [...draft.insuranceTypes.filter((item) => item !== 'none'), id];
    }
    dispatch(patchIdaDraft({ insuranceTypes: next }));
  };

  const handleContinue = () => {
    if (draft.immediateNeeds.length === 0) {
      showError('Select at least one immediate need.');
      return;
    }
    if (draft.immediateNeeds.includes('other') && !draft.immediateNeedsOther.trim()) {
      showError('Please describe your other immediate need.');
      return;
    }
    if (draft.insuranceTypes.length === 0) {
      showError('Select at least one insurance type (or None).');
      return;
    }
    if (!draft.financialImpact) {
      showError('Please select estimated financial impact.');
      return;
    }
    navigation.navigate(IDA_ROUTES.DOCUMENTS);
  };

  return (
    <View style={styles.wrapper}>
      <ScreenWrapper contentContainerStyle={styles.content}>
        <AppHeader showBack onBack={() => navigation.goBack()} />

        <AppText variant="h3" color={colors.primary} center style={styles.title}>
          NEEDS & INSURANCE
        </AppText>
        <AppText variant="label" color={colors.textSecondary} center style={styles.subtitle}>
          Sections 5–7 · Select all that apply
        </AppText>

        <AppText variant="label" style={styles.groupLabel}>
          5. Immediate needs
        </AppText>
        {IDA_IMMEDIATE_NEED_IDS.map((id) => (
          <IdaSelectOption
            key={id}
            label={IDA_IMMEDIATE_NEED_LABELS[id]}
            selected={draft.immediateNeeds.includes(id)}
            onPress={() => toggleNeed(id)}
          />
        ))}
        {draft.immediateNeeds.includes('other') ? (
          <AppInput
            label="Other needs"
            value={draft.immediateNeedsOther}
            onChangeText={(immediateNeedsOther) =>
              dispatch(patchIdaDraft({ immediateNeedsOther }))
            }
            containerStyle={styles.field}
          />
        ) : null}

        <AppText variant="label" style={styles.groupLabel}>
          6. Insurance
        </AppText>
        {IDA_INSURANCE_TYPE_IDS.map((id) => (
          <IdaSelectOption
            key={id}
            label={IDA_INSURANCE_TYPE_LABELS[id]}
            selected={draft.insuranceTypes.includes(id)}
            onPress={() => toggleInsurance(id)}
          />
        ))}

        <AppInput
          label="Insurance company (optional)"
          placeholder="Company name"
          value={draft.insuranceCompany}
          onChangeText={(insuranceCompany) => dispatch(patchIdaDraft({ insuranceCompany }))}
          containerStyle={styles.field}
        />

        <SimpleYesNoQuestion
          question="Have you contacted your insurance company?"
          value={draft.contactedInsurance}
          onChange={(contactedInsurance) => dispatch(patchIdaDraft({ contactedInsurance }))}
        />

        <AppText variant="label" style={styles.groupLabel}>
          7. Estimated financial impact
        </AppText>
        {IDA_FINANCIAL_IMPACT_IDS.map((id) => (
          <IdaSelectOption
            key={id}
            label={IDA_FINANCIAL_IMPACT_LABELS[id]}
            selected={draft.financialImpact === id}
            mode="radio"
            onPress={() =>
              dispatch(patchIdaDraft({ financialImpact: id as IdaFinancialImpactId }))
            }
          />
        ))}
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
  groupLabel: { marginTop: spacing.md, marginBottom: spacing.sm },
  field: { marginTop: spacing.md, marginBottom: spacing.sm },
});
