import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, RotateCcw, Wifi, WifiOff, Sliders, CheckCircle2 } from 'lucide-react-native';
import { useDevSettingsStore } from '@/stores/dev-settings';
import { useSessionStore } from '@/stores/session';
import { resetDB } from '@/api/mock/db';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

const FEATURES = [
  'auth',
  'users',
  'verification',
  'properties',
  'search',
  'favorites',
  'bookings',
  'tours',
  'inquiries',
  'notifications',
  'roommates',
  'reviews',
  'reports',
  'analytics',
] as const;

export default function DevMenuScreen() {
  const {
    apiModeOverrides,
    mockLatency,
    forceError,
    isOffline,
    setApiMode,
    setMockLatency,
    setForceError,
    setOffline,
    resetAll,
  } = useDevSettingsStore();

  const { role, setRole } = useSessionStore();

  const handleResetData = () => {
    resetDB();
    toast.success('Mock database reset to initial seeded state (faker.seed(42))');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
        <View>
          <Text className="font-heading text-h2 text-foreground">Developer Menu</Text>
          <Text className="font-body text-xs text-muted-foreground">
            Runtime overrides, mock controls & error injection
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-muted"
        >
          <X size={18} className="text-foreground" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Switch Persona Role */}
        <View className="mb-6">
          <Text className="mb-2 font-body-semibold text-sm text-foreground">
            Switch Persona Role
          </Text>
          <View className="flex-row gap-2">
            {(['student', 'owner'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => {
                  setRole(r);
                  toast.success(`Switched active role to: ${r}`);
                }}
                className={cn(
                  'flex-1 items-center rounded-lg border py-2.5 capitalize',
                  role === r ? 'border-primary bg-primary/10' : 'border-border bg-card',
                )}
              >
                <Text
                  className={cn(
                    'font-body-semibold text-xs',
                    role === r ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Network & Latency Controls */}
        <View className="mb-6">
          <Text className="mb-2 font-body-semibold text-sm text-foreground">
            Simulated Network Latency
          </Text>
          <View className="mb-3 flex-row gap-2">
            {[100, 300, 600, 1200].map((ms) => (
              <TouchableOpacity
                key={ms}
                onPress={() => setMockLatency(ms)}
                className={cn(
                  'flex-1 items-center rounded-lg border py-2',
                  mockLatency === ms ? 'border-primary bg-primary/10' : 'border-border bg-card',
                )}
              >
                <Text
                  className={cn(
                    'font-body-medium text-xs',
                    mockLatency === ms ? 'font-bold text-primary' : 'text-foreground',
                  )}
                >
                  {ms}ms
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Offline Toggle */}
          <TouchableOpacity
            onPress={() => {
              setOffline(!isOffline);
              toast.info(!isOffline ? 'Simulating offline state' : 'Restored network');
            }}
            className={cn(
              'flex-row items-center justify-between rounded-xl border p-3',
              isOffline ? 'border-destructive bg-destructive/10' : 'border-border bg-card',
            )}
          >
            <View className="flex-row items-center">
              {isOffline ? (
                <WifiOff size={18} className="mr-2.5 text-destructive" />
              ) : (
                <Wifi size={18} className="mr-2.5 text-foreground" />
              )}
              <Text
                className={cn(
                  'font-body-semibold text-xs',
                  isOffline ? 'text-destructive' : 'text-foreground',
                )}
              >
                Force Offline Mode ({isOffline ? 'ON' : 'OFF'})
              </Text>
            </View>
            <Text className="font-body text-[11px] text-muted-foreground">
              {isOffline ? 'Simulating no connection' : 'Connected'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Injection */}
        <View className="mb-6">
          <Text className="mb-2 font-body-semibold text-sm text-foreground">
            Error Injection Testing
          </Text>
          <View className="gap-2">
            {[
              { code: null, label: 'No Error (Normal)' },
              { code: 'INTERNAL_ERROR', label: 'Force 500 Internal Error' },
              { code: 'BOOKING_SLOT_TAKEN', label: 'Force 409 Slot Taken' },
              { code: 'RATE_LIMITED', label: 'Force 429 Rate Limited' },
            ].map(({ code, label }) => (
              <TouchableOpacity
                key={label}
                onPress={() => {
                  setForceError(code);
                  toast.info(code ? `Injected error: ${code}` : 'Cleared error injection');
                }}
                className={cn(
                  'flex-row items-center justify-between rounded-lg border p-2.5',
                  forceError === code ? 'border-warning bg-warning/10' : 'border-border bg-card',
                )}
              >
                <Text
                  className={cn(
                    'font-body text-xs',
                    forceError === code ? 'font-semibold text-warning' : 'text-foreground',
                  )}
                >
                  {label}
                </Text>
                {forceError === code && <CheckCircle2 size={14} color={colors.warning} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Per-Feature API Mode Override (§6) */}
        <View className="mb-6">
          <Text className="mb-2 font-body-semibold text-sm text-foreground">
            Per-Feature Transport Modes (Mock ↔ HTTP)
          </Text>
          <Text className="mb-3 font-body text-xs text-muted-foreground">
            Global mode defaults to EXPO_PUBLIC_API_MODE (mock). Toggle individual features to test
            against the NestJS backend as phases ship.
          </Text>

          <View className="divide-y divide-border rounded-xl border border-border bg-card">
            {FEATURES.map((feature) => {
              const currentMode = apiModeOverrides[feature] ?? 'mock';
              return (
                <View key={feature} className="flex-row items-center justify-between p-3">
                  <Text className="font-body-medium text-xs capitalize text-foreground">
                    {feature}
                  </Text>
                  <View className="flex-row rounded-md bg-muted p-0.5">
                    <TouchableOpacity
                      onPress={() => setApiMode(feature, 'mock')}
                      className={cn(
                        'rounded px-2.5 py-1 text-center',
                        currentMode === 'mock' ? 'bg-primary' : '',
                      )}
                    >
                      <Text
                        className={cn(
                          'text-[10px] font-bold uppercase',
                          currentMode === 'mock'
                            ? 'text-primary-foreground'
                            : 'text-muted-foreground',
                        )}
                      >
                        Mock
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setApiMode(feature, 'http')}
                      className={cn(
                        'rounded px-2.5 py-1 text-center',
                        currentMode === 'http' ? 'bg-primary' : '',
                      )}
                    >
                      <Text
                        className={cn(
                          'text-[10px] font-bold uppercase',
                          currentMode === 'http'
                            ? 'text-primary-foreground'
                            : 'text-muted-foreground',
                        )}
                      >
                        HTTP
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Reset Database Button */}
        <View className="gap-3">
          <TouchableOpacity
            onPress={handleResetData}
            className="shadow-elevation-1 flex-row items-center justify-center rounded-xl border border-border bg-card p-3.5"
          >
            <RotateCcw size={16} className="mr-2 text-primary" />
            <Text className="font-body-semibold text-xs text-primary">
              Reset Mock DB to Default Seed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              resetAll();
              toast.success('Dev settings reset to default');
            }}
            className="shadow-elevation-1 flex-row items-center justify-center rounded-xl border border-border bg-card p-3.5"
          >
            <Sliders size={16} className="mr-2 text-muted-foreground" />
            <Text className="font-body-semibold text-xs text-muted-foreground">
              Reset All Dev Settings
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
