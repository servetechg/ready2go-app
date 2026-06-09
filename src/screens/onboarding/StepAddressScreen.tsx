import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';

import { AppInput } from '@/components/form/AppInput';
import { FormLayout } from '@/components/layout/FormLayout';
import {
  AddressPickerScreen,
  type AddressPickerValue,
} from '@/components/onboarding/AddressPickerScreen';
import { AddressVerificationFields } from '@/components/profile/AddressVerificationFields';
import { AppModal } from '@/components/ui/AppModal';
import { InfoLink } from '@/components/ui/InfoLink';
import { ADDRESS_WHY_MODAL } from '@/constants/registration';
import { ONBOARDING_ROUTES } from '@/constants/routes';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  cancelRegistration,
  setAddress,
  setAddressVerification,
  setCurrentStep,
  setProofOfOwnership,
  setProofOfResidency,
} from '@/redux/slices/registrationSlice';
import type { OnboardingStackParamList } from '@/types/navigation';
import type { ProfileDocumentValue } from '@/types/profileDocument';
import { toBoolean } from '@/utils/coerce';
import { pickAddressData } from '@/utils/registration';
import { addressStepSchema, type AddressStepFormData } from '@/validations/registration.schemas';

type Nav = StackNavigationProp<
  OnboardingStackParamList,
  typeof ONBOARDING_ROUTES.STEP_ADDRESS
>;

export function StepAddressScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const registration = useAppSelector((s) => s.registration);
  const { address, isPrimaryAddress, allowResidenceInspection, proofOfOwnership, proofOfResidency } =
    registration;
  const isStarted = useAppSelector((s) => s.registration.isStarted);
  const [showAddressWhyModal, setShowAddressWhyModal] = useState(false);
  const [documentErrors, setDocumentErrors] = useState<{
    proofOfOwnership?: string;
    proofOfResidency?: string;
  }>({});
  const { showError } = useToast();

  const addressDefaults = {
    ...pickAddressData(address),
    isPrimaryAddress,
    allowResidenceInspection,
  };

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressStepFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(addressStepSchema as any),
    defaultValues: addressDefaults as AddressStepFormData,
  });

  const pickerValue: AddressPickerValue = {
    streetAddress: watch('streetAddress') ?? '',
    city: watch('city') ?? '',
    state: watch('state') ?? '',
    zipCode: watch('zipCode') ?? '',
    useCurrentLocation: watch('useCurrentLocation') ?? false,
    latitude: watch('latitude'),
    longitude: watch('longitude'),
  };

  const handleAddressChange = useCallback(
    (patch: Partial<AddressPickerValue>) => {
      (Object.entries(patch) as [keyof AddressStepFormData, AddressStepFormData[keyof AddressStepFormData]][]).forEach(
        ([key, val]) => {
          setValue(key, val, { shouldValidate: true, shouldDirty: true });
        },
      );
    },
    [setValue],
  );

  const onSubmit = useCallback(
    (data: AddressStepFormData) => {
      const nextDocErrors: typeof documentErrors = {};
      if (!proofOfOwnership) {
        nextDocErrors.proofOfOwnership = 'Upload proof of ownership';
      }
      if (!proofOfResidency) {
        nextDocErrors.proofOfResidency = 'Upload proof of residency';
      }
      if (Object.keys(nextDocErrors).length > 0) {
        setDocumentErrors(nextDocErrors);
        showError('Please upload both required documents');
        return;
      }
      setDocumentErrors({});

      dispatch(setAddress(pickAddressData(data)));
      dispatch(
        setAddressVerification({
          isPrimaryAddress: data.isPrimaryAddress,
          allowResidenceInspection: data.allowResidenceInspection,
        }),
      );
      dispatch(setCurrentStep(2));
      navigation.navigate(ONBOARDING_ROUTES.STEP_ALERT_LOCATIONS);
    },
    [dispatch, navigation, proofOfOwnership, proofOfResidency, showError],
  );

  const handleBack = () => {
    if (isStarted) {
      dispatch(cancelRegistration());
    }
  };

  return (
    <>
      <FormLayout
        stepNumber={1}
        icon="location"
        showBack={toBoolean(isStarted)}
        onBack={handleBack}
        onNext={handleSubmit(onSubmit)}
        nestedScrollEnabled>
        <InfoLink onPress={() => setShowAddressWhyModal(true)} />
        <AddressPickerScreen
          value={pickerValue}
          onChange={handleAddressChange}
          errors={{
            streetAddress: errors.streetAddress?.message,
            city: errors.city?.message,
            state: errors.state?.message,
            zipCode: errors.zipCode?.message,
          }}
        />
        <AppInput
          label="Apt / Unit (Optional)"
          placeholder="Enter Your Apt / Unit (Optional)"
          value={watch('aptUnit') ?? ''}
          onChangeText={(aptUnit) => setValue('aptUnit', aptUnit, { shouldDirty: true })}
        />
        <AddressVerificationFields
              isPrimaryAddress={watch('isPrimaryAddress')}
              allowResidenceInspection={watch('allowResidenceInspection')}
              proofOfOwnership={proofOfOwnership}
              proofOfResidency={proofOfResidency}
              onIsPrimaryAddressChange={(next) => {
                setValue('isPrimaryAddress', next, { shouldValidate: true });
                dispatch(setAddressVerification({ isPrimaryAddress: next }));
              }}
              onAllowInspectionChange={(next) => {
                setValue('allowResidenceInspection', next, { shouldValidate: true });
                dispatch(setAddressVerification({ allowResidenceInspection: next }));
              }}
              onProofOfOwnershipChange={(next: ProfileDocumentValue | null) => {
                dispatch(setProofOfOwnership(next));
                if (next) setDocumentErrors((prev) => ({ ...prev, proofOfOwnership: undefined }));
              }}
              onProofOfResidencyChange={(next: ProfileDocumentValue | null) => {
                dispatch(setProofOfResidency(next));
                if (next) setDocumentErrors((prev) => ({ ...prev, proofOfResidency: undefined }));
              }}
              errors={{
                isPrimaryAddress: errors.isPrimaryAddress?.message,
                allowResidenceInspection: errors.allowResidenceInspection?.message,
                ...documentErrors,
            }}
        />
      </FormLayout>
      <AppModal
        visible={showAddressWhyModal}
        title={ADDRESS_WHY_MODAL.title}
        message={ADDRESS_WHY_MODAL.message}
        onClose={() => setShowAddressWhyModal(false)}
      />
    </>
  );
}
