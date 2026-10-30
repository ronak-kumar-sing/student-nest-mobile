import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface DriftWallItem {
  image: string;
  title?: string;
  href?: string;
}

const DEFAULT_ITEMS: DriftWallItem[] = [
  { image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80&auto=format&fit=crop', title: 'Modern Studio PG' },
  { image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80&auto=format&fit=crop', title: 'Student Residency' },
  { image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80&auto=format&fit=crop', title: 'Campus Loft' },
  { image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80&auto=format&fit=crop', title: 'Private 1BHK' },
  { image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80&auto=format&fit=crop', title: 'Twin Sharing Room' },
  { image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&q=80&auto=format&fit=crop', title: 'Girls PG Hostel' },
  { image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80&auto=format&fit=crop', title: 'Luxury Nest Apartment' },
  { image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80&auto=format&fit=crop', title: 'Co-Living Nest' },
  { image: 'https://images.unsplash.com/photo-1540518614846-7ede433c4570?w=600&q=80&auto=format&fit=crop', title: 'Study Suite' },
  { image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80&auto=format&fit=crop', title: 'Cozy Quad Room' },
];

export interface DriftWallProps {
  items?: DriftWallItem[];
  columns?: number;
  tileWidth?: number;
  tileHeight?: number;
  gap?: number;
  radius?: number;
  tilt?: number;
  turn?: number;
  roll?: number;
  perspective?: number;
  depth?: number;
  speed?: number;
  direction?: 'up' | 'down';
  variance?: number;
  fade?: number;
  dim?: number;
  overlayColor?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function DriftingColumn({
  items,
  colIndex,
  tileWidth,
  tileHeight,
  gap,
  radius,
  dim,
  overlayColor,
  speed,
  direction,
}: {
  items: DriftWallItem[];
  colIndex: number;
  tileWidth: number;
  tileHeight: number;
  gap: number;
  radius: number;
  dim: number;
  overlayColor: string;
  speed: number;
  direction: 'up' | 'down';
}) {
  const totalUnit = tileHeight + gap;
  const loopHeight = items.length * totalUnit;

  const translateY = useSharedValue(0);

  useEffect(() => {
    const isAlt = colIndex % 2 === 0;
    const dirSign = direction === 'up' ? -1 : 1;
    const finalDir = isAlt ? dirSign : -dirSign;

    const baseDuration = (loopHeight / Math.max(speed, 5)) * 1000;
    const duration = baseDuration * (0.85 + (colIndex % 3) * 0.15);

    translateY.set(0);
    translateY.set(
      withRepeat(
        withTiming(finalDir * loopHeight, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loopHeight, speed, direction, colIndex]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  // Double the items array for infinite looping
  const duplicatedItems = useMemo(() => [...items, ...items, ...items], [items]);

  return (
    <View style={[styles.columnWrapper, { width: tileWidth, marginRight: gap }]}>
      <Animated.View style={[styles.columnTrack, animatedStyle]}>
        {duplicatedItems.map((item, idx) => (
          <View
            key={`col-${colIndex}-item-${idx}`}
            style={[
              styles.tileContainer,
              {
                width: tileWidth,
                height: tileHeight,
                marginBottom: gap,
                borderRadius: radius,
                opacity: dim,
              },
            ]}
          >
            <Image
              source={{ uri: item.image }}
              style={[styles.tileImage, { borderRadius: radius }]}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={150}
            />
            <View
              style={[
                styles.tileOverlay,
                { backgroundColor: overlayColor, borderRadius: radius },
              ]}
            />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

export function DriftWall({
  items = DEFAULT_ITEMS,
  columns = 4,
  tileWidth = 145,
  tileHeight = 98,
  gap = 14,
  radius = 14,
  tilt = 16,
  turn = -14,
  roll = 0,
  perspective = 900,
  speed = 28,
  direction = 'up',
  fade = 0.65,
  dim = 0.55,
  overlayColor = '#060010',
  style,
  children,
}: DriftWallProps) {
  // Partition items into columns
  const columnData = useMemo(() => {
    const cols: DriftWallItem[][] = Array.from({ length: columns }, () => []);
    items.forEach((item, i) => cols[i % columns]!.push(item));
    return cols.map((col) => (col.length ? col : [items[0]!]));
  }, [items, columns]);

  return (
    <View style={[styles.container, style]}>
      {/* 3D Perspective Plane */}
      <View
        style={[
          styles.planeContainer,
          {
            transform: [
              { perspective },
              { rotateX: `${tilt}deg` },
              { rotateY: `${turn}deg` },
              { rotateZ: `${roll}deg` },
              { scale: 1.15 },
            ],
          },
        ]}
      >
        <View style={styles.planeRow}>
          {columnData.map((colItems, c) => (
            <DriftingColumn
              key={`col-${c}`}
              items={colItems}
              colIndex={c}
              tileWidth={tileWidth}
              tileHeight={tileHeight}
              gap={gap}
              radius={radius}
              dim={dim}
              overlayColor={overlayColor}
              speed={speed}
              direction={direction}
            />
          ))}
        </View>
      </View>

      {/* Top Edge Dissolve Gradient */}
      <LinearGradient
        colors={['#0D0E11', 'rgba(13, 14, 17, 0.75)', 'transparent']}
        style={[styles.edgeGradient, styles.edgeTop, { opacity: fade }]}
        pointerEvents="none"
      />

      {/* Bottom Edge Dissolve Gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(13, 14, 17, 0.85)', '#0D0E11']}
        style={[styles.edgeGradient, styles.edgeBottom, { opacity: fade }]}
        pointerEvents="none"
      />

      {/* Foreground Content */}
      {children && <View style={styles.foregroundContainer}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#0D0E11',
  },
  planeContainer: {
    position: 'absolute',
    top: -SCREEN_HEIGHT * 0.25,
    left: -SCREEN_WIDTH * 0.2,
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_HEIGHT * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  columnWrapper: {
    overflow: 'hidden',
    height: SCREEN_HEIGHT * 1.6,
  },
  columnTrack: {
    flexDirection: 'column',
  },
  tileContainer: {
    position: 'relative',
    backgroundColor: '#1E232D',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.35,
  },
  edgeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '35%',
    zIndex: 5,
  },
  edgeTop: {
    top: 0,
  },
  edgeBottom: {
    bottom: 0,
  },
  foregroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: 'space-between',
  },
});

export default DriftWall;

