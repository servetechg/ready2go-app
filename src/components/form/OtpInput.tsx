import React, { useRef } from 'react';
import {
    NativeSyntheticEvent,
    Pressable,
    StyleSheet,
    TextInput,
    TextInputKeyPressEventData,
    View,
} from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, fontFamily, spacing } from '@/theme';

import { ErrorMessage } from '../common/ErrorMessage';

const OTP_LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function OtpInput({ value, onChange, error }: OtpInputProps) {
  const { colors } = useAppTheme();
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('');

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
      <Pressable style={styles.row} onPress={() => inputRef.current?.focus()}>
        {digits.map((digit, index) => {
          const isActive =
            value.length < OTP_LENGTH
              ? index === value.length
              : index === OTP_LENGTH - 1;

          return (
          <View
            key={index}
            style={[
              styles.box,
              {
                backgroundColor: colors.surface,
                borderColor: error
                  ? colors.error
                  : isActive
                    ? colors.primary
                    : colors.border,
                borderWidth: isActive ? 2 : 1,
              },
            ]}>
            <TextInput
              style={[styles.digit, { color: colors.text }]}
              value={digit.trim()}
              editable={false}
              pointerEvents="none"
            />
          </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={updateValue}
        onKeyPress={handleKeyPress}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={OTP_LENGTH}
        style={styles.hiddenInput}
        accessibilityLabel="One-time verification code"
      />
      <ErrorMessage message={error} />
    </View>
  );
}

export const OTP_CODE_LENGTH = OTP_LENGTH;

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 52,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontFamily: fontFamily.semiBold,
    fontSize: 22,
    textAlign: 'center',
    padding: 0,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
});
