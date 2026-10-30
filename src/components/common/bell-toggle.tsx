import React, { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Bell } from 'lucide-react-native';
import { selectionFeedback } from '@/lib/haptics';

export interface BellToggleProps {
  offLabel?: string;
  onLabel?: string;
  color?: string;
  background?: string;
  onColor?: string;
  onBackground?: string;
  size?: 'sm' | 'md' | 'lg';
  radius?: number;
  count?: number;
  pressed?: boolean;
  defaultPressed?: boolean;
  onChange?: (pressed: boolean) => void;
  style?: StyleProp<ViewStyle>;
}

export function BellToggle({
  offLabel = 'Notify me',
  onLabel = "You'll be notified",
  color = '#FFFFFF',
  background = '#1F2937',
  onColor = '#111827',
  onBackground = '#10B981',
  size = 'md',
  radius = 22,
  count = 0,
  pressed: controlledPressed,
  defaultPressed = false,
  onChange,
  style,
}: BellToggleProps) {
  const [internalPressed, setInternalPressed] = useState(defaultPressed);
  const isPressed = controlledPressed !== undefined ? controlledPressed : internalPressed;

  // Bell pendulum swinging keyframes
  const bellRotation = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const toggle = () => {
    selectionFeedback();
    const nextVal = !isPressed;
    if (controlledPressed === undefined) {
      setInternalPressed(nextVal);
    }
    onChange?.(nextVal);

    buttonScale.set(
      withSequence(
        withTiming(0.95, { duration: 80 }),
        withSpring(1, { damping: 10, stiffness: 220 })
      )
    );

    // Multi-pass bell ringing sequence
    if (nextVal) {
      bellRotation.set(
        withSequence(
          withTiming(20, { duration: 90 }),
          withTiming(-16, { duration: 90 }),
          withTiming(12, { duration: 90 }),
          withTiming(-8, { duration: 80 }),
          withTiming(4, { duration: 80 }),
          withTiming(0, { duration: 80 })
        )
      );
    }
  };

  const animatedBellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${bellRotation.get()}deg` }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.get() }],
  }));

  const height = size === 'sm' ? 36 : size === 'lg' ? 50 : 44;
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;

  return (
    <Animated.View style={animatedButtonStyle}>
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.85}
        style={[
          styles.button,
          {
            height,
            borderRadius: radius,
            backgroundColor: isPressed ? onBackground : background,
          },
          style,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: isPressed }}
      >
        <View style={styles.iconWrapper}>
          <Animated.View style={animatedBellStyle}>
            <Bell
              size={iconSize}
              color={isPressed ? onColor : color}
              fill={isPressed ? onColor : 'transparent'}
              strokeWidth={2.2}
            />
          </Animated.View>
          {count > 0 && isPressed && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
            </View>
          )}
        </View>

        <Text
          style={[
            styles.label,
            { color: isPressed ? onColor : color },
          ]}
        >
          {isPressed ? onLabel : offLabel}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.2,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -7,
    backgroundColor: '#EF4444',
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});

export default BellToggle;

