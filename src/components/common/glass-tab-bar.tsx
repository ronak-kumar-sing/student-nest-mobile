import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  ViewStyle,
  TouchableOpacity,
  GestureResponderEvent,
  StyleProp,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { selectionFeedback } from '@/lib/haptics';

export interface GlassTabButtonProps {
  to?: string;
  children: React.ReactNode;
  onPress?: (e: GestureResponderEvent | any) => void;
  accessibilityState?: { selected?: boolean };
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * iPhone Glossy Frosted Glass Tab Bar Background
 * Features high-intensity blur, specular reflection gradient, and top rim highlight.
 */
export function GlassTabBarBackground() {
  return (
    <View style={styles.glassContainer}>
      {/* Native Apple Blur Effect */}
      <BlurView
        intensity={Platform.OS === 'ios' ? 75 : 95}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />

      {/* Dark frosted glass tint layer */}
      <View style={styles.tintLayer} />

      {/* Glossy specular light sheen */}
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.22)',
          'rgba(255, 255, 255, 0.05)',
          'rgba(10, 12, 18, 0.4)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Beveled Top Rim Light Highlight (signature iPhone liquid glass look) */}
      <View style={styles.topRimHighlight} />
    </View>
  );
}

/**
 * Standard floating tab bar style that makes the tab bar float above screen content
 */
export const floatingTabBarStyle: ViewStyle = {
  position: 'absolute',
  bottom: Platform.OS === 'ios' ? 24 : 16,
  left: 18,
  right: 18,
  height: 66,
  borderRadius: 33,
  backgroundColor: 'transparent',
  borderTopWidth: 0,
  borderWidth: 0,
  elevation: 14,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.42,
  shadowRadius: 24,
  paddingBottom: 0,
  paddingTop: 0,
};

/**
 * Interactive Tab Button with haptic response
 */
export function GlassTabButton(props: GlassTabButtonProps) {
  const handlePress = (e: any) => {
    selectionFeedback();
    props.onPress?.(e);
  };

  return (
    <TouchableOpacity
      {...props}
      onPress={handlePress}
      activeOpacity={0.72}
      style={[
        props.style,
        {
          justifyContent: 'center',
          alignItems: 'center',
          height: 66,
        },
      ]}
    >
      {props.children}
    </TouchableOpacity>
  );
}

interface GlassTabIconProps {
  icon: React.ReactNode;
  focused: boolean;
  accentColor?: string;
}

/**
 * Tab icon container with an active glowing pill and subtle focus elevation
 */
export function GlassTabIcon({ icon, focused, accentColor = '#10B981' }: GlassTabIconProps) {
  return (
    <View style={styles.iconContainer}>
      {focused && (
        <View
          style={[
            styles.activeGlowPill,
            { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}44` },
          ]}
        />
      )}
      {icon}
    </View>
  );
}

const styles = StyleSheet.create({
  glassContainer: {
    ...StyleSheet.absoluteFill,
    borderRadius: 33,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  tintLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 18, 25, 0.72)',
  },
  topRimHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 30,
  },
  activeGlowPill: {
    position: 'absolute',
    width: 42,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
  },
});
