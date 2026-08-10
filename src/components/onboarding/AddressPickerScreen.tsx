import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { AppInput } from '@/components/form/AppInput';
import { AppSelect } from '@/components/form/AppSelect';
import { AppText } from '@/components/ui/AppText';
import { ENV } from '@/constants/env';
import { US_STATES } from '@/constants/registration';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { borderRadius, fontFamily, fontSize, googleSans, inputHeight, spacing } from '@/theme';
import { palette } from '@/theme/colors';
import { getErrorMessage } from '@/utils/error';
import { searchPlaces, resolvePlaceSelection, reverseGeocode } from '@/services/places.service';
import { isGoogleMapsKeyConfigured } from '@/utils/googlePlacesErrors';
import {
  DEFAULT_MAP_CENTER,
  SELECTED_MAP_DELTA,
  type ParsedAddress,
  type PlaceSuggestion,
} from '@/utils/googlePlaces';

export type AddressPickerValue = {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  useCurrentLocation: boolean;
  latitude?: number;
  longitude?: number;
};

type AddressPickerScreenProps = {
  value: AddressPickerValue;
  onChange: (patch: Partial<AddressPickerValue>) => void;
  errors?: Partial<Record<keyof AddressPickerValue, string>>;
  containerStyle?: ViewStyle;
};

const MAP_HEIGHT = 180;
const NAVY = palette.tabActive;
const SEARCH_DEBOUNCE_MS = 300;

function MatchedSuggestionText({
  mainText,
  matched,
  color,
  secondaryColor,
  secondaryText,
}: {
  mainText: string;
  matched?: { offset: number; length: number };
  color: string;
  secondaryColor: string;
  secondaryText?: string;
}) {
  if (!matched) {
    return (
      <View style={styles.suggestionTextBlock}>
        <Text style={[styles.suggestionMain, { color }]}>{mainText}</Text>
        {secondaryText ? (
          <Text style={[styles.suggestionSecondary, { color: secondaryColor }]} numberOfLines={1}>
            {secondaryText}
          </Text>
        ) : null}
      </View>
    );
  }

  const before = mainText.slice(0, matched.offset);
  const hit = mainText.slice(matched.offset, matched.offset + matched.length);
  const after = mainText.slice(matched.offset + matched.length);

  return (
    <View style={styles.suggestionTextBlock}>
      <Text style={[styles.suggestionMain, { color }]}>
        {before}
        <Text style={styles.suggestionBold}>{hit}</Text>
        {after}
      </Text>
      {secondaryText ? (
        <Text style={[styles.suggestionSecondary, { color: secondaryColor }]} numberOfLines={1}>
          {secondaryText}
        </Text>
      ) : null}
    </View>
  );
}

function SuggestionRow({
  item,
  onSelect,
  colors,
}: {
  item: PlaceSuggestion;
  onSelect: (item: PlaceSuggestion) => void;
  colors: { text: string; textSecondary: string; borderLight: string };
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.suggestionRow,
        pressed && styles.suggestionRowPressed,
        { borderBottomColor: colors.borderLight },
      ]}
      onPress={() => onSelect(item)}>
      <Ionicons name="location-outline" size={18} color={colors.textSecondary} style={styles.pinIcon} />
      <MatchedSuggestionText
        mainText={item.structured_formatting.main_text}
        matched={item.structured_formatting.main_text_matched_substrings?.[0]}
        secondaryText={item.structured_formatting.secondary_text}
        color={colors.text}
        secondaryColor={colors.textSecondary}
      />
    </Pressable>
  );
}

export function AddressPickerScreen({
  value,
  onChange,
  errors,
  containerStyle,
}: AddressPickerScreenProps) {
  const { colors } = useAppTheme();
  const { showError, showInfo } = useToast();
  const mapRef = useRef<MapView>(null);
  const searchRef = useRef<TextInput>(null);

  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(() =>
    typeof value.latitude === 'number' && typeof value.longitude === 'number'
      ? { latitude: value.latitude, longitude: value.longitude }
      : null,
  );

  const apiKey = ENV.GEOAPIFY_API_KEY || ENV.GOOGLE_MAPS_API_KEY;
  const hasApiKey = Boolean(apiKey);

  useEffect(() => {
    if (typeof value.latitude === 'number' && typeof value.longitude === 'number') {
      setPin({ latitude: value.latitude, longitude: value.longitude });
    }
  }, [value.latitude, value.longitude]);

  useEffect(() => {
    if (searchText.trim().length < 2) {
      setSuggestions([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timer = setTimeout(() => {
      void searchPlaces(searchText).then(({ suggestions: next, error }) => {
        setSuggestions(next);
        setSearchError(error ?? null);
        setSearchLoading(false);
        setDropdownOpen(true);
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchText]);

  const focusMapOn = useCallback((latitude: number, longitude: number) => {
    mapRef.current?.animateToRegion({ latitude, longitude, ...SELECTED_MAP_DELTA }, 350);
  }, []);

  const applyParsedAddress = useCallback(
    (parsed: ParsedAddress, useCurrentLocation: boolean, label?: string) => {
      setPin({ latitude: parsed.latitude, longitude: parsed.longitude });
      focusMapOn(parsed.latitude, parsed.longitude);
      if (label) setSearchText(label);
      setDropdownOpen(false);
      setSuggestions([]);
      onChange({
        streetAddress: parsed.streetAddress,
        city: parsed.city,
        state: parsed.state,
        zipCode: parsed.zipCode,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        useCurrentLocation,
      });
    },
    [focusMapOn, onChange],
  );

  const handleSelectSuggestion = useCallback(
    async (item: PlaceSuggestion) => {
      setGeocoding(true);
      setDropdownOpen(false);
      searchRef.current?.blur();
      try {
        const parsed = await resolvePlaceSelection(item.place_id, apiKey);
        if (!parsed) {
          showError('Could not load that location. Try another suggestion.');
          return;
        }
        applyParsedAddress(parsed, false, item.description);
      } catch (error) {
        showError(getErrorMessage(error, 'Could not load that location'));
      } finally {
        setGeocoding(false);
      }
    },
    [apiKey, applyParsedAddress, showError],
  );

  const handleMarkerDragEnd = useCallback(
    async (coordinate: { latitude: number; longitude: number }) => {
      setPin(coordinate);
      focusMapOn(coordinate.latitude, coordinate.longitude);
      if (!apiKey) {
        onChange({
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          useCurrentLocation: false,
        });
        return;
      }
      setGeocoding(true);
      try {
        const parsed = await reverseGeocode(coordinate.latitude, coordinate.longitude, apiKey);
        if (parsed) {
          applyParsedAddress(parsed, false);
        } else {
          onChange({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            useCurrentLocation: false,
          });
          showError('Could not resolve address for this pin.');
        }
      } catch (error) {
        onChange({
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          useCurrentLocation: false,
        });
      } finally {
        setGeocoding(false);
      }
    },
    [apiKey, applyParsedAddress, focusMapOn, onChange, showError],
  );

  const handleFindMyLocation = useCallback(async () => {
    setLocating(true);
    setDropdownOpen(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showError('Location permission is required to use your current position.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;
      setPin({ latitude, longitude });
      focusMapOn(latitude, longitude);
      if (!apiKey) {
        onChange({ latitude, longitude, useCurrentLocation: true });
        showInfo('Location set. Add EXPO_PUBLIC_GEOAPIFY_API_KEY to auto-fill the address.');
        return;
      }
      setGeocoding(true);
      const parsed = await reverseGeocode(latitude, longitude, apiKey);
      if (parsed) {
        applyParsedAddress(parsed, true);
      } else {
        onChange({ latitude, longitude, useCurrentLocation: true });
        showError('Could not resolve your current address.');
      }
    } catch (error) {
      showError(getErrorMessage(error, 'Could not get your location'));
    } finally {
      setLocating(false);
      setGeocoding(false);
    }
  }, [apiKey, applyParsedAddress, focusMapOn, onChange, showError, showInfo]);

  const initialRegion = useMemo<Region>(
    () => (pin ? { ...pin, ...SELECTED_MAP_DELTA } : { ...DEFAULT_MAP_CENTER }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const showDropdown =
    dropdownOpen && searchText.trim().length >= 2 && (searchLoading || suggestions.length > 0 || !!searchError);

  if (!hasApiKey) {
    return (
      <View style={[styles.container, containerStyle]}>
        <View style={[styles.missingKey, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name="map-outline" size={28} color={colors.textMuted} />
          <AppText variant="bodySmall" color={colors.textSecondary} center={true}>
            Add EXPO_PUBLIC_GEOAPIFY_API_KEY to .env, then run: npx expo start -c
          </AppText>
        </View>
        <ManualAddressFields value={value} onChange={onChange} errors={errors} />
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.locationHeader}>
        <View style={styles.locationTitleRow}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <AppText variant="label" color={colors.primary} style={styles.locationTitle}>
            YOUR LOCATION
          </AppText>
        </View>
        <Pressable
          style={[styles.findButton, (locating || geocoding) && styles.findButtonDisabled]}
          onPress={() => void handleFindMyLocation()}
          disabled={locating || geocoding}>
          <Ionicons name="navigate" size={14} color={palette.white} />
          <AppText variant="caption" color={palette.white} style={styles.findButtonText}>
            Find My Location
          </AppText>
        </Pressable>
      </View>

      <View style={styles.searchBlock}>
        <TextInput
          ref={searchRef}
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            setDropdownOpen(true);
          }}
          onFocus={() => {
            if (searchText.trim().length >= 2) setDropdownOpen(true);
          }}
          placeholder="Search city, area, or street address"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="words"
        />

        {showDropdown ? (
          <View
            style={[
              styles.dropdown,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            {searchLoading ? (
              <View style={styles.dropdownStatus}>
                <ActivityIndicator size="small" color={colors.primary} />
                <AppText variant="caption" color={colors.textSecondary}>
                  Searching…
                </AppText>
              </View>
            ) : searchError ? (
              <View style={styles.dropdownError}>
                <Ionicons name="warning-outline" size={18} color={colors.error} />
                <AppText variant="caption" color={colors.error} style={styles.dropdownErrorText}>
                  {searchError}
                </AppText>
              </View>
            ) : suggestions.length > 0 ? (
              <ScrollView
                style={styles.dropdownList}
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}>
                {suggestions.map((item) => (
                  <SuggestionRow
                    key={item.place_id}
                    item={item}
                    onSelect={handleSelectSuggestion}
                    colors={colors}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.dropdownStatus}>
                <AppText variant="caption" color={colors.textSecondary}>
                  No locations found
                </AppText>
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.mapShell}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            scrollEnabled
            zoomEnabled
            rotateEnabled={false}
            pitchEnabled={false}>
            {pin ? (
              <Marker
                coordinate={pin}
                draggable
                onDragEnd={(e) => void handleMarkerDragEnd(e.nativeEvent.coordinate)}
              />
            ) : null}
          </MapView>
          {(locating || geocoding) && (
            <View style={styles.mapOverlay}>
              <ActivityIndicator color={palette.white} />
            </View>
          )}
        </View>
      </View>

      <ManualAddressFields value={value} onChange={onChange} errors={errors} />
    </View>
  );
}

function ManualAddressFields({
  value,
  onChange,
  errors,
}: Pick<AddressPickerScreenProps, 'value' | 'onChange' | 'errors'>) {
  const stateOptions = useMemo(() => [...US_STATES], []);

  return (
    <>
      <AppInput
        label="Street Address"
        placeholder="Enter Your Street Address"
        value={value.streetAddress}
        onChangeText={(streetAddress) => onChange({ streetAddress, useCurrentLocation: false })}
        error={errors?.streetAddress}
      />
      <AppInput
        label="City"
        placeholder="Enter Your City"
        value={value.city}
        onChangeText={(city) => onChange({ city, useCurrentLocation: false })}
        error={errors?.city}
      />
      <View style={styles.row}>
        <View style={styles.stateCol}>
          <AppSelect
            label="State"
            value={value.state}
            options={stateOptions}
            onChange={(state) => onChange({ state, useCurrentLocation: false })}
            placeholder="State"
            error={errors?.state}
            containerStyle={styles.stateSelect}
          />
        </View>
        <AppInput
          label="ZIP Code"
          value={value.zipCode}
          onChangeText={(zipCode) => onChange({ zipCode, useCurrentLocation: false })}
          keyboardType="number-pad"
          placeholder="ZIP Code"
          error={errors?.zipCode}
          containerStyle={styles.zip}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.sm },
  missingKey: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  locationTitle: {
    letterSpacing: 0.5,
    fontFamily: fontFamily.semiBold,
  },
  findButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: NAVY,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  findButtonDisabled: { opacity: 0.7 },
  findButtonText: { fontFamily: fontFamily.semiBold },
  searchBlock: {
    position: 'relative',
    zIndex: 1000,
    elevation: 12,
    marginBottom: spacing.lg,
    overflow: 'visible',
  },
  searchInput: {
    fontFamily: googleSans.regular,
    fontSize: fontSize.md,
    height: inputHeight,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? 10 : 0,
  },
  dropdown: {
    position: 'absolute',
    top: inputHeight + spacing.xs,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    maxHeight: 240,
    zIndex: 2000,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  dropdownList: { maxHeight: 240 },
  dropdownStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  dropdownError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  dropdownErrorText: { flex: 1, lineHeight: 18 },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  suggestionRowPressed: { opacity: 0.75 },
  pinIcon: { marginTop: 2 },
  suggestionTextBlock: { flex: 1, gap: 2 },
  suggestionMain: {
    fontFamily: googleSans.regular,
    fontSize: fontSize.md,
    lineHeight: fontSize.md + 4,
  },
  suggestionBold: { fontFamily: fontFamily.bold },
  suggestionSecondary: {
    fontFamily: googleSans.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm + 2,
  },
  mapShell: {
    height: MAP_HEIGHT,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginTop: spacing.sm,
    zIndex: 1,
  },
  map: { ...StyleSheet.absoluteFillObject },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stateCol: { width: 108, flexShrink: 0 },
  stateSelect: { marginBottom: 0 },
  zip: { flex: 1, minWidth: 0 },
});
