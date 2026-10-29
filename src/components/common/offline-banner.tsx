import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useDevSettingsStore } from '@/stores/dev-settings';

export function OfflineBanner() {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(false);
  const forceOffline = useDevSettingsStore((state) => state.isOffline);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
    });
    return () => unsubscribe();
  }, []);

  const effectivelyOffline = isOffline || forceOffline;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: reducedMotion ? (effectivelyOffline ? 1 : 0) : withTiming(effectivelyOffline ? 1 : 0, { duration: 250 }),
      height: effectivelyOffline ? 36 : 0,
    };
  }, [effectivelyOffline, reducedMotion]);

  if (!effectivelyOffline) {
    return null;
  }

  return (
    <Animated.View
      style={animatedStyle}
      className="w-full flex-row items-center justify-center bg-destructive px-3 overflow-hidden"
    >
      <WifiOff size={16} color="white" />
      <Text className="ml-2 font-body text-xs font-semibold text-white">
        {t('common.offline')} — {t('common.offlineDescription')}
      </Text>
    </Animated.View>
  );
}
