import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppInput } from '@/components/form/AppInput';
import { IdaDocumentFields, idaUploadMediaKind } from '@/components/ida/IdaDocumentFields';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomButtonBar } from '@/components/layout/BottomButtonBar';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import {
  IDA_DOCUMENT_KIND_IDS,
  type IdaDocumentKindId,
  type IdaMissingFieldId,
} from '@/constants/ida';
import { IDA_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { patchIdaDraft, setIdaClaimNumber, setIdaInvitation } from '@/redux/slices/idaSlice';
import {
  idaService,
  type IdaDocumentRef,
  type IdaLocalDocument,
  type IdaSubmitBody,
} from '@/services/ida.service';
import { spacing } from '@/theme';
import type { IdaStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<IdaStackParamList, typeof IDA_ROUTES.DOCUMENTS>;

function parseOptionalCount(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

export function IdaDocumentsScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const { showError } = useToast();
  const authToken = useAppSelector((s) => s.auth.token);
  const invitation = useAppSelector((s) => s.ida.invitation);
  const draft = useAppSelector((s) => s.ida.draft);
  const isSupplement = invitation?.status === 'needs_info';

  const requested = useMemo(
    () => new Set<IdaMissingFieldId>(invitation?.requestedMissingFields ?? []),
    [invitation?.requestedMissingFields],
  );

  const showDocuments =
    !isSupplement || requested.size === 0 || requested.has('documents');
  const showInsuranceCompany =
    isSupplement && (requested.size === 0 || requested.has('insurance_company'));
  const showCurrentLocation =
    isSupplement && (requested.size === 0 || requested.has('current_location'));

  const [documents, setDocuments] = useState<IdaLocalDocument[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const documentKinds: IdaDocumentKindId[] = useMemo(() => {
    if (!isSupplement || !showDocuments) return [...IDA_DOCUMENT_KIND_IDS];
    return [...IDA_DOCUMENT_KIND_IDS];
  }, [isSupplement, showDocuments]);

  const uploadAllDocuments = async (token: string): Promise<IdaDocumentRef[]> => {
    const uploaded: IdaDocumentRef[] = [];
    for (const doc of documents) {
      const media = await idaService.uploadMedia(token, idaUploadMediaKind(doc.kind), doc);
      uploaded.push({ ...media, kind: doc.kind });
    }
    return uploaded;
  };

  const buildSubmitBody = (uploaded: IdaDocumentRef[]): IdaSubmitBody => {
    if (!invitation) {
      throw new Error('Missing invitation');
    }
    if (
      !draft.housingDamage ||
      !draft.safeToLive ||
      !draft.livingSituation ||
      !draft.financialImpact
    ) {
      throw new Error('Please complete all required sections before submitting.');
    }

    const adults = parseOptionalCount(draft.adults);
    const children = parseOptionalCount(draft.children);
    const seniors = parseOptionalCount(draft.seniors);
    const householdSize =
      adults != null || children != null || seniors != null
        ? (adults ?? 0) + (children ?? 0) + (seniors ?? 0)
        : undefined;

    const applicantLat = invitation.prefill?.applicant?.lat;
    const applicantLng = invitation.prefill?.applicant?.lng;

    return {
      invitationId: invitation.invitationId,
      applicant: {
        ...(draft.dateOfBirth.trim() ? { dateOfBirth: draft.dateOfBirth.trim() } : {}),
        ...(draft.preferredLanguage.trim()
          ? { preferredLanguage: draft.preferredLanguage.trim() }
          : {}),
        ...(draft.preferredContactMethod.trim()
          ? { preferredContactMethod: draft.preferredContactMethod.trim() }
          : {}),
      },
      household: {
        ...(adults != null ? { adults } : {}),
        ...(children != null ? { children } : {}),
        ...(seniors != null ? { seniors } : {}),
        ...(householdSize != null ? { householdSize } : {}),
      },
      didEvacuate: draft.didEvacuate,
      currentLocation: draft.currentLocation.trim(),
      homeAccessible: draft.homeAccessible,
      housingDamage: draft.housingDamage,
      safeToLive: draft.safeToLive,
      livingSituation: draft.livingSituation,
      ...(draft.livingSituation === 'other'
        ? { livingSituationOther: draft.livingSituationOther.trim() }
        : {}),
      immediateNeeds: draft.immediateNeeds,
      ...(draft.immediateNeeds.includes('other')
        ? { immediateNeedsOther: draft.immediateNeedsOther.trim() }
        : {}),
      insuranceTypes: draft.insuranceTypes,
      ...(draft.insuranceCompany.trim()
        ? { insuranceCompany: draft.insuranceCompany.trim() }
        : {}),
      contactedInsurance: draft.contactedInsurance,
      financialImpact: draft.financialImpact,
      ...(uploaded.length ? { documents: uploaded } : {}),
      ...(typeof applicantLat === 'number' && Number.isFinite(applicantLat)
        ? { lat: applicantLat }
        : {}),
      ...(typeof applicantLng === 'number' && Number.isFinite(applicantLng)
        ? { lng: applicantLng }
        : {}),
    };
  };

  const handleSubmit = async () => {
    if (!authToken || !invitation) {
      showError('Application invitation expired. Please reopen from Settings or your notification.');
      return;
    }

    if (isSupplement) {
      const wantsDocs = showDocuments && documents.length > 0;
      const wantsCompany =
        showInsuranceCompany && draft.insuranceCompany.trim().length > 0;
      const wantsLocation =
        showCurrentLocation && draft.currentLocation.trim().length > 0;
      if (!wantsDocs && !wantsCompany && !wantsLocation) {
        showError('Add at least one of the requested missing details.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const uploaded = await uploadAllDocuments(authToken);

      if (isSupplement) {
        await idaService.supplement(authToken, {
          invitationId: invitation.invitationId,
          ...(showDocuments && uploaded.length ? { documents: uploaded } : {}),
          ...(showInsuranceCompany && draft.insuranceCompany.trim()
            ? { insuranceCompany: draft.insuranceCompany.trim() }
            : {}),
          ...(showCurrentLocation && draft.currentLocation.trim()
            ? { currentLocation: draft.currentLocation.trim() }
            : {}),
        });
        dispatch(setIdaClaimNumber(null));
      } else {
        const result = await idaService.submit(authToken, buildSubmitBody(uploaded));
        dispatch(setIdaClaimNumber(result.claimNumber));
      }

      dispatch(setIdaInvitation(null));
      navigation.replace(IDA_ROUTES.COMPLETE);
    } catch (error) {
      const reason = error instanceof Error ? error.message.trim() : '';
      showError(
        reason ||
          (isSupplement
            ? 'Failed to update application details. Please try again.'
            : 'Failed to submit application. Please try again.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScreenWrapper contentContainerStyle={styles.content}>
        <AppHeader showBack onBack={() => navigation.goBack()} />

        <AppText variant="h3" color={colors.primary} center style={styles.title}>
          {isSupplement ? 'ADD MISSING DETAILS' : 'SUPPORTING DOCUMENTS'}
        </AppText>
        <AppText variant="label" color={colors.textSecondary} center style={styles.subtitle}>
          {isSupplement
            ? 'Optional information requested by responders'
            : 'Section 10 · Optional — you can submit without documents'}
        </AppText>

        {isSupplement && invitation?.existingDocuments?.length ? (
          <AppText variant="bodySmall" color={colors.textSecondary} style={styles.existing}>
            Already on file: {invitation.existingDocuments.length} document
            {invitation.existingDocuments.length === 1 ? '' : 's'}
          </AppText>
        ) : null}

        {showCurrentLocation ? (
          <AppInput
            label="Current location"
            placeholder="Where are you staying now?"
            value={draft.currentLocation}
            onChangeText={(currentLocation) => dispatch(patchIdaDraft({ currentLocation }))}
            containerStyle={styles.field}
          />
        ) : null}

        {showInsuranceCompany ? (
          <AppInput
            label="Insurance company"
            placeholder="Company name"
            value={draft.insuranceCompany}
            onChangeText={(insuranceCompany) => dispatch(patchIdaDraft({ insuranceCompany }))}
            containerStyle={styles.field}
          />
        ) : null}

        {showDocuments ? (
          <IdaDocumentFields
            documents={documents}
            onChange={setDocuments}
            kinds={documentKinds}
          />
        ) : null}

        {!isSupplement ? (
          <AppText variant="bodySmall" color={colors.textSecondary} style={styles.footerHint}>
            Documents are optional. Damage photos: up to 5. Other document types: up to 2 each.
          </AppText>
        ) : null}
      </ScreenWrapper>

      <BottomButtonBar
        primaryTitle={isSupplement ? 'SUBMIT DETAILS' : 'SUBMIT APPLICATION'}
        onPrimaryPress={() => void handleSubmit()}
        primaryLoading={submitting}
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
  existing: { marginBottom: spacing.md },
  field: { marginBottom: spacing.md },
  footerHint: { marginTop: spacing.xl, lineHeight: 20 },
});
