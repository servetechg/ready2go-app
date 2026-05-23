import { zodResolver } from '@hookform/resolvers/zod';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppInput } from '@/components/form/AppInput';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AUTH_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { clearAuthError, signupUser } from '@/redux/slices/authSlice';
import { spacing } from '@/theme';
import type { AuthStackParamList } from '@/types/navigation';
import { signupSchema, type SignupFormData } from '@/validations/auth.schemas';

type Nav = StackNavigationProp<AuthStackParamList, typeof AUTH_ROUTES.SIGNUP>;
type Route = RouteProp<AuthStackParamList, typeof AUTH_ROUTES.SIGNUP>;

export function SignupScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.auth);
  const needsAccount = useAppSelector((s) => s.registration.needsAccount);
  const { colors } = useAppTheme();
  const { showSuccess } = useToast();

  const completeAfterSignup = route.params?.completeRegistration ?? needsAccount;

  const { control, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  React.useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const onSubmit = async (data: SignupFormData) => {
    const result = await dispatch(signupUser(data));
    if (!signupUser.fulfilled.match(result)) return;

    showSuccess('Verification code sent to your email');
    navigation.navigate(AUTH_ROUTES.OTP_VERIFICATION, {
      email: data.email,
      completeRegistration: completeAfterSignup,
    });
  };

  return (
    <>
    <AuthLayout
    illustration={
      <View style={styles.illustrationWrap}>
        <Image source={require('@/assets/images/signup.png')} style={styles.logo} resizeMode="contain" />
      </View>
    }
      title={completeAfterSignup ? 'Save Your Profile' : 'Create Account'}
      subtitle={
        completeAfterSignup
          ? 'Create login credentials to save your emergency registration'
          : 'Register for emergency assistance'
      }
      showLogo={false}>
      <View style={styles.row}>
        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="First Name"
              placeholder="Enter Your First Name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.firstName?.message}
              containerStyle={styles.half}
            />
          )}
        />
        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Last Name"
              placeholder="Enter Your Last Name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.lastName?.message}
              containerStyle={styles.half}
            />
          )}
        />
      </View>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Email"
            placeholder="Enter Your Email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
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
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Confirm Password"
            placeholder="Confirm Your Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry={true}
            error={errors.confirmPassword?.message}
          />
        )}
      />

      {error ? (
        <AppText variant="caption" color={colors.error}>
          {error}
        </AppText>
      ) : null}

      <AppButton
        title={isLoading ? 'Signing Up...' : (completeAfterSignup ? 'Sign Up' : 'CREATE ACCOUNT')}
        onPress={handleSubmit(onSubmit)}
        loading={!!isLoading}
      />

      <View style={styles.footer}>
        <AppText variant="bodySmall">Already have an account? </AppText>
        <Pressable onPress={() => navigation.navigate(AUTH_ROUTES.LOGIN)}>
          <AppText variant="bodySmall" style={[styles.link, { color: colors.primary }]}>
            Sign in
          </AppText>
        </Pressable>
      </View>
    </AuthLayout>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  link: { fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  logo: {
    width: 280,
    height: 280,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    resizeMode: 'contain',
  },
  illustrationWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
});
