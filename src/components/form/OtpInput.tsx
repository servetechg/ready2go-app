import React, { useEffect, useRef } from 'react';
import {
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, fontFamily, spacing } from '@/theme';

import { ErrorMessage } from '../common/ErrorMessage';

const OTP_LENGTH = 6;
const BOX_SIZE = 48;
const BOX_GAP = 8;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function OtpInput({ value, onChange, error }: OtpInputProps) {
  const { colors } = useAppTheme();
  const inputRef = useRef<TextInput>(null);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '');

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, []);

  const updateValue = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(cleaned);
  };

  const handleKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (event.nativeEvent.key === 'Backspace' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.rowContainer}>
        <Pressable
          style={styles.row}
          onPress={() => inputRef.current?.focus()}
          accessibilityRole="button"
          accessibilityLabel="Enter verification code">
          {digits.map((digit, index) => {
            const isActive =
              value.length < OTP_LENGTH ? index === value.length : index === OTP_LENGTH - 1;
            const isFilled = digit.length > 0;

            return (
              <View
                key={`otp-${index}`}
                style={[
                  styles.box,
                  {
                    backgroundColor: colors.surface,
                    borderColor: error
                      ? colors.error
                      : isActive
                        ? colors.primary
                        : isFilled
                          ? colors.primary
                          : colors.border,
                    borderWidth: isActive || isFilled ? 2 : 1.5,
                  },
                ]}>
                <Text style={[styles.digit, { color: colors.text }]}>{digit}</Text>
              </View>
            );
          })}
        </Pressable>

        {/* Full-area invisible input so Android does not show a 1px caret as a blue bar */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={updateValue}
          onKeyPress={handleKeyPress}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={OTP_LENGTH}
          caretHidden={true}
          contextMenuHidden={true}
          importantForAutofill="yes"
          selectionColor="transparent"
          underlineColorAndroid="transparent"
          style={styles.hiddenInput}
          accessibilityLabel="One-time verification code"
        />
      </View>
      <ErrorMessage message={error} />
    </View>
  );
}

export const OTP_CODE_LENGTH = OTP_LENGTH;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
    width: '100%',
  },
  rowContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: BOX_SIZE,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BOX_GAP,
    width: BOX_SIZE * OTP_LENGTH + BOX_GAP * (OTP_LENGTH - 1),
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  digit: {
    fontFamily: fontFamily.semiBold,
    fontSize: 22,
    lineHeight: Platform.OS === 'android' ? 28 : 26,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    width: '100%',
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.02,
    color: 'transparent',
    fontSize: 1,
    zIndex: 2,
  },
});
