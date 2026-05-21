import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StyleSheet } from 'react-native';

import { AppInput } from '@/components/form/AppInput';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { clearAuthError, forgotPassword } from '@/redux/slices/authSlice';
import { useToast } from '@/hooks/useToast';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/validations/auth.schemas';

export function ForgotPasswordScreen() {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.auth);
  const { showSuccess, showError } = useToast();

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  React.useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    const result = await dispatch(forgotPassword(data));
    if (forgotPassword.fulfilled.match(result)) {
      showSuccess('Password reset link sent to your email');
    } else {
      showError(error ?? 'Failed to send reset link');
    }
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email and we'll send you a reset link"
      showLogo={false}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email?.message}
          />
        )}
      />

      {error ? (
        <AppText variant="caption" color="#D32F2F" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <AppButton title="SEND RESET LINK" onPress={handleSubmit(onSubmit)} loading={!!isLoading} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  error: { marginBottom: 12 },
});
