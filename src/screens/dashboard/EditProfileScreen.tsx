import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

import { AlertLocationsEditor } from '@/components/dashboard/AlertLocationsEditor';
import {
  AddressPickerScreen,
  type AddressPickerValue,
} from '@/components/onboarding/AddressPickerScreen';
import { FormattedPhoneField } from '@/components/form/FormattedPhoneField';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AddressVerificationFields } from '@/components/profile/AddressVerificationFields';
import { ProfileAvatarEditor } from '@/components/profile/ProfileAvatarEditor';
import { AppText } from '@/components/ui/AppText';
import { RequirementEditor } from '@/components/profile/RequirementEditor';
import { ADA_OPTIONS, PET_OPTIONS } from '@/constants/registration';
import { PROFILE_STACK_ROUTES } from '@/constants/routes';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
    patchEmergencyProfile,
    patchUserAccount,
    saveAlertLocations,
    uploadProfileDocument,
} from '@/redux/thunks/profileThunks';
import {
    setAddress,
    setAddressVerification,
    setAda,
    setPets,
    setProofOfOwnership,
    setProofOfResidency,
} from '@/redux/slices/registrationSlice';
import { borderRadius, fontSize, googleSans, inputHeight, palette, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/types/navigation';
import type { AlertLocation, YesNoStepData } from '@/types/registration';
import { adaSchema, petsSchema } from '@/validations/registration.schemas';
import type { LocalProfileDocument, ProfileDocumentValue } from '@/types/profileDocument';
import { getErrorMessage } from '@/utils/error';
import { pickAddressData } from '@/utils/registration';
import { sanitizeTextInputProps } from '@/utils/nativeProps';
import {
    e164ToPhoneDisplay,
    isCompleteUsPhoneDisplay,
    isValidPhoneForApi,
    normalizePhoneForApi,
    US_PHONE_DISPLAY_PLACEHOLDER,
} from '@/utils/phone';
import {
    alertLocationsChanged,
    buildPatchProfileBody,
    buildPatchUserBody,
} from '@/utils/profileApi';

type Nav = StackNavigationProp<
  ProfileStackParamList,
  typeof PROFILE_STACK_ROUTES.EDIT_PROFILE
>;

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
  const [addressValue, setAddressValue] = useState<AddressPickerValue>(() =>
    pickAddressData(registration.address),
  );
  const [isPrimaryAddress, setIsPrimaryAddress] = useState<boolean | null>(
    registration.isPrimaryAddress,
  );
  const [allowResidenceInspection, setAllowResidenceInspection] = useState<boolean | null>(
    registration.allowResidenceInspection,
  );
  const [proofOfOwnership, setProofOfOwnershipLocal] = useState<ProfileDocumentValue | null>(
    registration.proofOfOwnership,
  );
  const [proofOfResidency, setProofOfResidencyLocal] = useState<ProfileDocumentValue | null>(
    registration.proofOfResidency,
  );
  const [alertLocations, setAlertLocationsLocal] = useState<AlertLocation[]>(
    registration.alertLocations,
  );
  const [ada, setAdaLocal] = useState<YesNoStepData>(registration.ada);
  const [pets, setPetsLocal] = useState<YesNoStepData>(registration.pets);
  const [saving, setSaving] = useState(false);

  const handleAddressChange = useCallback((patch: Partial<AddressPickerValue>) => {
    setAddressValue((prev) => ({ ...prev, ...patch }));
  }, []);

  const uploadDocument = async (
    kind: 'ownership' | 'residency',
    file: LocalProfileDocument,
  ): Promise<ProfileDocumentValue | null> => {
    const result = await dispatch(uploadProfileDocument({ kind, file }));
    if (uploadProfileDocument.fulfilled.match(result)) {
      return result.payload.document;
    }
    showError(typeof result.payload === 'string' ? result.payload : 'Could not upload document');
    return null;
  };

  const handleSave = async () => {
    if (!user || !token) {
      showError('Please sign in to save your profile');
      return;
    }

    setSaving(true);
    try {
      const adaResult = adaSchema.safeParse(ada);
      if (!adaResult.success) {
        showError(adaResult.error.errors[0]?.message ?? 'Please complete ADA requirements');
        return;
      }
      const petsResult = petsSchema.safeParse(pets);
      if (!petsResult.success) {
        showError(petsResult.error.errors[0]?.message ?? 'Please complete pet / livestock information');
        return;
      }

      const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] ?? user.firstName;
      const lastName = nameParts.slice(1).join(' ') || user.lastName;
      const parsedHousehold = Math.max(
        1,
        Number.parseInt(householdSize, 10) || registration.householdSize,
      );

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
        streetAddress: addressValue.streetAddress,
        city: addressValue.city,
        state: addressValue.state,
        zipCode: addressValue.zipCode,
        latitude: addressValue.latitude,
        longitude: addressValue.longitude,
        useCurrentLocation: addressValue.useCurrentLocation,
        householdSize: parsedHousehold,
        isPrimaryAddress,
        allowResidenceInspection,
        ada,
        pets,
      });
      const locationsChanged = alertLocationsChanged(
        alertLocations,
        initialAlertLocations.current,
      );
      const requirementsChanged =
        JSON.stringify(ada) !== JSON.stringify(registration.ada) ||
        JSON.stringify(pets) !== JSON.stringify(registration.pets);
      const verificationChanged =
        isPrimaryAddress !== registration.isPrimaryAddress ||
        allowResidenceInspection !== registration.allowResidenceInspection;
      const documentsChanged =
        proofOfOwnership !== registration.proofOfOwnership ||
        proofOfResidency !== registration.proofOfResidency;

      if (!accountBody && !profileBody && !locationsChanged && !verificationChanged && !documentsChanged && !requirementsChanged) {
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

      dispatch(setAddress(pickAddressData(addressValue)));

      dispatch(
        setAddressVerification({
          isPrimaryAddress,
          allowResidenceInspection,
        }),
      );
      dispatch(setProofOfOwnership(proofOfOwnership));
      dispatch(setProofOfResidency(proofOfResidency));
      dispatch(setAda(ada));
      dispatch(setPets(pets));

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

            <AddressPickerScreen
              value={addressValue}
              onChange={handleAddressChange}
              containerStyle={styles.addressPicker}
            />

            <AddressVerificationFields
              isPrimaryAddress={isPrimaryAddress}
              allowResidenceInspection={allowResidenceInspection}
              proofOfOwnership={proofOfOwnership}
              proofOfResidency={proofOfResidency}
              onIsPrimaryAddressChange={setIsPrimaryAddress}
              onAllowInspectionChange={setAllowResidenceInspection}
              onProofOfOwnershipChange={setProofOfOwnershipLocal}
              onProofOfResidencyChange={setProofOfResidencyLocal}
              onUploadOwnership={(file) => uploadDocument('ownership', file)}
              onUploadResidency={(file) => uploadDocument('residency', file)}
            />

            <RequirementEditor
              title="ADA Requirements"
              instruction="Do you or anyone in your household have ADA requirements?"
              options={ADA_OPTIONS}
              value={ada}
              onChange={setAdaLocal}
            />

            <RequirementEditor
              title="Pet / Livestock Information"
              instruction="Do you have pets or livestock?"
              options={PET_OPTIONS}
              value={pets}
              onChange={setPetsLocal}
            />

            <View style={styles.alertSection}>
              <AppText variant="label" style={styles.alertSectionTitle}>
                Other alert locations
              </AppText>
              <AlertLocationsEditor
                locations={alertLocations}
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
    paddingBottom: spacing.xxxl,
  },
  form: {
    gap: spacing.md,
  },
  addressPicker: {
    marginTop: spacing.xs,
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
