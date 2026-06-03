import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { AppInput } from '@/components/form/AppInput';
import { AppSelect } from '@/components/form/AppSelect';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { US_STATES } from '@/constants/registration';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, spacing } from '@/theme';
import { fieldErrorMessage } from '@/utils/form';

const addLocationSchema = z.object({
  label: z.string().min(1, 'Name is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().optional(),
});

export type AddLocationFormData = z.infer<typeof addLocationSchema>;

interface AddLocationModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: AddLocationFormData) => void;
}

export function AddLocationModal({ visible, onClose, onSave }: AddLocationModalProps) {
  const { colors } = useAppTheme();
  const { control, handleSubmit, reset } = useForm<AddLocationFormData>({
    resolver: zodResolver(addLocationSchema),
    defaultValues: { label: '', city: '', state: '', zipCode: '' },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = (data: AddLocationFormData) => {
    onSave(data);
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={handleClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHeader}>
            <AppText variant="h3">Add another location</AppText>
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
          </ScrollView>
          <AppButton title="SAVE LOCATION" onPress={handleSubmit(submit)} style={styles.saveBtn} />
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
  saveBtn: { marginTop: spacing.lg },
});
