import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';

import { AppInput } from '@/components/form/AppInput';
import { FormLayout } from '@/components/layout/FormLayout';
import {
  AddressPickerScreen,
  type AddressPickerValue,
} from '@/components/onboarding/AddressPickerScreen';
import { AppModal } from '@/components/ui/AppModal';
import { InfoLink } from '@/components/ui/InfoLink';
import { ADDRESS_WHY_MODAL } from '@/constants/registration';
import { ONBOARDING_ROUTES } from '@/constants/routes';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { cancelRegistration, setAddress, setCurrentStep } from '@/redux/slices/registrationSlice';
import type { OnboardingStackParamList } from '@/types/navigation';
import { toBoolean } from '@/utils/coerce';
import { pickAddressData } from '@/utils/registration';
import { addressSchema, type AddressFormData } from '@/validations/registration.schemas';

type Nav = StackNavigationProp<
  OnboardingStackParamList,
  typeof ONBOARDING_ROUTES.STEP_ADDRESS
>;

export function StepAddressScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const address = useAppSelector((s) => s.registration.address);
  const isStarted = useAppSelector((s) => s.registration.isStarted);
  const [showAddressWhyModal, setShowAddressWhyModal] = React.useState(false);

  const addressDefaults = pickAddressData(address);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: addressDefaults,
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
      (Object.entries(patch) as [keyof AddressFormData, AddressFormData[keyof AddressFormData]][]).forEach(
        ([key, val]) => {
          setValue(key, val, { shouldValidate: true, shouldDirty: true });
        },
      );
    },
    [setValue],
  );

  const onSubmit = useCallback(
    (data: AddressFormData) => {
      dispatch(setAddress(pickAddressData(data)));
      dispatch(setCurrentStep(2));
      navigation.navigate(ONBOARDING_ROUTES.STEP_ALERT_LOCATIONS);
    },
    [dispatch, navigation],
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