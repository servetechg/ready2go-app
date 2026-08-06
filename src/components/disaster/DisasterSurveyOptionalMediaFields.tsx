import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import {
  DISASTER_SURVEY_MAX_PICTURES,
  DISASTER_SURVEY_MAX_VIDEOS,
  DISASTER_SURVEY_PICTURE_MAX_BYTES,
  DISASTER_SURVEY_VIDEO_MAX_BYTES,
  type LocalMediaAsset,
} from '@/services/disasterSurvey.service';
import { borderRadius, spacing } from '@/theme';

const PICTURE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_MIME = new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']);

type Props = {
  pictures: LocalMediaAsset[];
  videos: LocalMediaAsset[];
  onChangePictures: (next: LocalMediaAsset[]) => void;
  onChangeVideos: (next: LocalMediaAsset[]) => void;
  /** When true, hide already-satisfied sections during a needs_info supplement. */
  showPictures?: boolean;
  showVideos?: boolean;
};

function toAsset(
  asset: ImagePicker.ImagePickerAsset,
  fallbackName: string,
  fallbackMime: string,
): LocalMediaAsset {
  const mimeType = asset.mimeType ?? fallbackMime;
  const ext =
    mimeType.includes('png')
      ? 'png'
      : mimeType.includes('webp')
        ? 'webp'
        : mimeType.includes('quicktime')
          ? 'mov'
          : mimeType.includes('webm')
            ? 'webm'
            : mimeType.startsWith('video/')
              ? 'mp4'
              : 'jpg';
  return {
    uri: asset.uri,
    mimeType,
    name: asset.fileName?.trim() || `${fallbackName}.${ext}`,
    fileSize: asset.fileSize,
  };
}

export function DisasterSurveyOptionalMediaFields({
  pictures,
  videos,
  onChangePictures,
  onChangeVideos,
  showPictures = true,
  showVideos = true,
}: Props) {
  const { colors } = useAppTheme();
  const { showError } = useToast();

  const pickPictures = async () => {
    if (pictures.length >= DISASTER_SURVEY_MAX_PICTURES) {
      showError(`You can add up to ${DISASTER_SURVEY_MAX_PICTURES} pictures`);
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showError('Photo library permission is required');
      return;
    }
    const remaining = DISASTER_SURVEY_MAX_PICTURES - pictures.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;

    const accepted: LocalMediaAsset[] = [];
    for (const asset of result.assets) {
      const item = toAsset(asset, 'incident', 'image/jpeg');
      if (!PICTURE_MIME.has(item.mimeType)) {
        showError('Use JPEG, PNG, or WebP pictures');
        continue;
      }
      if (item.fileSize && item.fileSize > DISASTER_SURVEY_PICTURE_MAX_BYTES) {
        showError('Each picture must be 10 MB or smaller');
        continue;
      }
      accepted.push(item);
    }
    if (accepted.length) {
      onChangePictures([...pictures, ...accepted].slice(0, DISASTER_SURVEY_MAX_PICTURES));
    }
  };

  const pickVideo = async () => {
    if (videos.length >= DISASTER_SURVEY_MAX_VIDEOS) {
      showError('You can add only 1 video');
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showError('Media library permission is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsMultipleSelection: false,
      videoMaxDuration: 120,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const item = toAsset(result.assets[0], 'incident-video', 'video/mp4');
    if (!VIDEO_MIME.has(item.mimeType)) {
      showError('Use MP4, MOV, or WebM videos');
      return;
    }
    if (item.fileSize && item.fileSize > DISASTER_SURVEY_VIDEO_MAX_BYTES) {
      showError('Video must be 100 MB or smaller');
      return;
    }
    onChangeVideos([...videos, item].slice(0, DISASTER_SURVEY_MAX_VIDEOS));
  };

  return (
    <View style={styles.wrap}>
      {showPictures ? (
        <View style={styles.section}>
          <AppText variant="label" color={colors.textSecondary}>
            Incident pictures (optional)
          </AppText>
          <AppText variant="bodySmall" color={colors.textSecondary} style={styles.hint}>
            Up to {DISASTER_SURVEY_MAX_PICTURES} photos · 10 MB each
          </AppText>
          <View style={styles.row}>
            {pictures.map((pic) => (
              <View key={pic.uri} style={styles.thumbWrap}>
                <Image source={{ uri: pic.uri }} style={styles.thumb} contentFit="cover" />
                <Pressable
                  style={[styles.remove, { backgroundColor: colors.error }]}
                  onPress={() => onChangePictures(pictures.filter((p) => p.uri !== pic.uri))}
                  accessibilityLabel="Remove picture"
                >
                  <Ionicons name="close" size={12} color="#fff" />
                </Pressable>
              </View>
            ))}
            {pictures.length < DISASTER_SURVEY_MAX_PICTURES ? (
              <Pressable
                style={[styles.addTile, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => void pickPictures()}
              >
                <Ionicons name="image-outline" size={22} color={colors.primary} />
                <AppText variant="bodySmall" color={colors.primary}>
                  Add
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {showVideos ? (
        <View style={styles.section}>
          <AppText variant="label" color={colors.textSecondary}>
            Incident videos (optional)
          </AppText>
          <AppText variant="bodySmall" color={colors.textSecondary} style={styles.hint}>
            1 video · up to 100 MB
          </AppText>
          <View style={styles.videoList}>
            {videos.map((vid) => (
              <View
                key={vid.uri}
                style={[styles.videoRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Ionicons name="videocam-outline" size={18} color={colors.primary} />
                <AppText variant="bodySmall" color={colors.text} style={styles.videoName} numberOfLines={1}>
                  {vid.name}
                </AppText>
                <Pressable
                  onPress={() => onChangeVideos(videos.filter((v) => v.uri !== vid.uri))}
                  accessibilityLabel="Remove video"
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </Pressable>
              </View>
            ))}
            {videos.length < DISASTER_SURVEY_MAX_VIDEOS ? (
              <Pressable
                style={[styles.addVideoBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => void pickVideo()}
              >
                <Ionicons name="videocam-outline" size={18} color={colors.primary} />
                <AppText variant="bodySmall" color={colors.primary}>
                  Add video
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.lg, gap: spacing.lg },
  section: { gap: spacing.xs },
  hint: { marginBottom: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumbWrap: { width: 84, height: 84, borderRadius: borderRadius.md, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: {
    width: 84,
    height: 84,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  videoList: { gap: spacing.sm },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  videoName: { flex: 1 },
  addVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
