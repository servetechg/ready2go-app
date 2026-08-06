import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DisasterNeedOption } from '@/components/disaster/DisasterNeedOption';
import { DisasterSurveyOptionalMediaFields } from '@/components/disaster/DisasterSurveyOptionalMediaFields';
import { DisasterSurveyThankYouModal } from '@/components/disaster/DisasterSurveyThankYouModal';
import { AppInput } from '@/components/form/AppInput';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomButtonBar } from '@/components/layout/BottomButtonBar';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import {
  DISASTER_IMMEDIATE_NEEDS,
  type DisasterImmediateNeedId,
} from '@/constants/disasterSurvey';
import { DISASTER_SURVEY_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { dismissToHomeTabs } from '@/navigation/navigationHelpers';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  markDisasterSubmitted,
  setDisasterImmediateNeeds,
  clearDisasterSurvey,
  setDisasterSurveyInvitation,
} from '@/redux/slices/disasterSurveySlice';
import {
  disasterSurveyService,
  type LocalMediaAsset,
  type DisasterSurveyMissingField,
} from '@/services/disasterSurvey.service';
import { spacing } from '@/theme';
import type { DisasterSurveyStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<
  DisasterSurveyStackParamList,
  typeof DISASTER_SURVEY_ROUTES.IMMEDIATE_NEEDS
>;

export function DisasterImmediateNeedsScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const { showError } = useToast();
  const authToken = useAppSelector((s) => s.auth.token);
  const invitation = useAppSelector((s) => s.disasterSurvey.invitation);
  const isSupplement = invitation?.status === 'needs_info';

  const requested = useMemo(
    () => new Set<DisasterSurveyMissingField>(invitation?.requestedMissingFields ?? []),
    [invitation?.requestedMissingFields],
  );

  const [selected, setSelected] = useState<DisasterImmediateNeedId[]>([]);
  const [comments, setComments] = useState('');
  const [pictures, setPictures] = useState<LocalMediaAsset[]>([]);
  const [videos, setVideos] = useState<LocalMediaAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    if (!invitation) return;
    if (isSupplement && invitation.existingImmediateNeeds?.length) {
      setSelected(invitation.existingImmediateNeeds);
    }
    if (isSupplement && invitation.existingComments) {
      setComments(invitation.existingComments);
    }
  }, [invitation, isSupplement]);

  const showComments = !isSupplement || requested.size === 0 || requested.has('comments');
  const showPictures =
    !isSupplement || requested.size === 0 || requested.has('incident_pictures');
  const showVideos = !isSupplement || requested.size === 0 || requested.has('incident_videos');

  const toggleNeed = (id: DisasterImmediateNeedId) => {
    if (isSupplement) return;
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const uploadAllMedia = async (token: string) => {
    const uploadedPictures = [];
    for (const pic of pictures) {
      uploadedPictures.push(await disasterSurveyService.uploadMedia(token, 'picture', pic));
    }
    const uploadedVideos = [];
    for (const vid of videos) {
      uploadedVideos.push(await disasterSurveyService.uploadMedia(token, 'video', vid));
    }
    return { uploadedPictures, uploadedVideos };
  };

  const handleContinue = async () => {
    if (!isSupplement && selected.length === 0) {
      showError('Select at least one immediate need to continue.');
      return;
    }
    if (!authToken || !invitation) {
      showError('Survey invitation expired. Please reopen from Settings or your notification.');
      return;
    }

    if (isSupplement) {
      const wantsComments = showComments && comments.trim().length > 0;
      const wantsPictures = showPictures && pictures.length > 0;
      const wantsVideos = showVideos && videos.length > 0;
      if (!wantsComments && !wantsPictures && !wantsVideos) {
        showError('Add at least one of the requested missing details.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const { uploadedPictures, uploadedVideos } = await uploadAllMedia(authToken);
      const commentsValue = comments.trim() || undefined;

      if (isSupplement) {
        await disasterSurveyService.supplement(authToken, {
          invitationId: invitation.invitationId,
          ...(showComments && commentsValue ? { comments: commentsValue } : {}),
          ...(showPictures && uploadedPictures.length
            ? { incidentPictures: uploadedPictures }
            : {}),
          ...(showVideos && uploadedVideos.length ? { incidentVideos: uploadedVideos } : {}),
        });
      } else {
        await disasterSurveyService.submit(authToken, {
          invitationId: invitation.invitationId,
          immediateNeeds: selected,
          comments: commentsValue,
          incidentPictures: uploadedPictures,
          incidentVideos: uploadedVideos,
        });
        dispatch(setDisasterImmediateNeeds(selected));
        dispatch(markDisasterSubmitted(new Date().toISOString()));
      }

      dispatch(setDisasterSurveyInvitation(null));
      setShowThankYou(true);
    } catch (error) {
      const reason = error instanceof Error ? error.message.trim() : '';
      showError(
        reason ||
          (isSupplement
            ? 'Failed to update survey details. Please try again.'
            : 'Failed to submit survey. Please try again.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const goHome = () => {
    setShowThankYou(false);
    dispatch(clearDisasterSurvey());
    requestAnimationFrame(() => {
      dismissToHomeTabs(navigation);
    });
  };

  return (
    <View style={styles.wrapper}>
      <ScreenWrapper contentContainerStyle={styles.content}>
        <AppHeader showBack onBack={() => navigation.goBack()} />

        <AppText variant="h3" color={colors.primary} center style={styles.title}>
          {isSupplement ? 'ADD MISSING DETAILS' : 'YOUR IMMEDIATE NEEDS'}
        </AppText>
        <AppText variant="label" color={colors.textSecondary} center style={styles.subtitle}>
          {isSupplement ? 'Optional information requested by responders' : '(Next 72 Hours)'}
        </AppText>

        {!isSupplement ? (
          <>
            <AppText variant="body" color={colors.textSecondary} style={styles.hint}>
              Select all that apply:
            </AppText>
            <View style={styles.options}>
              {DISASTER_IMMEDIATE_NEEDS.map((need) => (
                <DisasterNeedOption
                  key={need.id}
                  label={need.label}
                  icon={need.icon}
                  selected={selected.includes(need.id)}
                  onPress={() => toggleNeed(need.id)}
                />
              ))}
            </View>
          </>
        ) : selected.length > 0 ? (
          <View style={styles.options}>
            <AppText variant="body" color={colors.textSecondary} style={styles.hint}>
              Previously submitted needs:
            </AppText>
            {DISASTER_IMMEDIATE_NEEDS.filter((n) => selected.includes(n.id)).map((need) => (
              <DisasterNeedOption
                key={need.id}
                label={need.label}
                icon={need.icon}
                selected
                onPress={() => undefined}
              />
            ))}
          </View>
        ) : null}

        {showComments ? (
          <AppInput
            label="Comments (optional)"
            placeholder="Describe damage, access issues, or other notes…"
            value={comments}
            onChangeText={setComments}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={styles.commentsInput}
            containerStyle={styles.comments}
          />
        ) : null}

        <DisasterSurveyOptionalMediaFields
          pictures={pictures}
          videos={videos}
          onChangePictures={setPictures}
          onChangeVideos={setVideos}
          showPictures={showPictures}
          showVideos={showVideos}
        />
      </ScreenWrapper>

      <BottomButtonBar
        primaryTitle={isSupplement ? 'SUBMIT DETAILS' : 'SUBMIT SURVEY'}
        onPrimaryPress={() => void handleContinue()}
        primaryLoading={submitting}
      />

      <DisasterSurveyThankYouModal
        visible={showThankYou}
        needsCount={selected.length}
        onGoHome={goHome}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  title: { marginBottom: spacing.xs, marginTop: spacing.sm },
  subtitle: { marginBottom: spacing.lg },
  hint: { marginBottom: spacing.md },
  options: { marginTop: spacing.sm },
  comments: { marginTop: spacing.xl },
  commentsInput: { minHeight: 96, paddingTop: spacing.sm },
});
