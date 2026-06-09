import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { FaqAccordionList } from '@/components/dashboard/FaqAccordionList';
import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';

export function FaqScreen() {
  const navigation = useNavigation();
  const { colors } = useAppTheme();

  return (
    <ScreenWrapper>
      <View style={styles.headerPad}>
        <AppHeader title="FAQs" showBack={true} onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
          Answers about emergency funding, hotels, FEMA coordination, and fraud prevention.
        </AppText>
        <FaqAccordionList />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerPad: {},
  content: { paddingBottom: spacing.xxxl },
  intro: { marginBottom: spacing.xl },
});
