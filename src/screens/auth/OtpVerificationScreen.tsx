import { zodResolver } from '@hookform/resolvers/zod';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { OtpInput } from '@/components/form/OtpInput';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AUTH_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  clearAuthError,
  clearPendingAuth,
  resendOtp,
  verifyOtp,
} from '@/redux/slices/authSlice';
import {
  completeRegistration,
  setNeedsAccount,
} from '@/redux/slices/registrationSlice';
import { MOCK_OTP_CODE } from '@/services/auth.service';
import { registrationService } from '@/services/registration.service';
import { spacing } from '@/theme';
import type { AuthStackParamList } from '@/types/navigation';
import { toBoolean } from '@/utils/coerce';
import { otpSchema, type OtpFormData } from '@/validations/auth.schemas';

type Nav = StackNavigationProp<AuthStackParamList, typeof AUTH_ROUTES.OTP_VERIFICATION>;
type Route = RouteProp<AuthStackParamList, typeof AUTH_ROUTES.OTP_VERIFICATION>;

export function OtpVerificationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.auth);
  const registration = useAppSelector((s) => s.registration);
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useToast();

  const email = route.params.email;
  const completeAfterVerify = route.params?.completeRegistration ?? false;

  const { control, handleSubmit, formState: { errors } } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
  });

  React.useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const onSubmit = async (data: OtpFormData) => {
    const result = await dispatch(verifyOtp({ email, code: data.code }));
    if (!verifyOtp.fulfilled.match(result)) return;

    const token = result.payload.token;

    if (completeAfterVerify) {
      await registrationService.submitRegistration(
        { ...registration, isComplete: true },
        token,
      );
      dispatch(completeRegistration());
      dispatch(setNeedsAccount(false));
      showSuccess('Registration complete! Welcome to Ready2Go.');
      return;
    }

    showSuccess('Email verified! Welcome to Ready2Go.');
  };

  const handleResend = async () => {
    const result = await dispatch(resendOtp({ email }));
    if (resendOtp.fulfilled.match(result)) {
      showSuccess('A new verification code has been sent');
    } else {
      showError(error ?? 'Could not resend code');
    }
  };

  return (
    <AuthLayout
      illustration={
        <View style={styles.illustrationWrap}>
          <Image
            source={require('@/assets/images/signup.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      }
      title="Verify Your Email"
      subtitle={`Enter the 6-digit code sent to ${email}`}
      showLogo={false}>
      <Controller
        control={control}
        name="code"
        render={({ field: { onChange, value } }) => (
          <OtpInput value={value} onChange={onChange} error={errors.code?.message} />
        )}
      />

      {error ? (
        <AppText variant="caption" color={colors.error} style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <AppText variant="caption" color={colors.textMuted} center={true} style={styles.devHint}>
        Demo code: {MOCK_OTP_CODE}
      </AppText>

      <AppButton
        title={isLoading ? 'Verifying...' : 'VERIFY'}
        onPress={handleSubmit(onSubmit)}
        loading={toBoolean(isLoading)}
      />

      <View style={styles.resendRow}>
        <AppText variant="bodySmall" color={colors.textSecondary}>
          Didn&apos;t receive a code?{' '}
        </AppText>
        <Pressable onPress={handleResend} disabled={toBoolean(isLoading)}>
          <AppText variant="bodySmall" style={[styles.link, { color: colors.primary }]}>
            Resend
          </AppText>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={() => {
            dispatch(clearPendingAuth());
            navigation.navigate(AUTH_ROUTES.SIGNUP, {
              completeRegistration: completeAfterVerify,
            });
          }}>
          <AppText variant="bodySmall" style={[styles.link, { color: colors.primary }]}>
            Change email
          </AppText>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  illustrationWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  error: { marginBottom: spacing.sm },
  devHint: { marginBottom: spacing.md },
  link: { fontWeight: '600' },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.lg,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
});
