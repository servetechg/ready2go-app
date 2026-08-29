import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AppInput } from '@/components/form/AppInput';
import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { MAIN_STACK_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { useAppSelector } from '@/redux/hooks';
import { profileService } from '@/services/profile.service';
import { spacing } from '@/theme';
import type { MainStackParamList } from '@/types/navigation';
import { asTokenString } from '@/utils/authSessionStorage';
import { getErrorMessage } from '@/utils/error';
import { changePasswordSchema, type ChangePasswordFormData } from '@/validations/auth.schemas';

type Nav = StackNavigationProp<MainStackParamList, typeof MAIN_STACK_ROUTES.CHANGE_PASSWORD>;

export function ChangePasswordScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useToast();
  const token = useAppSelector((s) => asTokenString(s.auth.token));

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      await profileService.updatePassword(token, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      showSuccess('Password updated successfully');
      navigation.goBack();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update password'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <AppHeader title="Change Password" showBack onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <AppText variant="body" color={colors.textSecondary} style={styles.subtitle}>
          Enter your current password and a new password to secure your account.
        </AppText>

        <Controller
          control={control}
          name="currentPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Current Password"
              placeholder="Enter current password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              error={errors.currentPassword?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="New Password"
              placeholder="Enter new password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              error={errors.newPassword?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmNewPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Confirm New Password"
              placeholder="Confirm new password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              error={errors.confirmNewPassword?.message}
            />
          )}
        />

        {error ? (
          <AppText variant="caption" color={colors.error} style={styles.error}>
            {error}
          </AppText>
        ) : null}

        <AppButton
          title={isLoading ? 'Updating...' : 'Change Password'}
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          style={styles.button}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  subtitle: {
    marginBottom: spacing.xl,
  },
  error: {
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.md,
  },
});
