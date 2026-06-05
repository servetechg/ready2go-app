import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { deleteProfileAvatar, uploadProfileAvatar } from '@/redux/thunks/profileThunks';
import { PROFILE_AVATAR_MAX_BYTES } from '@/services/profile.service';
import { borderRadius, palette, spacing } from '@/theme';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

interface ProfileAvatarEditorProps {
  size?: number;
}

export function ProfileAvatarEditor({ size = 118 }: ProfileAvatarEditorProps) {
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useToast();
  const user = useAppSelector((s) => s.auth.user);
  const [uploading, setUploading] = useState(false);

  const ringSize = size + 14;
  const buttonSize = 34;

  const uploadAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    if (asset.fileSize && asset.fileSize > PROFILE_AVATAR_MAX_BYTES) {
      showError('Photo must be 2 MB or smaller');
      return;
    }

    const mimeType = asset.mimeType ?? 'image/jpeg';
    if (!ALLOWED_MIME.has(mimeType)) {
      showError('Use JPEG, PNG, or WebP');
      return;
    }

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    setUploading(true);
    const result = await dispatch(
      uploadProfileAvatar({
        uri: asset.uri,
        mimeType,
        name: `avatar.${ext}`,
      }),
    );
    setUploading(false);

    if (uploadProfileAvatar.fulfilled.match(result)) {
      showSuccess('Profile photo updated');
    } else {
      showError(typeof result.payload === 'string' ? result.payload : 'Could not upload photo');
    }
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showError('Photo library permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;
    await uploadAsset(result.assets[0]);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showError('Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;
    await uploadAsset(result.assets[0]);
  };

  const removePhoto = async () => {
    setUploading(true);
    const result = await dispatch(deleteProfileAvatar());
    setUploading(false);

    if (deleteProfileAvatar.fulfilled.match(result)) {
      showSuccess('Profile photo removed');
    } else {
      showError(typeof result.payload === 'string' ? result.payload : 'Could not remove photo');
    }
  };

  const openOptions = () => {
    if (uploading) return;

    const buttons: { text: string; onPress?: () => void; style?: 'destructive' | 'cancel' }[] = [
      { text: 'Choose from library', onPress: () => void pickFromLibrary() },
      { text: 'Take photo', onPress: () => void takePhoto() },
    ];

    if (user?.profilePic) {
      buttons.push({ text: 'Remove photo', onPress: () => void removePhoto(), style: 'destructive' });
    }

    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Profile photo', undefined, buttons);
  };

  return (
    <View style={styles.section}>
      <View style={[styles.ring, { width: ringSize, height: ringSize, borderColor: palette.tabActive }]}>
        <View
          style={[
            styles.avatar,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accent },
          ]}>
          {user?.profilePic ? (
            <Image
              source={{ uri: user.profilePic }}
              style={{ width: size, height: size, borderRadius: size / 2 }}
              contentFit="cover"
              accessibilityLabel="Profile photo"
            />
          ) : (
            <Ionicons name="person" size={size * 0.48} color={colors.primary} />
          )}
          {uploading ? (
            <View style={[styles.overlay, { borderRadius: size / 2 }]}>
              <ActivityIndicator color={palette.white} />
            </View>
          ) : null}
        </View>
        <Pressable
          style={[styles.cameraButton, { backgroundColor: palette.tabActive, width: buttonSize, height: buttonSize }]}
          onPress={openOptions}
          disabled={uploading}
          accessibilityLabel="Change profile photo">
          <Ionicons name="camera" size={16} color={palette.white} />
        </Pressable>
      </View>
      <Pressable onPress={openOptions} disabled={uploading}>
        <AppText variant="caption" color={colors.primary} center={true}>
          {uploading ? 'Updating photo…' : 'Change profile photo'}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  ring: {
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.white,
  },
});
