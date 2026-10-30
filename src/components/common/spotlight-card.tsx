import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Pressable,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export interface SpotlightCardProps {
  children?: React.ReactNode;
  spotlightColor?: string;
  intensity?: number;
  spotlightSize?: number;
  borderGlow?: number;
  ambient?: boolean;
  flare?: boolean;
  theme?: 'dark' | 'light';
  radius?: number;
  onClick?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SpotlightCard({
  children,
  spotlightColor,
  intensity = 0.25,
  spotlightSize = 220,
  borderGlow = 0.5,
  ambient = true,
  flare = true,
  theme = 'dark',
  radius = 20,
  onClick,
  style,
}: SpotlightCardProps) {
  const isDark = theme === 'dark';
  const lightColor = spotlightColor ?? (isDark ? '#FFFFFF' : '#111827');
  const surfaceColor = isDark ? '#14171F' : '#FFFFFF';
  const baseBorderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';

  const [cardLayout, setCardLayout] = useState({ width: 340, height: 200 });

  // Spotlight position
  const spotX = useSharedValue(cardLayout.width * 0.5);
  const spotY = useSharedValue(cardLayout.height * 0.5);
  const flareScale = useSharedValue(1);
  const glowOpacity = useSharedValue(intensity);

  // Ambient gentle drift on mobile screens
  const ambientT = useSharedValue(0);

  useEffect(() => {
    if (ambient) {
      ambientT.set(
        withRepeat(
          withSequence(
            withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.quad) }),
            withTiming(0, { duration: 4200, easing: Easing.inOut(Easing.quad) })
          ),
          -1,
          true
        )
      );
    }
  }, [ambient, ambientT]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setCardLayout({ width, height });
      spotX.set(width * 0.5);
      spotY.set(height * 0.5);
    }
  };

  const handlePressIn = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    spotX.set(withTiming(locationX, { duration: 120 }));
    spotY.set(withTiming(locationY, { duration: 120 }));
    if (flare) {
      flareScale.set(withTiming(1.3, { duration: 150 }));
      glowOpacity.set(withTiming(Math.min(1, intensity * 1.8), { duration: 150 }));
    }
  };

  const handleTouchMove = (e: any) => {
    const touch = e.nativeEvent.touches?.[0];
    if (touch) {
      spotX.set(touch.locationX);
      spotY.set(touch.locationY);
    }
  };

  const handlePressOut = () => {
    flareScale.set(withTiming(1, { duration: 250 }));
    glowOpacity.set(withTiming(intensity, { duration: 250 }));
  };

  // Dynamic spotlight disc positioning style
  const animatedSpotlightStyle = useAnimatedStyle(() => {
    // If ambient drift is active and not pressed
    const driftX = interpolate(ambientT.get(), [0, 1], [-cardLayout.width * 0.25, cardLayout.width * 0.25]);
    const driftY = interpolate(ambientT.get(), [0, 1], [-cardLayout.height * 0.2, cardLayout.height * 0.2]);

    const finalX = spotX.get() + (flareScale.get() === 1 ? driftX : 0);
    const finalY = spotY.get() + (flareScale.get() === 1 ? driftY : 0);
    const size = spotlightSize * flareScale.get();

    return {
      left: finalX - size / 2,
      top: finalY - size / 2,
      width: size,
      height: size,
      borderRadius: size / 2,
      opacity: glowOpacity.get(),
      transform: [{ scale: flareScale.get() }],
    };
  });

  // Glowing border rim highlight near spotlight
  const animatedBorderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowOpacity.get(), [0, 1], [borderGlow * 0.4, borderGlow]),
  }));

  return (
    <View style={[styles.root, style]} onLayout={handleLayout}>
      <Pressable
        onPress={onClick}
        onPressIn={handlePressIn}
        onTouchMove={handleTouchMove}
        onPressOut={handlePressOut}
        style={[
          styles.container,
          {
            borderRadius: radius,
            backgroundColor: surfaceColor,
            borderColor: baseBorderColor,
          },
        ]}
      >
        {/* Soft Radial-like Spotlight Glow Disc */}
        <Animated.View
          style={[styles.spotlightDisc, animatedSpotlightStyle]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              lightColor,
              `${lightColor}80`,
              `${lightColor}20`,
              'transparent',
            ]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Ambient Top Light Flare */}
        <Animated.View
          style={[styles.topRimGlow, animatedBorderStyle, { borderColor: lightColor }]}
          pointerEvents="none"
        />

        {/* Card Content */}
        <View style={styles.content}>{children}</View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  container: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  spotlightDisc: {
    position: 'absolute',
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  topRimGlow: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1.5,
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    zIndex: 2,
  },
});

export default SpotlightCard;

