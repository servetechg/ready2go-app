import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AlertLocationsEditor } from '@/components/dashboard/AlertLocationsEditor';
import { AppSelect } from '@/components/form/AppSelect';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import { US_STATES } from '@/constants/registration';
import { PROFILE_STACK_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setUser } from '@/redux/slices/authSlice';
import { setAddress, setAlertLocations, setHouseholdSize } from '@/redux/slices/registrationSlice';
import { borderRadius, fontSize, googleSans, inputHeight, palette, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/types/navigation';
import { sanitizeTextInputProps } from '@/utils/nativeProps';

type Nav = StackNavigationProp<
  ProfileStackParamList,
  typeof PROFILE_STACK_ROUTES.EDIT_PROFILE
>;

const COUNTRIES = ['United States'] as const;

interface EditFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  editable?: boolean;
  rightIcon?: React.ReactNode;
}

function EditField({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  editable = true,
  rightIcon,
}: EditFieldProps) {
  const nativeProps = sanitizeTextInputProps({
    value,
    onChangeText,
    placeholder,
    keyboardType,
    editable,
    placeholderTextColor: palette.textMuted,
    textAlignVertical: 'center',
    ...(Platform.OS === 'android' ? { includeFontPadding: false as const } : {}),
  });

  return (
    <View style={styles.fieldWrap}>
      <TextInput
        style={[
          styles.fieldInput,
          !editable ? styles.fieldDisabled : undefined,
          rightIcon ? styles.fieldWithIcon : undefined,
        ]}
        {...nativeProps}
      />
      {rightIcon ? <View style={styles.fieldIcon}>{rightIcon}</View> : null}
    </View>
  );
}

export function EditProfileScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const user = useAppSelector((s) => s.auth.user);
  const registration = useAppSelector((s) => s.registration);

  const initialFullName = useMemo(
    () => [user?.firstName, user?.lastName].filter(Boolean).join(' '),
    [user?.firstName, user?.lastName],
  );

  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [householdSize, setHouseholdSizeText] = useState(String(registration.householdSize));
  const [country, setCountry] = useState<string>(COUNTRIES[0]);
  const [state, setState] = useState(registration.address.state);
  const [city, setCity] = useState(registration.address.city);
  const [streetAddress, setStreetAddress] = useState(registration.address.streetAddress);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!user) {
      return;
    }

    setSaving(true);
    const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] ?? user.firstName;
    const lastName = nameParts.slice(1).join(' ') || user.lastName;
    const parsedHousehold = Math.max(1, Number.parseInt(householdSize, 10) || registration.householdSize);

    dispatch(
      setUser({
        ...user,
        firstName,
        lastName,
        email: email.trim() || user.email,
      }),
    );
    dispatch(
      setAddress({
        ...registration.address,
        streetAddress: streetAddress.trim(),
        city: city.trim(),
        state,
      }),
    );
    dispatch(setHouseholdSize(parsedHousehold));
    setSaving(false);
    navigation.goBack();
  };

  return (
    <ScreenWrapper scrollable={false} keyboardAvoiding={true}>
      <View style={styles.flex}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityLabel="Go back"
            style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={palette.text} />
          </Pressable>
          <AppText variant="h3" style={styles.headerTitle}>
            Edit Profile
          </AppText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.avatarSection}>
            <View style={[styles.avatarRing, { borderColor: palette.tabActive }]}>
              <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                <Ionicons name="person" size={56} color={colors.primary} />
              </View>
              <Pressable
                style={[styles.cameraButton, { backgroundColor: palette.tabActive }]}
                accessibilityLabel="Change profile photo">
                <Ionicons name="camera" size={16} color={palette.white} />
              </Pressable>
            </View>
          </View>

          <View style={styles.form}>
            <EditField
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Smith"
            />
            <EditField
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 5421 564651 54"
              keyboardType="phone-pad"
            />
            <EditField
              value={email}
              onChangeText={setEmail}
              placeholder="john.smith@email.com"
              keyboardType="email-address"
            />
            <EditField
              value={householdSize}
              onChangeText={setHouseholdSizeText}
              placeholder="Household size"
              keyboardType="numeric"
            />

            <AppSelect
              value={country}
              options={COUNTRIES}
              onChange={setCountry}
              placeholder="Country"
              containerStyle={styles.selectField}
              pill
            />
            <AppSelect
              value={state}
              options={US_STATES}
              onChange={setState}
              placeholder="State"
              containerStyle={styles.selectField}
              pill
            />
            <EditField value={city} onChangeText={setCity} placeholder="City" />
            <EditField
              value={streetAddress}
              onChangeText={setStreetAddress}
              placeholder="867 Snowbird Lane Hampton Bays, New York"
              rightIcon={<Ionicons name="locate" size={22} color={palette.tabActive} />}
            />

            <View style={styles.alertSection}>
              <AppText variant="label" style={styles.alertSectionTitle}>
                Other alert locations
              </AppText>
              <AlertLocationsEditor
                locations={registration.alertLocations}
                onChange={(locations) => dispatch(setAlertLocations(locations))}
                compact={true}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.saveButton, { backgroundColor: palette.tabActive }, saving && styles.saveDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button">
            <AppText variant="button" color={palette.white}>
              Save
            </AppText>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const FIELD_HEIGHT = inputHeight + 8;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  headerSpacer: { width: 44 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
  avatarRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 118,
    height: 118,
    borderRadius: 59,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.white,
  },
  form: {
    gap: spacing.md,
  },
  fieldWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  fieldInput: {
    height: FIELD_HEIGHT,
    borderRadius: borderRadius.full,
    backgroundColor: palette.white,
    paddingHorizontal: spacing.xl,
    fontFamily: googleSans.regular,
    fontSize: fontSize.md,
    color: palette.text,
  },
  fieldDisabled: {
    opacity: 0.7,
  },
  fieldWithIcon: {
    paddingRight: spacing.xxxl + spacing.sm,
  },
  fieldIcon: {
    position: 'absolute',
    right: spacing.lg,
    height: FIELD_HEIGHT,
    justifyContent: 'center',
  },
  selectField: {
    marginBottom: 0,
  },
  alertSection: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  alertSectionTitle: {
    marginBottom: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 72 + spacing.lg,
  },
  saveButton: {
    height: FIELD_HEIGHT,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDisabled: {
    opacity: 0.6,
  },
});
