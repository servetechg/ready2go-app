import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import { MAIN_STACK_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';
import type { MainStackParamList } from '@/types/navigation';

type Route = RouteProp<MainStackParamList, typeof MAIN_STACK_ROUTES.STATIC_INFO>;

export function StaticInfoScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Route>();
  const { colors } = useAppTheme();

  return (
    <ScreenWrapper>
      <View style={styles.headerPad}>
        <AppHeader title={params.title} showBack={true} onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="body" color={colors.textSecondary}>
          {params.body}
        </AppText>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerPad: { paddingHorizontal: spacing.lg },
  content: { padding: spacing.lg },
});
