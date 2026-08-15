import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import {
  IDA_DOCUMENT_KIND_IDS,
  IDA_DOCUMENT_KIND_LABELS,
  type IdaDocumentKindId,
} from '@/constants/ida';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import {
  IDA_DOCUMENT_MAX_BYTES,
  IDA_MAX_DAMAGE_PHOTOS,
  IDA_MAX_DOCS_PER_KIND,
  type IdaLocalDocument,
} from '@/services/ida.service';
import { borderRadius, spacing } from '@/theme';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

type Props = {
  documents: IdaLocalDocument[];
  onChange: (next: IdaLocalDocument[]) => void;
  /** Limit which kinds are shown (e.g. supplement mode). */
  kinds?: IdaDocumentKindId[];
};

function mbLabel(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}`;
}

function maxForKind(kind: IdaDocumentKindId): number {
  return kind === 'damage_photo' ? IDA_MAX_DAMAGE_PHOTOS : IDA_MAX_DOCS_PER_KIND;
}

function uploadKind(kind: IdaDocumentKindId): 'picture' | 'document' {
  return kind === 'damage_photo' ? 'picture' : 'document';
}

export function IdaDocumentFields({
  documents,
  onChange,
  kinds = [...IDA_DOCUMENT_KIND_IDS],
}: Props) {
  const { colors } = useAppTheme();
  const { showError } = useToast();

  const countFor = (kind: IdaDocumentKindId) => documents.filter((d) => d.kind === kind).length;

  const addFile = (kind: IdaDocumentKindId, file: Omit<IdaLocalDocument, 'kind'>) => {
    const max = maxForKind(kind);
    if (countFor(kind) >= max) {
      showError(
        kind === 'damage_photo'
          ? `You can add up to ${max} damage photos`
          : `You can add up to ${max} files for this document type`,
      );
      return;
    }
    if (!ALLOWED_MIME.has(file.mimeType)) {
      showError('Use PDF, JPEG, PNG, or WebP');
      return;
    }
    if (file.fileSize && file.fileSize > IDA_DOCUMENT_MAX_BYTES) {
      showError(`Each file must be ${mbLabel(IDA_DOCUMENT_MAX_BYTES)} MB or smaller`);
      return;
    }
    onChange([...documents, { ...file, kind }]);
  };

  const pickDocument = async (kind: IdaDocumentKindId) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    addFile(kind, {
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/octet-stream',
      ...(asset.size ? { fileSize: asset.size } : {}),
    });
  };

  const pickImage = async (kind: IdaDocumentKindId) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showError('Photo library permission is required');
      return;
    }
    const remaining = maxForKind(kind) - countFor(kind);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: kind === 'damage_photo',
      selectionLimit: kind === 'damage_photo' ? remaining : 1,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;

    const accepted: IdaLocalDocument[] = [];
    for (const asset of result.assets) {
      const mimeType = asset.mimeType ?? 'image/jpeg';
      if (!ALLOWED_MIME.has(mimeType)) {
        showError('Use PDF, JPEG, PNG, or WebP');
        continue;
      }
      if (asset.fileSize && asset.fileSize > IDA_DOCUMENT_MAX_BYTES) {
        showError(`Each file must be ${mbLabel(IDA_DOCUMENT_MAX_BYTES)} MB or smaller`);
        continue;
      }
      const ext =
        mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
      accepted.push({
        uri: asset.uri,
        name: asset.fileName?.trim() || `${kind}.${ext}`,
        mimeType,
        kind,
        ...(asset.fileSize ? { fileSize: asset.fileSize } : {}),
      });
    }
    if (accepted.length) {
      const max = maxForKind(kind);
      const nextForKind = [...documents.filter((d) => d.kind === kind), ...accepted].slice(
        0,
        max,
      );
      onChange([...documents.filter((d) => d.kind !== kind), ...nextForKind]);
    }
  };

  const openPicker = (kind: IdaDocumentKindId) => {
    if (countFor(kind) >= maxForKind(kind)) {
      showError(
        kind === 'damage_photo'
          ? `You can add up to ${maxForKind(kind)} damage photos`
          : `You can add up to ${maxForKind(kind)} files for this document type`,
      );
      return;
    }
    if (kind === 'damage_photo') {
      void pickImage(kind);
      return;
    }
    Alert.alert(IDA_DOCUMENT_KIND_LABELS[kind], 'Choose a file type', [
      { text: 'PDF or document', onPress: () => void pickDocument(kind) },
      { text: 'Photo from library', onPress: () => void pickImage(kind) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.wrap}>
      {kinds.map((kind) => {
        const items = documents.filter((d) => d.kind === kind);
        const max = maxForKind(kind);
        return (
          <View key={kind} style={styles.section}>
            <AppText variant="label" color={colors.textSecondary}>
              {IDA_DOCUMENT_KIND_LABELS[kind]} (optional)
            </AppText>
            <AppText variant="bodySmall" color={colors.textSecondary} style={styles.hint}>
              Up to {max} · {mbLabel(IDA_DOCUMENT_MAX_BYTES)} MB each
              {kind === 'damage_photo' ? ' · photos' : ' · PDF or image'}
            </AppText>
            <View style={styles.list}>
              {items.map((doc) => (
                <View
                  key={`${doc.kind}-${doc.uri}`}
                  style={[
                    styles.fileRow,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}>
                  <Ionicons
                    name={
                      doc.mimeType === 'application/pdf'
                        ? 'document-text-outline'
                        : 'image-outline'
                    }
                    size={18}
                    color={colors.primary}
                  />
                  <AppText
                    variant="bodySmall"
                    color={colors.text}
                    style={styles.fileName}
                    numberOfLines={1}>
                    {doc.name}
                  </AppText>
                  <Pressable
                    onPress={() =>
                      onChange(documents.filter((d) => !(d.uri === doc.uri && d.kind === doc.kind)))
                    }
                    accessibilityLabel="Remove document">
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </Pressable>
                </View>
              ))}
              {items.length < max ? (
                <Pressable
                  style={[
                    styles.addBtn,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                  onPress={() => openPicker(kind)}>
                  <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
                  <AppText variant="bodySmall" color={colors.primary}>
                    Add {IDA_DOCUMENT_KIND_LABELS[kind].toLowerCase()}
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Maps local file kind to Cloudinary signature kind. */
export { uploadKind as idaUploadMediaKind };

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg, marginTop: spacing.md },
  section: { gap: spacing.xs },
  hint: { marginBottom: spacing.xs },
  list: { gap: spacing.sm },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  fileName: { flex: 1 },
  addBtn: {
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
