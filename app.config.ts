import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getBundleId = () => {
  if (IS_DEV) return 'com.studentnest.app.dev';
  if (IS_PREVIEW) return 'com.studentnest.app.preview';
  return 'com.studentnest.app';
};

const getAppName = () => {
  if (IS_DEV) return 'Student Nest (Dev)';
  if (IS_PREVIEW) return 'Student Nest (Preview)';
  return 'Student Nest';
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: 'student-nest-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'studentnest',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: false,
    bundleIdentifier: getBundleId(),
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
      backgroundColor: '#E6F4FE',
    },
    package: getBundleId(),
  },
  plugins: [
    'expo-router',
    'expo-navigation-bar',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0F766E',
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
      },
    ],
    'expo-font',
    'expo-localization',
    'expo-secure-store',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: 'b235088c-bd28-4399-8ba7-503d8b433239',
    },
  },
  updates: {
    url: 'https://u.expo.dev/b235088c-bd28-4399-8ba7-503d8b433239',
  },
  runtimeVersion: {
    policy: 'fingerprint',
  },
});

