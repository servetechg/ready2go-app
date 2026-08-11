import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { DisasterSurveyOptionalMediaFields } from '@/components/disaster/DisasterSurveyOptionalMediaFields';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomButtonBar } from '@/components/layout/BottomButtonBar';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import {
  CITIZEN_REPORT_OPTIONS,
  type CitizenReportCategoryId,
} from '@/constants/citizenActivity';
import { MAIN_STACK_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { useAppSelector } from '@/redux/hooks';
import {
  CITIZEN_ACTIVITY_MAX_PICTURES,
  CITIZEN_ACTIVITY_MAX_VIDEOS,
  CITIZEN_ACTIVITY_PICTURE_MAX_BYTES,
  CITIZEN_ACTIVITY_VIDEO_MAX_BYTES,
  citizenActivityService,
} from '@/services/citizenActivity.service';
import type { LocalMediaAsset } from '@/services/disasterSurvey.service';
import { borderRadius, spacing } from '@/theme';
import type { MainStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<MainStackParamList, typeof MAIN_STACK_ROUTES.CITIZEN_ASSISTANCE>;

export function CitizenAssistanceScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const { showError, showSuccess } = useToast();
  const authToken = useAppSelector((s) => s.auth.token);

  const [mode, setMode] = useState<'menu' | 'report'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<CitizenReportCategoryId | null>(null);
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [pictures, setPictures] = useState<LocalMediaAsset[]>([]);
  const [videos, setVideos] = useState<LocalMediaAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const resetReportForm = () => {
    setSelectedCategory(null);
    setDescription('');
    setDetails('');
    setPictures([]);
    setVideos([]);
  };

  const handleSafeCheckIn = async (isSafe: boolean) => {
    if (!authToken) {
      showError('Sign in to update your safety status.');
      return;
    }
    setSubmitting(true);
    try {
      await citizenActivityService.submitSafeCheckIn(authToken, { isSafe });
      showSuccess(
        isSafe
          ? 'You are marked safe. Responders have been notified.'
          : 'Help request sent. Stay safe — help is on the way.',
      );
      navigation.goBack();
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Could not update safety status.');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadAllMedia = async (token: string) => {
    const uploadedPictures = [];
    for (const pic of pictures) {
      uploadedPictures.push(await citizenActivityService.uploadMedia(token, 'picture', pic));
    }
    const uploadedVideos = [];
    for (const vid of videos) {
      uploadedVideos.push(await citizenActivityService.uploadMedia(token, 'video', vid));
    }
    return { uploadedPictures, uploadedVideos };
  };

  const handleSubmitReport = async () => {
    if (!authToken) {
      showError('Sign in to submit a report.');
      return;
    }
    if (!selectedCategory) {
      showError('Select a report type.');
      return;
    }
    if (description.trim().length < 3) {
      showError('Describe what you need in a few words.');
      return;
    }

    setSubmitting(true);
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }

      const { uploadedPictures, uploadedVideos } = await uploadAllMedia(authToken);

      await citizenActivityService.submitReport(authToken, {
        category: selectedCategory,
        description: description.trim(),
        details: details.trim() || undefined,
        lat,
        lng,
        pictures: uploadedPictures.length ? uploadedPictures : undefined,
        videos: uploadedVideos.length ? uploadedVideos : undefined,
      });
      showSuccess('Your report was sent to emergency coordinators.');
      navigation.goBack();
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Could not submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScreenWrapper contentContainerStyle={styles.content}>
        <AppHeader
          showBack
          onBack={() => {
            if (mode === 'report') {
              setMode('menu');
              resetReportForm();
              return;
            }
            navigation.goBack();
          }}
          title={mode === 'menu' ? 'Citizen Assistant' : 'Report a need'}
        />

        {mode === 'menu' ? (
          <ScrollView contentContainerStyle={styles.scroll}>
            <AppText variant="bodySmall" color={colors.textSecondary} style={styles.lead}>
              Let coordinators know you are safe or request help. When reporting, you can attach
              photos or a short video.
            </AppText>

            <View style={styles.safeRow}>
              <AppButton
                title="I'm safe"
                onPress={() => void handleSafeCheckIn(true)}
                disabled={submitting}
                variant="secondary"
                style={styles.safeBtn}
              />
              <AppButton
                title="I need help"
                onPress={() => void handleSafeCheckIn(false)}
                disabled={submitting}
                style={[styles.safeBtn, { backgroundColor: colors.error }]}
              />
            </View>

            <AppText variant="label" style={styles.sectionLabel}>
              Or report a specific need
            </AppText>

            {CITIZEN_REPORT_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => {
                  setSelectedCategory(option.id);
                  setMode('report');
                }}
              >
                <AppCard style={styles.optionCard}>
                  <AppText variant="label">{option.label}</AppText>
                  <AppText variant="bodySmall" color={colors.textSecondary}>
                    {option.description}
                  </AppText>
                </AppCard>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <AppText variant="label" style={styles.sectionLabel}>
              {CITIZEN_REPORT_OPTIONS.find((o) => o.id === selectedCategory)?.label}
            </AppText>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What is happening? (required)"
              placeholderTextColor={colors.textMuted}
              multiline
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Additional details (optional)"
              placeholderTextColor={colors.textMuted}
              multiline
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
            <DisasterSurveyOptionalMediaFields
              pictures={pictures}
              videos={videos}
              onChangePictures={setPictures}
              onChangeVideos={setVideos}
              picturesLabel="Pictures (optional)"
              videosLabel="Videos (optional)"
              maxPictures={CITIZEN_ACTIVITY_MAX_PICTURES}
              maxVideos={CITIZEN_ACTIVITY_MAX_VIDEOS}
              pictureMaxBytes={CITIZEN_ACTIVITY_PICTURE_MAX_BYTES}
              videoMaxBytes={CITIZEN_ACTIVITY_VIDEO_MAX_BYTES}
            />
          </ScrollView>
        )}
      </ScreenWrapper>

      {mode === 'report' ? (
        <BottomButtonBar
          primaryTitle="Submit report"
          onPrimaryPress={() => void handleSubmitReport()}
          primaryLoading={submitting}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  content: { flex: 1 },
  scroll: { paddingBottom: spacing.xxxl, gap: spacing.sm },
  lead: { marginBottom: spacing.md },
  safeRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  safeBtn: { flex: 1 },
  sectionLabel: { marginBottom: spacing.sm, marginTop: spacing.sm },
  optionCard: { marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 96,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
});
