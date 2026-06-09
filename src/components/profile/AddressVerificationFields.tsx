import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ProfileDocumentPicker } from '@/components/profile/ProfileDocumentPicker';
import { SimpleYesNoQuestion } from '@/components/profile/SimpleYesNoQuestion';
import { spacing } from '@/theme';
import type { LocalProfileDocument, ProfileDocumentValue } from '@/types/profileDocument';

type AddressVerificationFieldsProps = {
  isPrimaryAddress: boolean | null;
  allowResidenceInspection: boolean | null;
  proofOfOwnership: ProfileDocumentValue | null;
  proofOfResidency: ProfileDocumentValue | null;
  onIsPrimaryAddressChange: (value: boolean) => void;
  onAllowInspectionChange: (value: boolean) => void;
  onProofOfOwnershipChange: (value: ProfileDocumentValue | null) => void;
  onProofOfResidencyChange: (value: ProfileDocumentValue | null) => void;
  onUploadOwnership?: (file: LocalProfileDocument) => Promise<ProfileDocumentValue | null>;
  onUploadResidency?: (file: LocalProfileDocument) => Promise<ProfileDocumentValue | null>;
  errors?: {
    isPrimaryAddress?: string;
    allowResidenceInspection?: string;
    proofOfOwnership?: string;
    proofOfResidency?: string;
  };
};

export function AddressVerificationFields({
  isPrimaryAddress,
  allowResidenceInspection,
  proofOfOwnership,
  proofOfResidency,
  onIsPrimaryAddressChange,
  onAllowInspectionChange,
  onProofOfOwnershipChange,
  onProofOfResidencyChange,
  onUploadOwnership,
  onUploadResidency,
  errors,
}: AddressVerificationFieldsProps) {
  return (
    <View style={styles.container}>
      <SimpleYesNoQuestion
        question="Is this your primary address?"
        value={isPrimaryAddress}
        onChange={onIsPrimaryAddressChange}
        error={errors?.isPrimaryAddress}
      />
      <SimpleYesNoQuestion
        question="Do you allow the residence to be inspected?"
        value={allowResidenceInspection}
        onChange={onAllowInspectionChange}
        error={errors?.allowResidenceInspection}
      />
      <ProfileDocumentPicker
        kind="ownership"
        label="Proof of ownership"
        hint="Mortgage statement, deed, and/or title (PDF or photo)"
        value={proofOfOwnership}
        onChange={onProofOfOwnershipChange}
        onUpload={onUploadOwnership}
        error={errors?.proofOfOwnership}
      />
      <ProfileDocumentPicker
        kind="residency"
        label="Proof of residency"
        hint="Utility bill (PDF or photo)"
        value={proofOfResidency}
        onChange={onProofOfResidencyChange}
        onUpload={onUploadResidency}
        error={errors?.proofOfResidency}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
});
