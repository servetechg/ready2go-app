import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AppCheckbox } from '@/components/form/AppCheckbox';
import { AppInput } from '@/components/form/AppInput';
import { AppSelect } from '@/components/form/AppSelect';
import { FormLayout } from '@/components/layout/FormLayout';
import { US_STATES } from '@/constants/registration';
import { ONBOARDING_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { cancelRegistration, setAddress, setCurrentStep } from '@/redux/slices/registrationSlice';
import type { OnboardingStackParamList } from '@/types/navigation';
import { toBoolean } from '@/utils/coerce';
import { addressSchema, type AddressFormData } from '@/validations/registration.schemas';

type Nav = StackNavigationProp<
  OnboardingStackParamList,
  typeof ONBOARDING_ROUTES.STEP_ADDRESS
>;

export function StepAddressScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const address = useAppSelector((s) => s.registration.address);
  const isStarted = useAppSelector((s) => s.registration.isStarted);

  const { control, handleSubmit, setValue, watch } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      ...address,
      useCurrentLocation: toBoolean(address.useCurrentLocation),
    },
  });

  const onSubmit = useCallback(
    (data: AddressFormData) => {
      dispatch(setAddress({ ...data, aptUnit: data.aptUnit ?? '' }));
      dispatch(setCurrentStep(2));
      navigation.navigate(ONBOARDING_ROUTES.STEP_HOUSEHOLD);
    },
    [dispatch, navigation],
  );

  const handleBack = () => {
    if (isStarted) {
      dispatch(cancelRegistration());
    }
  };

  return (
    <FormLayout
      stepNumber={1}
      icon="location"
      showBack={toBoolean(isStarted)}
      onBack={handleBack}
      onNext={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name="streetAddress"
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <AppInput
            label="Street Address"
            placeholder="Enter Your Street Address"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="aptUnit"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Apt / Unit (Optional)"
            placeholder="Enter Your Apt / Unit (Optional)"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />
      <Controller
        control={control}
        name="city"
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <AppInput
            label="City"
            placeholder="Enter Your City"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
          />
        )}
      />
      <View style={styles.row}>
        <Controller
          control={control}
          name="state"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <AppSelect
              label="State"
              value={value}
              options={US_STATES}
              onChange={onChange}
              placeholder="Select state"
              error={error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="zipCode"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <AppInput
              label="ZIP Code"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="number-pad"
              placeholder="Enter Your ZIP Code"
              error={error?.message}
              containerStyle={styles.zip}
            />
          )}
        />
      </View>
      <Controller
        control={control}
        name="useCurrentLocation"
        render={({ field: { value } }) => (
          <View style={styles.row}>
          <AppCheckbox
            label="Use My Current Location"
            checked={toBoolean(value)}
            onToggle={() =>
              setValue('useCurrentLocation', !toBoolean(value), { shouldValidate: true })
            }
          />
          </View>
        )}
      />
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  zip: { flex: 1, minWidth: 120 },
});
