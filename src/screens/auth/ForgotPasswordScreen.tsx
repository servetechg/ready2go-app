import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';

import { AppInput } from '@/components/form/AppInput';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AUTH_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { clearAuthError, forgotPassword } from '@/redux/slices/authSlice';
import type { AuthStackParamList } from '@/types/navigation';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/validations/auth.schemas';

type Nav = StackNavigationProp<AuthStackParamList, typeof AUTH_ROUTES.FORGOT_PASSWORD>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.auth);
  const { colors } = useAppTheme();
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
      showSuccess('If an account exists, a code was sent to your email');
      navigation.navigate(AUTH_ROUTES.OTP_VERIFICATION, {
        email: data.email,
        flow: 'resetPassword',
      });
    } else {
      showError(error ?? 'Failed to send verification code');
    }
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email and we'll send you a verification code"
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
            placeholder="Enter Your Email"
            autoCapitalize="none"
            error={errors.email?.message}
          />
        )}
      />

      {error ? (
        <AppText variant="caption" color={colors.error} style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <AppButton title="SEND CODE" onPress={handleSubmit(onSubmit)} loading={!!isLoading} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  error: { marginBottom: 12 },
});
