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
import { ENV } from '@/constants/env';
import { AUTH_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useOtpCountdown } from '@/hooks/useOtpCountdown';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  clearAuthError,
  clearPendingAuth,
  sendOtp,
  verifyOtp,
} from '@/redux/slices/authSlice';
import { spacing } from '@/theme';
import type { AuthStackParamList } from '@/types/navigation';
import type { OtpPurpose } from '@/types/api';
import { toBoolean } from '@/utils/coerce';
import { otpSchema, type OtpFormData } from '@/validations/auth.schemas';

type Nav = StackNavigationProp<AuthStackParamList, typeof AUTH_ROUTES.OTP_VERIFICATION>;
type Route = RouteProp<AuthStackParamList, typeof AUTH_ROUTES.OTP_VERIFICATION>;

function otpPurposeForFlow(flow: 'signup' | 'resetPassword'): OtpPurpose {
  return flow === 'resetPassword' ? 'PASSWORD_RESET' : 'EMAIL_VERIFICATION';
}

export function OtpVerificationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.auth);
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useToast();

  const { email, flow } = route.params;
  const isResetFlow = flow === 'resetPassword';
  const purpose = otpPurposeForFlow(flow);

  const countdown = useOtpCountdown(60);
  const canResend = isResetFlow ? countdown.canResend : true;
  const formatted = countdown.formatted;
  const resetTimer = countdown.reset;

  const { control, handleSubmit, formState: { errors } } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
  });

  React.useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const onSubmit = async (data: OtpFormData) => {
    const result = await dispatch(verifyOtp({ email, code: data.code, purpose }));
    if (!verifyOtp.fulfilled.match(result)) return;

    if (result.payload.kind === 'password_reset') {
      showSuccess('Code verified');
      navigation.navigate(AUTH_ROUTES.UPDATE_PASSWORD, { email });
      return;
    }

    showSuccess('Email verified! Complete your emergency profile.');
  };

  const handleResend = async () => {
    if (isResetFlow && !canResend) return;

    const result = await dispatch(sendOtp({ email, purpose }));
    if (sendOtp.fulfilled.match(result)) {
      if (isResetFlow) {
        resetTimer();
      }
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
      title={isResetFlow ? 'Verify Reset Code' : 'Verify Your Email'}
      subtitle={`Enter the 6-digit code sent to ${email}`}
      showLogo={false}>
      {isResetFlow ? (
        <AppText variant="caption" color={colors.textMuted} center={true} style={styles.timer}>
          Code expires in {formatted}
        </AppText>
      ) : null}

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

      {ENV.IS_DEV ? (
        <AppText variant="caption" color={colors.textMuted} center={true} style={styles.devHint}>
          Dev: check the Next.js server terminal for the OTP code if email is not configured.
        </AppText>
      ) : null}

      <AppButton
        title={isLoading ? 'Verifying...' : 'VERIFY'}
        onPress={handleSubmit(onSubmit)}
        loading={toBoolean(isLoading)}
      />

      <View style={styles.resendRow}>
        <AppText variant="bodySmall" color={colors.textSecondary}>
          Didn&apos;t receive a code?{' '}
        </AppText>
        {canResend ? (
          <Pressable onPress={handleResend} disabled={toBoolean(isLoading)}>
            <AppText variant="bodySmall" style={[styles.link, { color: colors.primary }]}>
              Resend
            </AppText>
          </Pressable>
        ) : (
          <AppText variant="bodySmall" color={colors.textMuted}>
            Resend in {formatted}
          </AppText>
        )}
      </View>

      <View style={styles.footer}>
        {isResetFlow ? (
          <Pressable onPress={() => navigation.navigate(AUTH_ROUTES.LOGIN)}>
            <AppText variant="bodySmall" style={[styles.link, { color: colors.primary }]}>
              Back to Sign In
            </AppText>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              dispatch(clearPendingAuth());
              navigation.navigate(AUTH_ROUTES.SIGNUP);
            }}>
            <AppText variant="bodySmall" style={[styles.link, { color: colors.primary }]}>
              Change email
            </AppText>
          </Pressable>
        )}
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
  timer: { marginBottom: spacing.md },
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
