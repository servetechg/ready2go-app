import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AlertLocationsEditor } from '@/components/dashboard/AlertLocationsEditor';
import { FormattedPhoneField } from '@/components/form/FormattedPhoneField';
import { ProfileAvatarEditor } from '@/components/profile/ProfileAvatarEditor';
import { AppSelect } from '@/components/form/AppSelect';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import { US_STATES } from '@/constants/registration';
import { PROFILE_STACK_ROUTES } from '@/constants/routes';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  patchEmergencyProfile,
  patchUserAccount,
  saveAlertLocations,
} from '@/redux/thunks/profileThunks';
import { borderRadius, fontSize, googleSans, inputHeight, palette, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/types/navigation';
import type { AlertLocation } from '@/types/registration';
import { getErrorMessage } from '@/utils/error';
import { sanitizeTextInputProps } from '@/utils/nativeProps';
import {
  alertLocationsChanged,
  buildPatchProfileBody,
  buildPatchUserBody,
} from '@/utils/profileApi';
import {
  e164ToPhoneDisplay,
  isCompleteUsPhoneDisplay,
  isValidPhoneForApi,
  normalizePhoneForApi,
  US_PHONE_DISPLAY_PLACEHOLDER,
} from '@/utils/phone';

type Nav = StackNavigationProp<
  ProfileStackParamList,
  typeof PROFILE_STACK_ROUTES.EDIT_PROFILE
>;

const COUNTRIES = ['United States'] as const;
const MAX_ALERT_LOCATIONS = 5;

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
  const { showSuccess, showError } = useToast();
  const user = useAppSelector((s) => s.auth.user);
  const token = useAppSelector((s) => s.auth.token);
  const registration = useAppSelector((s) => s.registration);

  const initialFullName = useMemo(
    () => [user?.firstName, user?.lastName].filter(Boolean).join(' '),
    [user?.firstName, user?.lastName],
  );
  const initialAlertLocations = useRef<AlertLocation[]>(registration.alertLocations);

  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(() => e164ToPhoneDisplay(user?.phone));
  const [householdSize, setHouseholdSizeText] = useState(String(registration.householdSize));
  const [country, setCountry] = useState<string>(COUNTRIES[0]);
  const [state, setState] = useState(registration.address.state);
  const [city, setCity] = useState(registration.address.city);
  const [streetAddress, setStreetAddress] = useState(registration.address.streetAddress);
  const [alertLocations, setAlertLocationsLocal] = useState<AlertLocation[]>(
    registration.alertLocations,
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !token) {
      showError('Please sign in to save your profile');
      return;
    }

    setSaving(true);
    try {
      const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] ?? user.firstName;
      const lastName = nameParts.slice(1).join(' ') || user.lastName;
      const parsedHousehold = Math.max(
        1,
        Number.parseInt(householdSize, 10) || registration.householdSize,
      );

      if (alertLocations.length > MAX_ALERT_LOCATIONS) {
        showError('Maximum 5 alert locations allowed');
        return;
      }

      const phoneTrimmed = phone.trim();
      if (phoneTrimmed && !isCompleteUsPhoneDisplay(phoneTrimmed)) {
        showError(`Enter the full number (${US_PHONE_DISPLAY_PLACEHOLDER})`);
        return;
      }
      if (phoneTrimmed && !isValidPhoneForApi(phoneTrimmed)) {
        showError(`Enter a valid US number (${US_PHONE_DISPLAY_PLACEHOLDER})`);
        return;
      }
      const phoneE164 = phoneTrimmed ? (normalizePhoneForApi(phoneTrimmed) ?? '') : '';

      const accountBody = buildPatchUserBody(user, {
        firstName,
        lastName,
        email: email.trim(),
        phone: phoneE164,
      });
      const profileBody = buildPatchProfileBody(registration, {
        streetAddress,
        city,
        state,
        householdSize: parsedHousehold,
      });
      const locationsChanged = alertLocationsChanged(
        alertLocations,
        initialAlertLocations.current,
      );

      if (!accountBody && !profileBody && !locationsChanged) {
        showSuccess('No changes to save');
        navigation.goBack();
        return;
      }

      if (accountBody) {
        const result = await dispatch(patchUserAccount(accountBody));
        if (!patchUserAccount.fulfilled.match(result)) {
          throw new Error(String(result.payload));
        }
      }

      if (profileBody) {
        const result = await dispatch(patchEmergencyProfile(profileBody));
        if (!patchEmergencyProfile.fulfilled.match(result)) {
          throw new Error(String(result.payload));
        }
      }

      if (locationsChanged) {
        const result = await dispatch(saveAlertLocations(alertLocations));
        if (!saveAlertLocations.fulfilled.match(result)) {
          throw new Error(String(result.payload));
        }
        initialAlertLocations.current = alertLocations;
      }

      showSuccess('Profile updated');
      navigation.goBack();
    } catch (error) {
      showError(getErrorMessage(error, 'Could not save profile'));
    } finally {
      setSaving(false);
    }
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
          <ProfileAvatarEditor />

          <View style={styles.form}>
            <EditField
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Smith"
            />
            <FormattedPhoneField value={phone} onChangeText={setPhone} />
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
                locations={alertLocations}
                maxLocations={MAX_ALERT_LOCATIONS}
                onChange={setAlertLocationsLocal}
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
              {saving ? 'Saving...' : 'Save'}
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
