import React, { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Heart } from 'lucide-react-native';
import { selectionFeedback } from '@/lib/haptics';

export interface PulseHeartProps {
  liked?: boolean;
  defaultLiked?: boolean;
  count?: number;
  showCount?: boolean;
  size?: number;
  corner?: number;
  likedColor?: string;
  idleColor?: string;
  pillColor?: string;
  textColor?: string;
  disabled?: boolean;
  onChange?: (liked: boolean, count: number) => void;
  style?: StyleProp<ViewStyle>;
}

export function PulseHeart({
  liked: controlledLiked,
  defaultLiked = false,
  count = 0,
  showCount = false,
  size = 38,
  corner = 20,
  likedColor = '#EF4444',
  idleColor = '#9CA3AF',
  pillColor = 'rgba(255, 255, 255, 0.85)',
  textColor = '#FFFFFF',
  disabled = false,
  onChange,
  style,
}: PulseHeartProps) {
  const [internalLiked, setInternalLiked] = useState(defaultLiked);
  const isLiked = controlledLiked !== undefined ? controlledLiked : internalLiked;
  const [internalCount, setInternalCount] = useState(count);

  // Heart scaling physics: squash -> swell overshoot -> settle
  const heartScale = useSharedValue(1);
  const pillScale = useSharedValue(1);

  const toggleLike = () => {
    if (disabled) return;

    selectionFeedback();
    const nextLiked = !isLiked;
    const nextCount = internalCount + (nextLiked ? 1 : -1);

    if (controlledLiked === undefined) {
      setInternalLiked(nextLiked);
    }
    setInternalCount(nextCount);
    onChange?.(nextLiked, nextCount);

    // Pill beat dip
    pillScale.set(
      withSequence(
        withTiming(0.93, { duration: 90 }),
        withSpring(1, { damping: 10, stiffness: 220 })
      )
    );

    // Heart beat animation (squash -> burst overshoot -> settle)
    heartScale.set(
      withSequence(
        withTiming(0.35, { duration: 110 }),
        withSpring(1.4, { damping: 7, stiffness: 260 }),
        withSpring(1, { damping: 12, stiffness: 180 })
      )
    );
  };

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.get() }],
  }));

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillScale.get() }],
  }));

  const iconSize = Math.round(size * 0.52);

  return (
    <Animated.View style={animatedPillStyle}>
      <TouchableOpacity
        onPress={toggleLike}
        disabled={disabled}
        activeOpacity={0.8}
        style={[
          styles.pill,
          {
            height: size,
            minWidth: showCount ? size * 1.7 : size,
            borderRadius: corner,
            backgroundColor: pillColor,
            paddingHorizontal: showCount ? 10 : 0,
          },
          style,
        ]}
        accessibilityRole="button"
        accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
      >
        <Animated.View style={animatedHeartStyle}>
          <Heart
            size={iconSize}
            color={isLiked ? likedColor : idleColor}
            fill={isLiked ? likedColor : 'transparent'}
            strokeWidth={2.2}
          />
        </Animated.View>

        {showCount && (
          <Text
            style={[
              styles.countText,
              { color: isLiked ? likedColor : textColor },
            ]}
          >
            {internalCount}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  countText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});

export default PulseHeart;

