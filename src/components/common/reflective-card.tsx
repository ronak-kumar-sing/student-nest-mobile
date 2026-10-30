import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BadgeCheck, Fingerprint } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface ReflectiveCardProps {
  name?: string;
  role?: string;
  badge?: string;
  status?: string;
  statusColor?: string;
  idLabel?: string;
  idValue?: string;
  theme?: 'dark' | 'light';
  tint?: string;
  metalness?: number;
  roughness?: number;
  shine?: number;
  glare?: number;
  enableTilt?: boolean;
  tiltStrength?: number;
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function ReflectiveCard({
  name = 'Alexander Doe',
  role = 'Senior Developer',
  badge = 'Verified',
  status = 'Active',
  statusColor = '#22c55e',
  idLabel = 'Student ID',
  idValue = 'NEST-2026-8901',
  theme = 'dark',
  enableTilt = true,
  tiltStrength = 14,
  radius = 24,
  style,
  children,
}: ReflectiveCardProps) {
  const isLight = theme === 'light';

  // 3D Tilt shared values
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const glareX = useSharedValue(0.5);
  const lift = useSharedValue(0);

  // Status dot pulse
  const dotScale = useSharedValue(1);

  React.useEffect(() => {
    dotScale.set(
      withRepeat(
        withSequence(
          withTiming(1.3, { duration: 1200 }),
          withTiming(0.9, { duration: 1200 })
        ),
        -1,
        true
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTouchMove = (e: GestureResponderEvent) => {
    if (!enableTilt) return;
    const { locationX, locationY } = e.nativeEvent;
    const cardWidth = typeof style === 'object' && style && 'width' in style ? Number((style as any).width) : SCREEN_WIDTH - 32;
    const cardHeight = 220;

    const normX = (locationX / cardWidth) * 2 - 1;
    const normY = (locationY / cardHeight) * 2 - 1;

    rotateX.set(-normY * tiltStrength);
    rotateY.set(normX * tiltStrength);
    glareX.set(locationX / cardWidth);
    lift.set(withSpring(8, { damping: 14 }));
  };

  const handleTouchEnd = () => {
    rotateX.set(withSpring(0, { damping: 14, stiffness: 140 }));
    rotateY.set(withSpring(0, { damping: 14, stiffness: 140 }));
    glareX.set(withSpring(0.5, { damping: 14 }));
    lift.set(withSpring(0, { damping: 14 }));
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${rotateX.get()}deg` },
      { rotateY: `${rotateY.get()}deg` },
      { translateY: -lift.get() },
    ],
  }));

  const animatedGlareStyle = useAnimatedStyle(() => ({
    left: `${(glareX.get() - 0.3) * 100}%`,
  }));

  const animatedDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.get() }],
  }));

  return (
    <View style={[styles.root, style]}>
      <Animated.View
        style={[styles.card, animatedCardStyle, { borderRadius: radius }]}
        onStartShouldSetResponder={() => true}
        onResponderMove={handleTouchMove}
        onResponderRelease={handleTouchEnd}
        onResponderTerminate={handleTouchEnd}
      >
        {/* Metallic Base Gradient */}
        <LinearGradient
          colors={
            isLight
              ? ['#FFFFFF', '#ECECF0', '#DFE1E6']
              : ['#282A36', '#1E1F28', '#14151C']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.metalBackground, { borderRadius: radius }]}
        />

        {/* Dynamic Sweeping Glare */}
        <Animated.View
          style={[styles.glareBand, animatedGlareStyle]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              'transparent',
              isLight ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.12)',
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Outer Chamfer Rim Highlight */}
        <View
          style={[
            styles.chamferRim,
            {
              borderRadius: radius,
              borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.14)',
            },
          ]}
          pointerEvents="none"
        />

        {/* Card Content */}
        <View style={styles.cardContent}>
          {children ?? (
            <>
              {/* Header: Verified Badge & Active Dot */}
              <View style={styles.headerRow}>
                {badge && (
                  <View style={styles.badgePill}>
                    <BadgeCheck size={16} color={isLight ? '#047857' : '#34D399'} strokeWidth={2.2} />
                    <Text style={[styles.badgeText, isLight && styles.badgeTextLight]}>
                      {badge}
                    </Text>
                  </View>
                )}

                {status && (
                  <View style={styles.statusPill}>
                    <Animated.View
                      style={[
                        styles.statusDot,
                        { backgroundColor: statusColor },
                        animatedDotStyle,
                      ]}
                    />
                    <Text style={[styles.statusText, isLight && styles.statusTextLight]}>
                      {status}
                    </Text>
                  </View>
                )}
              </View>

              {/* Identity Name & Role */}
              <View style={styles.identitySection}>
                <Text style={[styles.nameText, isLight && styles.nameTextLight]} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={[styles.roleText, isLight && styles.roleTextLight]}>
                  {role}
                </Text>
              </View>

              {/* Footer: ID and Fingerprint tile */}
              <View style={styles.footerRow}>
                <View style={styles.idBox}>
                  <Text style={styles.idLabel}>{idLabel}</Text>
                  <Text style={[styles.idValue, isLight && styles.idValueLight]}>{idValue}</Text>
                </View>

                {/* Tactile Fingerprint Hologram Tile */}
                <View style={[styles.fingerprintTile, isLight && styles.fingerprintTileLight]}>
                  <Fingerprint
                    size={22}
                    color={isLight ? '#4B5563' : 'rgba(255, 255, 255, 0.7)'}
                    strokeWidth={1.8}
                  />
                </View>
              </View>
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
  },
  card: {
    width: '100%',
    height: 210,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  metalBackground: {
    ...StyleSheet.absoluteFill,
  },
  glareBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '60%',
    transform: [{ rotate: '25deg' }, { scale: 1.5 }],
  },
  chamferRim: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1.2,
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#34D399',
  },
  badgeTextLight: {
    color: '#047857',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  statusTextLight: {
    color: '#4B5563',
  },
  identitySection: {
    marginTop: 'auto',
    marginBottom: 'auto',
    paddingVertical: 4,
  },
  nameText: {
    fontSize: 23,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  nameTextLight: {
    color: '#111827',
  },
  roleText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 3,
  },
  roleTextLight: {
    color: '#6B7280',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  idBox: {
    gap: 2,
  },
  idLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  idValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  idValueLight: {
    color: '#111827',
  },
  fingerprintTile: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  fingerprintTileLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
});

export default ReflectiveCard;
