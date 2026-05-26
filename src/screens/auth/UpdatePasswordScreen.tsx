import { zodResolver } from '@hookform/resolvers/zod';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
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
import { clearAuthError, clearPasswordReset, resetPassword } from '@/redux/slices/authSlice';
import { spacing } from '@/theme';
import type { AuthStackParamList } from '@/types/navigation';
import { toBoolean } from '@/utils/coerce';
import { updatePasswordSchema, type UpdatePasswordFormData } from '@/validations/auth.schemas';

type Nav = StackNavigationProp<AuthStackParamList, typeof AUTH_ROUTES.UPDATE_PASSWORD>;
type Route = RouteProp<AuthStackParamList, typeof AUTH_ROUTES.UPDATE_PASSWORD>;

export function UpdatePasswordScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const dispatch = useAppDispatch();
  const { isLoading, error, passwordResetToken, passwordResetVerified } = useAppSelector(
    (s) => s.auth,
  );
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useToast();

  const email = route.params.email;

  const { control, handleSubmit, formState: { errors } } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  React.useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  React.useEffect(() => {
    if (!passwordResetVerified || !passwordResetToken) {
      showError('Please verify your code before updating your password');
      navigation.navigate(AUTH_ROUTES.FORGOT_PASSWORD);
    }
  }, [navigation, passwordResetToken, passwordResetVerified, showError]);

  const onSubmit = async (data: UpdatePasswordFormData) => {
    if (!passwordResetToken) return;

    const result = await dispatch(
      resetPassword({
        resetToken: passwordResetToken,
        password: data.password,
        confirmPassword: data.confirmPassword,
      }),
    );
    if (!resetPassword.fulfilled.match(result)) return;

    dispatch(clearPasswordReset());
    showSuccess('Password updated successfully');
    navigation.reset({
      index: 0,
      routes: [{ name: AUTH_ROUTES.LOGIN }],
    });
  };

  return (
    <AuthLayout
      title="Update Password"
      subtitle="Create a new password for your account"
      showLogo={false}>
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="New Password"
            placeholder="Enter Your New Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry={true}
            error={errors.password?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Confirm Password"
            placeholder="Confirm Your New Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry={true}
            error={errors.confirmPassword?.message}
          />
        )}
      />

      {error ? (
        <AppText variant="caption" color={colors.error} style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <AppButton
        title={isLoading ? 'Updating...' : 'UPDATE PASSWORD'}
        onPress={handleSubmit(onSubmit)}
        loading={toBoolean(isLoading)}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  error: { marginBottom: spacing.sm },
});
