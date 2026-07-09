import React, { useRef } from 'react';
import {
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  useWindowDimensions,
  View,
} from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, fontFamily, spacing } from '@/theme';

import { ErrorMessage } from '../common/ErrorMessage';

const OTP_LENGTH = 6;
const BOX_GAP = spacing.sm;
const BOX_MIN_WIDTH = 40;
const BOX_MAX_WIDTH = 48;
const BOX_HEIGHT = 52;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function OtpInput({ value, onChange, error }: OtpInputProps) {
  const { colors } = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('');

  const horizontalPadding = spacing.lg * 2;
  const availableWidth = screenWidth - horizontalPadding;
  const boxWidth = Math.min(
    BOX_MAX_WIDTH,
    Math.max(BOX_MIN_WIDTH, Math.floor((availableWidth - BOX_GAP * (OTP_LENGTH - 1)) / OTP_LENGTH)),
  );

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
            value.length < OTP_LENGTH ? index === value.length : index === OTP_LENGTH - 1;
          const isFilled = digit.trim().length > 0;

          return (
            <View
              key={index}
              style={[
                styles.box,
                {
                  width: boxWidth,
                  height: BOX_HEIGHT,
                  backgroundColor: colors.surface,
                  borderColor: error
                    ? colors.error
                    : isActive
                      ? colors.primary
                      : isFilled
                        ? colors.primaryLight ?? colors.primary
                        : colors.border,
                  borderWidth: isActive ? 2 : 1,
                },
              ]}>
              <Text style={[styles.digit, { color: colors.text }]}>{digit.trim()}</Text>
            </View>
          );
        })}

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
          selectionColor="transparent"
          underlineColorAndroid="transparent"
          style={styles.hiddenInput}
          accessibilityLabel="One-time verification code"
        />
      </Pressable>
      <ErrorMessage message={error} />
    </View>
  );
}

export const OTP_CODE_LENGTH = OTP_LENGTH;

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: BOX_GAP,
    position: 'relative',
    minHeight: BOX_HEIGHT,
  },
  box: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontFamily: fontFamily.semiBold,
    fontSize: 22,
    lineHeight: Platform.OS === 'android' ? 26 : 22,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    color: 'transparent',
  },
});
