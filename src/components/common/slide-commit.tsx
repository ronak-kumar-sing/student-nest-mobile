import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { ArrowRight, Check } from 'lucide-react-native';
import { mediumImpact } from '@/lib/haptics';

export interface SlideCommitProps {
  label?: string;
  doneLabel?: string;
  errorLabel?: string;
  onConfirm?: () => Promise<unknown> | void;
  onDone?: () => void;
  onError?: (err: unknown) => void;
  trackColor?: string;
  handleColor?: string;
  successColor?: string;
  dangerColor?: string;
  height?: number;
  radius?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SlideCommit({
  label = 'Slide to apply',
  doneLabel = 'Applied!',
  errorLabel = 'Application failed',
  onConfirm,
  onDone,
  onError,
  trackColor = '#18181B',
  handleColor = '#FFFFFF',
  successColor = '#10B981',
  dangerColor = '#EF4444',
  height = 56,
  radius = 28,
  disabled = false,
  style,
}: SlideCommitProps) {
  const [phase, setPhase] = useState<'idle' | 'pending' | 'done' | 'error'>('idle');
  const [trackWidth, setTrackWidth] = useState(300);

  const pad = 4;
  const gripSize = height - pad * 2;
  const maxTravel = Math.max(1, trackWidth - pad * 2 - gripSize);

  const translateX = useSharedValue(0);
  const shakeX = useSharedValue(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0) setTrackWidth(width);
  };

  const triggerConfirm = async () => {
    setPhase('pending');
    try {
      if (onConfirm) {
        await Promise.resolve(onConfirm());
      }
      setPhase('done');
      mediumImpact();
      onDone?.();
    } catch (err) {
      setPhase('error');
      onError?.(err);
      shakeX.set(
        withSequence(
          withTiming(-8, { duration: 60 }),
          withTiming(8, { duration: 60 }),
          withTiming(-6, { duration: 60 }),
          withTiming(6, { duration: 60 }),
          withTiming(0, { duration: 60 })
        )
      );
      setTimeout(() => {
        translateX.set(withSpring(0, { damping: 14 }));
        setPhase('idle');
      }, 1500);
    }
  };

  const panGesture = Gesture.Pan()
    .enabled(!disabled && phase === 'idle')
    .onUpdate((e) => {
      'worklet';
      const nextX = Math.max(0, Math.min(maxTravel, e.translationX));
      translateX.set(nextX);
    })
    .onEnd(() => {
      'worklet';
      if (translateX.get() >= maxTravel * 0.9) {
        translateX.set(withSpring(maxTravel, { damping: 16 }));
        runOnJS(triggerConfirm)();
      } else {
        translateX.set(withSpring(0, { damping: 14 }));
      }
    });

  const animatedHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }));

  const animatedTrackFillStyle = useAnimatedStyle(() => ({
    width: translateX.get() + gripSize + pad,
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.get(), [0, maxTravel * 0.6], [1, 0]),
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.get() }],
  }));

  return (
    <Animated.View
      onLayout={handleLayout}
      style={[
        styles.root,
        {
          height,
          borderRadius: radius,
          backgroundColor: phase === 'done' ? successColor : trackColor,
        },
        animatedContainerStyle,
        style,
      ]}
    >
      {/* Dynamic Trail Fill behind handle */}
      {phase !== 'done' && (
        <Animated.View
          style={[
            styles.trackFill,
            {
              backgroundColor: `${successColor}33`,
              borderRadius: radius,
            },
            animatedTrackFillStyle,
          ]}
        />
      )}

      {/* Centered Instructions Label */}
      <Animated.View style={[styles.labelWrap, animatedLabelStyle]} pointerEvents="none">
        <Text style={styles.labelText}>
          {phase === 'error' ? errorLabel : label}
        </Text>
      </Animated.View>

      {/* Done State Announcement */}
      {phase === 'done' && (
        <View style={styles.doneWrap} pointerEvents="none">
          <Check size={20} color="#FFFFFF" strokeWidth={2.8} />
          <Text style={styles.doneText}>{doneLabel}</Text>
        </View>
      )}

      {/* Draggable Handle */}
      {phase !== 'done' && (
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.handle,
              {
                width: gripSize,
                height: gripSize,
                borderRadius: gripSize / 2,
                top: pad,
                left: pad,
                backgroundColor: phase === 'error' ? dangerColor : handleColor,
              },
              animatedHandleStyle,
            ]}
          >
            {phase === 'pending' ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : (
              <ArrowRight size={18} color="#111827" strokeWidth={2.4} />
            )}
          </Animated.View>
        </GestureDetector>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  trackFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  labelWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.2,
  },
  doneWrap: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.2,
  },
  handle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default SlideCommit;

