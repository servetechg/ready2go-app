import React from 'react';
import { StyleSheet, View } from 'react-native';

import { REGISTRATION_STEPS, TOTAL_REGISTRATION_STEPS } from '@/constants/registration';
import { spacing } from '@/theme';
import { toBoolean } from '@/utils/coerce';

import { StepIndicator } from '../ui/StepIndicator';
import { StepInstruction } from '../ui/StepInstruction';
import { AppHeader } from './AppHeader';
import { BottomButtonBar } from './BottomButtonBar';
import { ScreenWrapper } from './ScreenWrapper';

interface FormLayoutProps {
  stepNumber: number;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  loading?: boolean;
  showBack?: boolean;
  instruction?: string;
}

export function FormLayout({
  stepNumber,
  icon,
  children,
  onBack,
  onNext,
  nextLabel = 'NEXT',
  loading = false,
  showBack = true,
  instruction,
}: FormLayoutProps) {
  const step = REGISTRATION_STEPS[stepNumber - 1];
  const instructionText = instruction ?? step.instruction;

  return (
    <View style={styles.wrapper}>
      <ScreenWrapper contentContainerStyle={styles.scroll}>
        <AppHeader showBack={toBoolean(showBack)} onBack={onBack} icon={icon} />
        <View style={styles.content}>
          <StepIndicator
            stepNumber={stepNumber}
            totalSteps={TOTAL_REGISTRATION_STEPS}
            title={step.title}
          />
          {instructionText ? <StepInstruction text={instructionText} /> : null}
          {children}
        </View>
      </ScreenWrapper>
      <BottomButtonBar
        primaryTitle={nextLabel}
        onPrimaryPress={onNext}
        primaryLoading={toBoolean(loading)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg },
  content: { marginTop: spacing.lg },
});
