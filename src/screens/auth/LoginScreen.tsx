import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppInput } from '@/components/form/AppInput';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { HeroBanner } from '@/components/ui/HeroBanner';
import { AUTH_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { clearAuthError, loginUser, sendOtp } from '@/redux/slices/authSlice';
import { fontFamily, spacing } from '@/theme';
import type { AuthStackParamList } from '@/types/navigation';
import { toBoolean } from '@/utils/coerce';
import { loginSchema, type LoginFormData } from '@/validations/auth.schemas';

type Nav = StackNavigationProp<AuthStackParamList, typeof AUTH_ROUTES.LOGIN>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.auth);
  const { colors } = useAppTheme();
  const { showSuccess } = useToast();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  React.useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const onSubmit = async (data: LoginFormData) => {
    const result = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(result)) {
      showSuccess('Welcome back!');
      return;
    }

    const payload = result.payload;
    if (
      payload &&
      typeof payload === 'object' &&
      'code' in payload &&
      payload.code === 'EMAIL_NOT_VERIFIED' &&
      payload.email
    ) {
      await dispatch(
        sendOtp({ email: payload.email, purpose: 'EMAIL_VERIFICATION' }),
      );
      navigation.navigate(AUTH_ROUTES.OTP_VERIFICATION, {
        email: payload.email,
        flow: 'signup',
      });
    }
  };

  return (
    <ScreenWrapper>
      <HeroBanner compact={true} />

      <View style={styles.form}>
        <AppText variant="h2" center={true}>
          Sign In
        </AppText>
        <AppText variant="body" color={colors.textSecondary} center={true} style={styles.subtitle}>
          Access your emergency profile
        </AppText>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Enter Your Email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Password"
              placeholder="Enter Your Password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry={true}
              error={errors.password?.message}
            />
          )}
        />

        {error ? (
          <AppText variant="caption" color={colors.error} style={styles.error}>
            {error}
          </AppText>
        ) : null}

        <Pressable onPress={() => navigation.navigate(AUTH_ROUTES.FORGOT_PASSWORD)}>
          <AppText variant="bodySmall" style={[styles.link, { color: colors.primary }]}>
            Forgot password?
          </AppText>
        </Pressable>

        <AppButton
          title="SIGN IN"
          onPress={handleSubmit(onSubmit)}
          loading={toBoolean(isLoading)}
        />

        <View style={styles.footer}>
          <AppText variant="bodySmall">Don&apos;t have an account? </AppText>
          <Pressable onPress={() => navigation.navigate(AUTH_ROUTES.SIGNUP)}>
            <AppText variant="bodySmall" style={[styles.link, { color: colors.primary }]}>
              Sign up
            </AppText>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  subtitle: { marginTop: spacing.sm, marginBottom: spacing.xl },
  error: { marginBottom: spacing.sm },
  link: { fontFamily: fontFamily.semiBold, marginBottom: spacing.xs },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
});
