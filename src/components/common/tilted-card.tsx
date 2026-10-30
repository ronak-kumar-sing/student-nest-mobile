import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Pressable,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { selectionFeedback } from '@/lib/haptics';

export interface TiltedCardProps {
  imageSrc?: string;
  altText?: string;
  captionText?: string;
  showTooltip?: boolean;
  imageHeight?: number;
  rotateAmplitude?: number;
  scaleOnHover?: number;
  glare?: number;
  radius?: number;
  index?: number;
  onClick?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function TiltedCard({
  imageSrc,
  captionText,
  showTooltip = true,
  imageHeight = 185,
  rotateAmplitude = 14,
  scaleOnHover = 1.035,
  glare = 0.55,
  radius = 18,
  index = 0,
  onClick,
  style,
  children,
}: TiltedCardProps) {
  // Resting 3D perspective stance so the card is visibly 3D even before touch
  const restingYaw = index % 2 === 0 ? -3.5 : 3.5;
  const restingPitch = 2.5;

  // Track layout width & height dynamically for accurate touch tracking
  const [cardDimensions, setCardDimensions] = useState({ width: 340, height: 320 });

  // 3D Tilt shared values
  const rotateX = useSharedValue(restingPitch);
  const rotateY = useSharedValue(restingYaw);
  const scale = useSharedValue(1);
  const glareOpacity = useSharedValue(0.12);
  const glareX = useSharedValue(0);
  const glareY = useSharedValue(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setCardDimensions({ width, height });
    }
  };

  const updateTilt = (locX: number, locY: number) => {
    const w = cardDimensions.width || 340;
    const h = cardDimensions.height || 320;

    const normX = Math.max(-1, Math.min(1, (locX / w) * 2 - 1));
    const normY = Math.max(-1, Math.min(1, (locY / h) * 2 - 1));

    // Snappy spring response towards touch point
    rotateX.set(withSpring(-normY * rotateAmplitude, { damping: 14, stiffness: 220 }));
    rotateY.set(withSpring(normX * rotateAmplitude, { damping: 14, stiffness: 220 }));
    scale.set(withSpring(scaleOnHover, { damping: 14, stiffness: 220 }));
    glareOpacity.set(withTiming(glare, { duration: 120 }));
    glareX.set(normX * 60);
    glareY.set(normY * 45);
  };

  const handlePressIn = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    selectionFeedback();
    updateTilt(locationX, locationY);
  };

  const handleTouchMove = (e: any) => {
    const touch = e.nativeEvent.touches?.[0];
    if (touch) {
      updateTilt(touch.locationX, touch.locationY);
    }
  };

  const handlePressOut = () => {
    // Return gracefully to resting 3D perspective angle
    rotateX.set(withSpring(restingPitch, { damping: 14, stiffness: 140 }));
    rotateY.set(withSpring(restingYaw, { damping: 14, stiffness: 140 }));
    scale.set(withSpring(1, { damping: 14, stiffness: 140 }));
    glareOpacity.set(withTiming(0.12, { duration: 250 }));
    glareX.set(withTiming(0, { duration: 250 }));
    glareY.set(withTiming(0, { duration: 250 }));
  };

  // 3D Card transformation with perspective
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${rotateX.get()}deg` },
      { rotateY: `${rotateY.get()}deg` },
      { scale: scale.get() },
    ],
  }));

  // Floating 3D badge parallax effect (moves opposite to tilt for stereoscopic depth)
  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -rotateY.get() * 1.4 },
      { translateY: rotateX.get() * 1.4 },
      { scale: scale.get() },
    ],
  }));

  // Dynamic light glare shift across surface
  const animatedGlareStyle = useAnimatedStyle(() => ({
    opacity: glareOpacity.get(),
    transform: [
      { translateX: glareX.get() },
      { translateY: glareY.get() },
    ],
  }));

  return (
    <View style={[styles.root, style]} onLayout={handleLayout}>
      <Animated.View
        style={[
          styles.cardBody,
          { borderRadius: radius },
          animatedCardStyle,
        ]}
      >
        <Pressable
          onPress={onClick}
          onPressIn={handlePressIn}
          onTouchMove={handleTouchMove}
          onPressOut={handlePressOut}
          style={styles.innerPressable}
        >
          {/* Card Image Container */}
          {imageSrc && (
            <View style={[styles.imageWrapper, { height: imageHeight, borderTopLeftRadius: radius, borderTopRightRadius: radius }]}>
              <Image
                source={{ uri: imageSrc }}
                style={styles.image}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />

              {/* Dynamic 3D Glare Reflection */}
              <Animated.View
                style={[styles.glareOverlay, animatedGlareStyle]}
                pointerEvents="none"
              >
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.6)',
                    'rgba(255, 255, 255, 0.12)',
                    'transparent',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              {/* Floating 3D Parallax Tooltip Badge */}
              {showTooltip && captionText && (
                <Animated.View style={[styles.captionTag, animatedBadgeStyle]}>
                  <Text style={styles.captionText}>{captionText}</Text>
                </Animated.View>
              )}
            </View>
          )}

          {/* Details & Child Content */}
          <View style={[styles.contentWrapper, { borderBottomLeftRadius: radius, borderBottomRightRadius: radius }]}>
            {children}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    marginVertical: 8,
  },
  cardBody: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
    overflow: 'hidden',
  },
  innerPressable: {
    width: '100%',
  },
  imageWrapper: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  glareOverlay: {
    ...StyleSheet.absoluteFill,
  },
  captionTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.88)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.2,
  },
  contentWrapper: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
});

export default TiltedCard;
