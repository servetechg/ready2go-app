import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import {
  PROFILE_DOCUMENT_MAX_BYTES,
  type ProfileDocumentKind,
} from '@/services/profile.service';
import { borderRadius, spacing } from '@/theme';
import type { LocalProfileDocument, ProfileDocumentValue } from '@/types/profileDocument';
import { getProfileDocumentLabel, isLocalProfileDocument } from '@/types/profileDocument';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

type ProfileDocumentPickerProps = {
  label: string;
  hint: string;
  value: ProfileDocumentValue | null;
  onChange: (value: ProfileDocumentValue | null) => void;
  onUpload?: (file: LocalProfileDocument) => Promise<ProfileDocumentValue | null>;
  error?: string;
  kind: ProfileDocumentKind;
};

export function ProfileDocumentPicker({
  label,
  hint,
  value,
  onChange,
  onUpload,
  error,
}: ProfileDocumentPickerProps) {
  const { colors } = useAppTheme();
  const { showError } = useToast();
  const [uploading, setUploading] = useState(false);

  const validateFile = (mimeType: string, fileSize?: number | null): boolean => {
    if (!ALLOWED_MIME.has(mimeType)) {
      showError('Use PDF, JPEG, PNG, or WebP');
      return false;
    }
    if (fileSize && fileSize > PROFILE_DOCUMENT_MAX_BYTES) {
      showError('File must be 10 MB or smaller');
      return false;
    }
    return true;
  };

  const processLocalFile = async (file: LocalProfileDocument) => {
    if (onUpload) {
      setUploading(true);
      try {
        const uploaded = await onUpload(file);
        if (uploaded) onChange(uploaded);
      } finally {
        setUploading(false);
      }
      return;
    }
    onChange(file);
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'application/octet-stream';
    if (!validateFile(mimeType, asset.size)) return;

    await processLocalFile({
      uri: asset.uri,
      name: asset.name,
      mimeType,
      ...(asset.size ? { fileSize: asset.size } : {}),
    });
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showError('Photo library permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    if (!validateFile(mimeType, asset.fileSize)) return;

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    await processLocalFile({
      uri: asset.uri,
      name: `document.${ext}`,
      mimeType,
      ...(asset.fileSize ? { fileSize: asset.fileSize } : {}),
    });
  };

  const openPicker = () => {
    if (uploading) return;
    Alert.alert(label, 'Choose a file type', [
      { text: 'PDF or document', onPress: () => void pickDocument() },
      { text: 'Photo from library', onPress: () => void pickImage() },
      ...(value ? [{ text: 'Remove', style: 'destructive' as const, onPress: () => onChange(null) }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const fileLabel = value ? getProfileDocumentLabel(value) : null;
  const isPending = value ? isLocalProfileDocument(value) : false;

  return (
    <View style={styles.block}>
      <AppText variant="label">{label}</AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        {hint}
      </AppText>
      <Pressable
        style={[
          styles.uploadButton,
          { borderColor: error ? colors.error : colors.border, backgroundColor: colors.surface },
        ]}
        onPress={openPicker}
        disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
            <AppText variant="bodySmall" color={colors.primary} style={styles.uploadText}>
              {fileLabel ? 'Replace file' : 'Upload file'}
            </AppText>
          </>
        )}
      </Pressable>
      {fileLabel ? (
        <View style={styles.fileRow}>
          <Ionicons
            name={fileLabel.toLowerCase().endsWith('.pdf') ? 'document-text-outline' : 'image-outline'}
            size={18}
            color={colors.textSecondary}
          />
          <AppText variant="caption" color={colors.textSecondary} style={styles.fileName} numberOfLines={2}>
            {fileLabel}
            {isPending ? ' (pending upload)' : ''}
          </AppText>
        </View>
      ) : null}
      {error ? (
        <AppText variant="caption" color={colors.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    paddingVertical: spacing.lg,
    minHeight: 52,
  },
  uploadText: {
    fontWeight: '600',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  fileName: {
    flex: 1,
  },
});
