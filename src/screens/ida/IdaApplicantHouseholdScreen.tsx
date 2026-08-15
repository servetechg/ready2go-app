import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppInput } from '@/components/form/AppInput';
import { IdaDatePickerField } from '@/components/ida/IdaDatePickerField';
import { IdaLanguageDropdown } from '@/components/ida/IdaLanguageDropdown';
import { IdaSelectOption } from '@/components/ida/IdaSelectOption';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomButtonBar } from '@/components/layout/BottomButtonBar';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { IDA_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { patchIdaDraft, setIdaInvitation } from '@/redux/slices/idaSlice';
import { idaService } from '@/services/ida.service';
import { spacing } from '@/theme';
import type { IdaStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<IdaStackParamList, typeof IDA_ROUTES.APPLICANT>;

const CONTACT_OPTIONS = ['Email', 'Phone', 'SMS'] as const;

function normalizeContact(value?: string | null): string {
  const next = String(value ?? '').trim();
  return CONTACT_OPTIONS.includes(next as (typeof CONTACT_OPTIONS)[number]) ? next : '';
}

function PrefillRow({ label, value }: { label: string; value?: string | null }) {
  const { colors } = useAppTheme();
  const display = value?.trim() ? value : '—';
  return (
    <View style={styles.prefillRow}>
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
      <AppText variant="bodySmall" color={colors.text}>
        {display}
      </AppText>
    </View>
  );
}

function EditablePrefillRow({
  label,
  value,
  editing,
  onToggleEdit,
  children,
}: {
  label: string;
  value?: string | null;
  editing: boolean;
  onToggleEdit: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  const display = value?.trim() ? value : '—';

  return (
    <View style={styles.prefillRow}>
      <View style={styles.editableHeader}>
        <AppText variant="caption" color={colors.textMuted}>
          {label}
        </AppText>
        <Pressable onPress={onToggleEdit} hitSlop={8} accessibilityRole="button">
          <AppText variant="caption" color={colors.primary}>
            {editing ? 'Done' : 'Edit'}
          </AppText>
        </Pressable>
      </View>
      {editing ? (
        children
      ) : (
        <AppText variant="bodySmall" color={colors.text}>
          {display}
        </AppText>
      )}
    </View>
  );
}

export function IdaApplicantHouseholdScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const { showError } = useToast();
  const authToken = useAppSelector((s) => s.auth.token);
  const invitation = useAppSelector((s) => s.ida.invitation);
  const draft = useAppSelector((s) => s.ida.draft);
  const [opening, setOpening] = useState(false);
  const [editing, setEditing] = useState({
    dateOfBirth: false,
    preferredContact: false,
    preferredLanguage: false,
  });

  const applicant = invitation?.prefill?.applicant;
  const household = invitation?.prefill?.household;

  const dobValue = draft.dateOfBirth || applicant?.dateOfBirth || '';
  const contactValue = normalizeContact(
    draft.preferredContactMethod || applicant?.preferredContactMethod,
  );
  const languageValue = draft.preferredLanguage || applicant?.preferredLanguage || '';

  const handleContinue = async () => {
    if (!invitation || !authToken) {
      showError('Application invitation expired. Please reopen from Settings or your notification.');
      return;
    }

    dispatch(
      patchIdaDraft({
        adults: draft.adults,
        children: draft.children,
        seniors: draft.seniors,
        dateOfBirth: dobValue,
        preferredContactMethod: contactValue,
        preferredLanguage: languageValue,
      }),
    );

    setOpening(true);
    try {
      if (invitation.status === 'pending') {
        await idaService.markOpened(authToken, invitation.invitationId);
        dispatch(setIdaInvitation({ ...invitation, status: 'opened' }));
      }
      navigation.navigate(IDA_ROUTES.DISASTER_HOUSING);
    } catch (error) {
      const reason = error instanceof Error ? error.message.trim() : '';
      showError(reason || 'Could not open application. Please try again.');
    } finally {
      setOpening(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScreenWrapper contentContainerStyle={styles.content}>
        <AppHeader showBack onBack={() => navigation.goBack()} />

        <AppText variant="h3" color={colors.primary} center style={styles.title}>
          APPLICANT & HOUSEHOLD
        </AppText>
        <AppText variant="label" color={colors.textSecondary} center style={styles.subtitle}>
          Sections 1–2 · Confirm your profile details
        </AppText>

        <AppCard style={styles.card}>
          <AppText variant="label" color={colors.primary} style={styles.sectionLabel}>
            1. Applicant
          </AppText>
          <PrefillRow label="Full name" value={applicant?.fullName} />
          <EditablePrefillRow
            label="Date of birth"
            value={dobValue}
            editing={editing.dateOfBirth}
            onToggleEdit={() =>
              setEditing((prev) => ({ ...prev, dateOfBirth: !prev.dateOfBirth }))
            }
          >
            <IdaDatePickerField
              value={dobValue}
              onChange={(dateOfBirth) => dispatch(patchIdaDraft({ dateOfBirth }))}
            />
          </EditablePrefillRow>
          <PrefillRow label="Phone" value={applicant?.phoneNumber} />
          <PrefillRow label="Email" value={applicant?.email} />
          <EditablePrefillRow
            label="Preferred contact"
            value={contactValue}
            editing={editing.preferredContact}
            onToggleEdit={() =>
              setEditing((prev) => ({ ...prev, preferredContact: !prev.preferredContact }))
            }
          >
            <View style={styles.optionList}>
              {CONTACT_OPTIONS.map((option) => (
                <IdaSelectOption
                  key={option}
                  label={option}
                  mode="radio"
                  selected={contactValue === option}
                  onPress={() => dispatch(patchIdaDraft({ preferredContactMethod: option }))}
                />
              ))}
            </View>
          </EditablePrefillRow>
          <EditablePrefillRow
            label="Language"
            value={languageValue}
            editing={editing.preferredLanguage}
            onToggleEdit={() =>
              setEditing((prev) => ({ ...prev, preferredLanguage: !prev.preferredLanguage }))
            }
          >
            <IdaLanguageDropdown
              value={languageValue}
              onChange={(preferredLanguage) =>
                dispatch(patchIdaDraft({ preferredLanguage }))
              }
            />
          </EditablePrefillRow>
        </AppCard>

        <AppCard style={styles.card}>
          <AppText variant="label" color={colors.primary} style={styles.sectionLabel}>
            2. Household
          </AppText>
          <PrefillRow label="Affected address" value={household?.disasterAffectedAddress} />
          <PrefillRow
            label="Primary residence"
            value={
              household?.isPrimaryResidence == null
                ? undefined
                : household.isPrimaryResidence
                  ? 'Yes'
                  : 'No'
            }
          />
          <PrefillRow
            label="Household size"
            value={household?.householdSize != null ? String(household.householdSize) : undefined}
          />
          <PrefillRow label="Access needs" value={household?.disabilitiesOrAccessNeeds} />
          <PrefillRow
            label="Electricity-dependent medical"
            value={household?.electricityDependentMedical}
          />
          <PrefillRow label="Pets / livestock" value={household?.petsOrLivestock} />
        </AppCard>

        <AppText variant="bodySmall" color={colors.textSecondary} style={styles.hint}>
          Update household counts if missing or incorrect:
        </AppText>
        <AppInput
          label="Adults"
          value={draft.adults}
          onChangeText={(adults) => dispatch(patchIdaDraft({ adults }))}
          keyboardType="number-pad"
          placeholder="Number of adults"
        />
        <AppInput
          label="Children"
          value={draft.children}
          onChangeText={(children) => dispatch(patchIdaDraft({ children }))}
          keyboardType="number-pad"
          placeholder="Number of children"
          containerStyle={styles.field}
        />
        <AppInput
          label="Seniors"
          value={draft.seniors}
          onChangeText={(seniors) => dispatch(patchIdaDraft({ seniors }))}
          keyboardType="number-pad"
          placeholder="Number of seniors"
          containerStyle={styles.field}
        />
      </ScreenWrapper>

      <BottomButtonBar
        primaryTitle="CONTINUE"
        onPrimaryPress={() => void handleContinue()}
        primaryLoading={opening}
      />
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
  prefillRow: { marginBottom: spacing.sm },
  editableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionList: { marginTop: spacing.xs },
  hint: { marginBottom: spacing.md, marginTop: spacing.sm },
  field: { marginTop: spacing.md },
});
