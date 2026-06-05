import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/redux/hooks';

interface ProfileAvatarDisplayProps {
  size?: number;
}

export function ProfileAvatarDisplay({ size = 95 }: ProfileAvatarDisplayProps) {
  const { colors } = useAppTheme();
  const profilePic = useAppSelector((s) => s.auth.user?.profilePic);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.accent,
        },
      ]}>
      {profilePic ? (
        <Image
          source={{ uri: profilePic }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          accessibilityLabel="Profile photo"
        />
      ) : (
        <Ionicons name="person" size={size * 0.5} color={colors.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#33375D',
    overflow: 'hidden',
  },
});
