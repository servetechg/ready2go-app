import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  ViewStyle
} from 'react-native';

import { sanitizeScrollViewProps } from '@/utils/nativeProps';

import { AppContainer } from './AppContainer';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  contentContainerStyle?: ViewStyle;
  nestedScrollEnabled?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'handled' | 'never';
}

export function ScreenWrapper({
  children,
  scrollable = true,
  keyboardAvoiding = true,
  contentContainerStyle,
  nestedScrollEnabled = false,
  keyboardShouldPersistTaps = 'handled',
}: ScreenWrapperProps) {
  const useKeyboardAvoiding = keyboardAvoiding;

  const scrollProps = sanitizeScrollViewProps({
    contentContainerStyle: [styles.scrollContent, contentContainerStyle],
    keyboardShouldPersistTaps,
    showsVerticalScrollIndicator: false,
    nestedScrollEnabled,
  });

  const content = scrollable ? (
    <ScrollView {...scrollProps}>{children}</ScrollView>
  ) : (
    children
  );

  if (useKeyboardAvoiding) {
    return (
      <AppContainer safe={true}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior="padding"
          enabled={true}
          keyboardVerticalOffset={0}>
          {content}
        </KeyboardAvoidingView>
      </AppContainer>
    );
  }

  return <AppContainer safe={true}>{content}</AppContainer>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 4 },
});
