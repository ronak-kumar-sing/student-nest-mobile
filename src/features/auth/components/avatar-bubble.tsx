import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface AvatarBubbleProps {
  source: any;
  size: number;
  backgroundColor: string;
  borderColor?: string;
  style?: any;
}

export function AvatarBubble({
  source,
  size,
  backgroundColor,
  borderColor,
  style,
}: AvatarBubbleProps) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          borderColor: borderColor ?? 'rgba(255, 255, 255, 0.4)',
          borderWidth: borderColor ? 2 : 0,
        },
        style,
      ]}
    >
      <Image
        source={source}
        style={{ width: size * 0.82, height: size * 0.82 }}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
});
