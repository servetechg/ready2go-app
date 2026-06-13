import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { ErrorMessage } from '@/components/common/ErrorMessage';
import { AppInput } from '@/components/form/AppInput';
import { AppSelect } from '@/components/form/AppSelect';
import { PlacesAddressAutocomplete } from '@/components/form/PlacesAddressAutocomplete';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { US_STATES } from '@/constants/registration';
import { useAppTheme } from '@/hooks/useAppTheme';
import { isPlacesSearchAvailable } from '@/services/places.service';
import { borderRadius, spacing } from '@/theme';
import type { AlertLocation } from '@/types/registration';
import { fieldErrorMessage } from '@/utils/form';

const locationFormSchema = z.object({
  label: z.string().min(1, 'Name is required'),
  streetAddress: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().optional(),
});

export type AddLocationFormData = z.infer<typeof locationFormSchema> & { id?: string };

interface AddLocationModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: AddLocationFormData) => void;
  /** When set, the modal opens in edit mode with fields prefilled. */
  editingLocation?: AlertLocation | null;
}

function emptyFormValues(): AddLocationFormData {
  return { label: '', streetAddress: '', city: '', state: '', zipCode: '' };
}

function valuesFromLocation(loc: AlertLocation): AddLocationFormData {
  return {
    id: loc.id,
    label: loc.label,
    streetAddress: loc.streetAddress ?? '',
    city: loc.city,
    state: loc.state,
    zipCode: loc.zipCode ?? '',
  };
}

export function AddLocationModal({
  visible,
  onClose,
  onSave,
  editingLocation = null,
}: AddLocationModalProps) {
  const { colors } = useAppTheme();
  const usePlacesSearch = isPlacesSearchAvailable() && Platform.OS !== 'web';
  const isEditing = Boolean(editingLocation);
  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AddLocationFormData>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: emptyFormValues(),
  });

  const streetAddress = watch('streetAddress');
  const city = watch('city');
  const state = watch('state');
  const zipCode = watch('zipCode');

  useEffect(() => {
    if (!visible) return;
    reset(editingLocation ? valuesFromLocation(editingLocation) : emptyFormValues());
  }, [visible, editingLocation, reset]);

  const handleClose = () => {
    reset(emptyFormValues());
    onClose();
  };

  const submit = (data: AddLocationFormData) => {
    onSave({
      ...data,
      id: editingLocation?.id ?? data.id,
      label: data.label.trim(),
      streetAddress: data.streetAddress?.trim() ?? '',
      city: data.city.trim(),
      zipCode: data.zipCode?.trim() ?? '',
    });
    reset(emptyFormValues());
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={handleClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHeader}>
            <AppText variant="h3">{isEditing ? 'Edit location' : 'Add another location'}</AppText>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Controller
              control={control}
              name="label"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <AppInput
                  label="Location name"
                  placeholder="e.g. Parents House"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={fieldErrorMessage(error)}
                />
              )}
            />
            <Controller
              control={control}
              name="streetAddress"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Street (optional)"
                  placeholder="Street address"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {usePlacesSearch ? (
              <>
                <PlacesAddressAutocomplete
                  label="Search address"
                  onPlaceSelected={(place) => {
                    setValue('streetAddress', place.streetAddress, { shouldValidate: true });
                    setValue('city', place.city, { shouldValidate: true });
                    setValue('state', place.state, { shouldValidate: true });
                    setValue('zipCode', place.zipCode, { shouldValidate: true });
                  }}
                  onClear={() => {
                    setValue('streetAddress', '', { shouldValidate: true });
                    setValue('city', '', { shouldValidate: true });
                    setValue('state', '', { shouldValidate: true });
                    setValue('zipCode', '', { shouldValidate: true });
                  }}
                />
                {streetAddress || city || state ? (
                  <AppText variant="bodySmall" color={colors.textSecondary} style={styles.preview}>
                    {[streetAddress, city, state, zipCode].filter(Boolean).join(', ')}
                  </AppText>
                ) : null}
                {errors.city?.message || errors.state?.message ? (
                  <ErrorMessage message={errors.city?.message ?? errors.state?.message ?? ''} />
                ) : null}
              </>
            ) : (
              <>
                <Controller
                  control={control}
                  name="city"
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <AppInput
                      label="City"
                      placeholder="City"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={fieldErrorMessage(error)}
                    />
                  )}
                />
                <View style={styles.row}>
                  <View style={styles.stateCol}>
                    <Controller
                      control={control}
                      name="state"
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <AppSelect
                          label="State"
                          value={value}
                          options={US_STATES}
                          onChange={onChange}
                          placeholder="State"
                          error={fieldErrorMessage(error)}
                          containerStyle={styles.select}
                        />
                      )}
                    />
                  </View>
                  <Controller
                    control={control}
                    name="zipCode"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <AppInput
                        label="ZIP (optional)"
                        placeholder="ZIP"
                        value={value ?? ''}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="number-pad"
                        containerStyle={styles.zip}
                      />
                    )}
                  />
                </View>
              </>
            )}
          </ScrollView>
          <AppButton
            title={isEditing ? 'SAVE CHANGES' : 'SAVE LOCATION'}
            onPress={handleSubmit(submit)}
            style={styles.saveBtn}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stateCol: { width: 108, flexShrink: 0 },
  select: { marginBottom: 0 },
  zip: { flex: 1, minWidth: 0 },
  preview: { marginBottom: spacing.sm },
  saveBtn: { marginTop: spacing.lg },
});
