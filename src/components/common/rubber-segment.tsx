import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutChangeEvent,
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
import { selectionFeedback } from '@/lib/haptics';

export interface RubberSegmentItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface RubberSegmentProps {
  items: (string | RubberSegmentItem)[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, index: number) => void;
  trackColor?: string;
  thumbColor?: string;
  textColor?: string;
  activeTextColor?: string;
  size?: 'sm' | 'md' | 'lg';
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function RubberSegment({
  items,
  value: controlledValue,
  defaultValue,
  onChange,
  trackColor = '#1F2937',
  thumbColor = '#FFFFFF',
  textColor = '#9CA3AF',
  activeTextColor = '#111827',
  size = 'md',
  radius = 14,
  style,
}: RubberSegmentProps) {
  const normalizedItems: RubberSegmentItem[] = items.map((item) =>
    typeof item === 'string' ? { value: item, label: item } : item
  );

  const [internalValue, setInternalValue] = useState(
    defaultValue ?? normalizedItems[0]?.value ?? ''
  );
  const currentVal = controlledValue !== undefined ? controlledValue : internalValue;
  const currentIndex = Math.max(
    0,
    normalizedItems.findIndex((it) => it.value === currentVal)
  );

  const [containerWidth, setContainerWidth] = useState(0);

  const inset = 3;
  const height = size === 'sm' ? 34 : size === 'lg' ? 48 : 40;
  const slotCount = normalizedItems.length;
  const slotWidth = containerWidth > 0 ? (containerWidth - inset * 2) / slotCount : 0;

  // Rubber-band dilation shared values
  const thumbLeft = useSharedValue(0);
  const thumbWidthScale = useSharedValue(1);

  useEffect(() => {
    if (slotWidth > 0) {
      const targetLeft = inset + currentIndex * slotWidth;
      // Rubber stretch dilation effect
      thumbWidthScale.set(
        withSequence(
          withTiming(1.15, { duration: 90 }),
          withSpring(1, { damping: 14, stiffness: 220 })
        )
      );
      thumbLeft.set(withSpring(targetLeft, { damping: 16, stiffness: 200 }));
    }
  }, [currentIndex, slotWidth, thumbLeft, thumbWidthScale]);

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0) {
      setContainerWidth(width);
      thumbLeft.set(inset + currentIndex * ((width - inset * 2) / slotCount));
    }
  };

  const selectSlot = (itemValue: string, index: number) => {
    selectionFeedback();
    if (controlledValue === undefined) {
      setInternalValue(itemValue);
    }
    onChange?.(itemValue, index);
  };

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: thumbLeft.get() },
      { scaleX: thumbWidthScale.get() },
    ],
  }));

  return (
    <View
      onLayout={handleContainerLayout}
      style={[
        styles.track,
        {
          height,
          borderRadius: radius,
          backgroundColor: trackColor,
          padding: inset,
        },
        style,
      ]}
    >
      {/* Rubber Elastic Animated Thumb */}
      {slotWidth > 0 && (
        <Animated.View
          style={[
            styles.thumb,
            {
              width: slotWidth,
              height: height - inset * 2,
              borderRadius: radius - 2,
              backgroundColor: thumbColor,
            },
            animatedThumbStyle,
          ]}
        />
      )}

      {/* Segment Slots */}
      <View style={styles.slotsRow}>
        {normalizedItems.map((item, index) => {
          const isActive = index === currentIndex;
          return (
            <TouchableOpacity
              key={item.value}
              onPress={() => selectSlot(item.value, index)}
              activeOpacity={0.8}
              style={[styles.slotButton, { height: height - inset * 2 }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <View style={styles.slotContent}>
                {item.icon && <View style={styles.slotIcon}>{item.icon}</View>}
                <Text
                  style={[
                    styles.slotText,
                    {
                      color: isActive ? activeTextColor : textColor,
                      fontFamily: isActive ? 'PlusJakartaSans_700Bold' : 'Inter_500Medium',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  thumb: {
    position: 'absolute',
    top: 3,
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  slotsRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  slotButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  slotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotIcon: {
    marginRight: 2,
  },
  slotText: {
    fontSize: 12.5,
    letterSpacing: 0.1,
  },
});

export default RubberSegment;

