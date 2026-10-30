import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Star } from 'lucide-react-native';
import { selectionFeedback } from '@/lib/haptics';

interface PeekRatingStarProps {
  index: number;
  count: number;
  isLit: boolean;
  activeColor: string;
  idleColor: string;
  size: number;
  lift: number;
  magnify: number;
  popScale: number;
  disabled: boolean;
  readOnly: boolean;
  onPress: (index: number) => void;
  onPressIn: (index: number) => void;
  onPressOut: (index: number) => void;
}

function PeekRatingStar({
  index,
  count,
  isLit,
  activeColor,
  idleColor,
  size,
  lift,
  magnify,
  popScale,
  disabled,
  readOnly,
  onPress,
  onPressIn,
  onPressOut,
}: PeekRatingStarProps) {
  const liftVal = useSharedValue(0);
  const scaleVal = useSharedValue(1);

  const handlePress = () => {
    onPress(index);
    scaleVal.set(
      withSequence(
        withSpring(popScale, { damping: 8, stiffness: 260 }),
        withSpring(1, { damping: 12, stiffness: 180 })
      )
    );
  };

  const handlePressIn = () => {
    onPressIn(index);
    liftVal.set(withSpring(-lift, { damping: 12 }));
    scaleVal.set(withSpring(magnify, { damping: 12 }));
  };

  const handlePressOut = () => {
    onPressOut(index);
    liftVal.set(withSpring(0, { damping: 14 }));
    scaleVal.set(withSpring(1, { damping: 14 }));
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: liftVal.get() },
      { scale: scaleVal.get() },
    ],
  }));

  const color = isLit ? activeColor : idleColor;

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={readOnly || disabled}
      activeOpacity={0.8}
      style={[styles.starButton, { width: size + 10, height: size + 8 }]}
      accessibilityLabel={`${index + 1} of ${count} stars`}
      accessibilityRole="radio"
    >
      <Animated.View style={animatedStyle}>
        <Star
          size={size}
          color={color}
          fill={isLit ? color : 'transparent'}
          strokeWidth={1.8}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

export interface PeekRatingProps {
  value?: number;
  defaultValue?: number;
  count?: number;
  labels?: string[];
  activeColor?: string;
  idleColor?: string;
  tipColor?: string;
  tipTextColor?: string;
  size?: number;
  lift?: number;
  magnify?: number;
  popScale?: number;
  showTip?: boolean;
  allowClear?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  onChange?: (val: number) => void;
  style?: StyleProp<ViewStyle>;
}

export function PeekRating({
  value: controlledValue,
  defaultValue = 0,
  count = 5,
  labels = ['Poor', 'Fair', 'Good', 'Great', 'Superb'],
  activeColor = '#F59E0B',
  idleColor = '#4B5563',
  tipColor = '#1F2937',
  tipTextColor = '#FFFFFF',
  size = 28,
  lift = 7,
  magnify = 1.2,
  popScale = 1.35,
  showTip = true,
  allowClear = true,
  readOnly = false,
  disabled = false,
  onChange,
  style,
}: PeekRatingProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentVal = controlledValue !== undefined ? controlledValue : internalValue;

  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // Animated tip horizontal offset
  const tipTranslateX = useSharedValue(0);
  const tipOpacity = useSharedValue(0);

  const handleStarPress = (index: number) => {
    if (readOnly || disabled) return;

    selectionFeedback();
    const nextVal = allowClear && currentVal === index + 1 ? 0 : index + 1;
    if (controlledValue === undefined) {
      setInternalValue(nextVal);
    }
    onChange?.(nextVal);

    // Show tip briefly on press then fade
    if (showTip && nextVal > 0) {
      setPreviewIndex(index);
      tipTranslateX.set(withSpring(index * (size + 10), { damping: 14 }));
      tipOpacity.set(withTiming(1, { duration: 150 }));
      setTimeout(() => {
        tipOpacity.set(withTiming(0, { duration: 300 }));
        setPreviewIndex(null);
      }, 1200);
    }
  };

  const handleStarPressIn = (index: number) => {
    if (readOnly || disabled) return;
    setPreviewIndex(index);
    if (showTip) {
      tipTranslateX.set(withSpring(index * (size + 10), { damping: 14 }));
      tipOpacity.set(withTiming(1, { duration: 120 }));
    }
  };

  const handleStarPressOut = () => {
    // Handled in individual star
  };

  const animatedTipStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tipTranslateX.get() }],
    opacity: tipOpacity.get(),
  }));

  const activeLabel = previewIndex !== null
    ? labels[previewIndex] ?? `${previewIndex + 1}`
    : currentVal > 0
    ? labels[currentVal - 1] ?? `${currentVal}`
    : '';

  return (
    <View style={[styles.root, style]}>
      {/* Floating Tooltip Pill */}
      {showTip && !readOnly && (
        <View style={styles.tipContainer} pointerEvents="none">
          <Animated.View
            style={[
              styles.tipPill,
              { backgroundColor: tipColor },
              animatedTipStyle,
            ]}
          >
            <Text style={[styles.tipText, { color: tipTextColor }]}>{activeLabel}</Text>
          </Animated.View>
        </View>
      )}

      {/* Row of Stars */}
      <View style={styles.row}>
        {Array.from({ length: count }, (_, i) => {
          const isLit = i < (previewIndex !== null ? previewIndex + 1 : currentVal);
          return (
            <PeekRatingStar
              key={i}
              index={i}
              count={count}
              isLit={isLit}
              activeColor={activeColor}
              idleColor={idleColor}
              size={size}
              lift={lift}
              magnify={magnify}
              popScale={popScale}
              disabled={disabled}
              readOnly={readOnly}
              onPress={handleStarPress}
              onPressIn={handleStarPressIn}
              onPressOut={handleStarPressOut}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  tipContainer: {
    height: 28,
    width: '100%',
    alignItems: 'flex-start',
    paddingLeft: 4,
    marginBottom: 4,
  },
  tipPill: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  tipText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PeekRating;
