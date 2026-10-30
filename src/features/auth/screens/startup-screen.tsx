import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { Home, Sparkles, ShieldCheck, GraduationCap, ArrowRight, Wrench } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { DriftWall } from '@/components/common/drift-wall';
import { useSessionStore } from '@/stores/session';
import { lightImpact, mediumImpact } from '@/lib/haptics';

export function StartupScreen() {
  const { isAuthenticated, role, user } = useSessionStore();
  const [hasNavigated, setHasNavigated] = useState(false);

  // Logo spring and progress indicator
  const logoScale = useSharedValue(0.7);
  const progressWidth = useSharedValue(0);

  const navigateToDestination = (targetRoute?: string) => {
    if (hasNavigated) return;
    setHasNavigated(true);

    if (targetRoute) {
      router.replace(targetRoute as any);
      return;
    }

    if (isAuthenticated) {
      if (role === 'owner') {
        router.replace('/(owner)/(tabs)/dashboard');
      } else {
        router.replace('/(student)/(tabs)/explore');
      }
    } else {
      router.replace('/(auth)');
    }
  };

  useEffect(() => {
    logoScale.set(withSpring(1, { damping: 11, stiffness: 120 }));

    progressWidth.set(
      withTiming(1, {
        duration: 2800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    const autoTimer = setTimeout(() => {
      navigateToDestination();
    }, 3200);

    return () => clearTimeout(autoTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.get() }],
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.get() * 100}%`,
  }));

  const handleGetStarted = () => {
    mediumImpact();
    navigateToDestination('/(auth)/signup');
  };

  const handleSignIn = () => {
    lightImpact();
    navigateToDestination('/(auth)/login');
  };

  const handleSkip = () => {
    lightImpact();
    navigateToDestination();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* 3D DriftWall Animated Background */}
      <DriftWall
        columns={4}
        tileWidth={135}
        tileHeight={92}
        gap={12}
        tilt={16}
        turn={-14}
        speed={26}
        dim={0.5}
        fade={0.7}
        overlayColor="#07090E"
      />

      {/* Foreground Interactive Layout */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Bar: Dev Shortcut & Skip button */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.push('/dev')}
            style={styles.devButton}
            activeOpacity={0.7}
            accessibilityLabel="Open Dev Menu"
          >
            <Wrench size={12} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.devButtonText}>Dev</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.skipButton} activeOpacity={0.7}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Center Hero Section */}
        <View style={styles.heroCenter}>
          {/* Central Frosted Brand Badge */}
          <Animated.View
            entering={ZoomIn.duration(400).springify().damping(12)}
            style={[styles.logoCard, animatedLogoStyle]}
          >
            <View style={styles.iconCircle}>
              <Home size={36} color="#FFFFFF" strokeWidth={2.4} />
            </View>
            <View style={styles.sparkleBadge}>
              <Sparkles size={11} color="#F59E0B" />
              <Text style={styles.sparkleBadgeText}>0% BROKERAGE</Text>
            </View>
          </Animated.View>

          {/* Brand Headline */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.titleContainer}>
            <Text style={styles.brandTitle}>Student Nest</Text>
            <Text style={styles.brandSubtitle}>Verified Student Homes Near Campus</Text>
          </Animated.View>

          {/* Value Proposition Pills */}
          <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.pillsRow}>
            <View style={styles.pillItem}>
              <GraduationCap size={13} color="#60A5FA" />
              <Text style={styles.pillText}>Near College</Text>
            </View>
            <View style={styles.pillItem}>
              <ShieldCheck size={13} color="#34D399" />
              <Text style={styles.pillText}>Verified Owners</Text>
            </View>
            <View style={styles.pillItem}>
              <Sparkles size={13} color="#FBBF24" />
              <Text style={styles.pillText}>Zero Deposit Hassle</Text>
            </View>
          </Animated.View>
        </View>

        {/* Bottom Section: Progress Bar & Action Buttons */}
        <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.bottomContainer}>
          {/* Sleek Startup Progress Bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, animatedProgressStyle]} />
          </View>

          {isAuthenticated ? (
            <View style={styles.authWelcomeBox}>
              <Text style={styles.authWelcomeTitle}>
                Welcome back, {user?.displayName || 'Student'}!
              </Text>
              <TouchableOpacity
                onPress={() => navigateToDestination()}
                style={styles.primaryHighlightButton}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Continue to App</Text>
                <ArrowRight size={18} color="#0D0E11" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionsBox}>
              {/* Prominent Highlighted Get Started Button */}
              <TouchableOpacity
                onPress={handleGetStarted}
                style={styles.primaryHighlightButton}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <View style={styles.buttonArrowBadge}>
                  <ArrowRight size={16} color="#0D0E11" strokeWidth={2.6} />
                </View>
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.secondaryLinksRow}>
                <TouchableOpacity onPress={handleSignIn} activeOpacity={0.7} style={styles.signInLink}>
                  <Text style={styles.signInLinkText}>
                    Already have an account? <Text style={styles.signInHighlight}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0E11',
  },
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    zIndex: 20,
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  devButtonText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginLeft: 4,
  },
  skipButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  heroCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 15,
  },
  logoCard: {
    width: 104,
    height: 104,
    borderRadius: 32,
    backgroundColor: 'rgba(26, 31, 40, 0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#0F1216',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  sparkleBadge: {
    position: 'absolute',
    bottom: -11,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  sparkleBadgeText: {
    color: '#FBBF24',
    fontSize: 9,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.5,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 28,
  },
  brandTitle: {
    fontSize: 34,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  brandSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#D1D5DB',
    marginTop: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  pillText: {
    color: '#F3F4F6',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  bottomContainer: {
    paddingHorizontal: 22,
    paddingBottom: 22,
    width: '100%',
    zIndex: 15,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 18,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 2,
  },
  actionsBox: {
    gap: 10,
  },
  authWelcomeBox: {
    gap: 12,
    alignItems: 'center',
  },
  authWelcomeTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    textAlign: 'center',
  },
  primaryHighlightButton: {
    backgroundColor: '#34D399',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#0D0E11',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.2,
  },
  buttonArrowBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(13, 14, 17, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLinksRow: {
    alignItems: 'center',
    marginTop: 2,
  },
  signInLink: {
    paddingVertical: 6,
  },
  signInLinkText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  signInHighlight: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});
