import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  X,
  RotateCcw,
  Wifi,
  WifiOff,
  Sliders,
  CheckCircle2,
} from 'lucide-react-native';
import { useDevSettingsStore } from '@/stores/dev-settings';
import { useSessionStore } from '@/stores/session';
import { resetDB } from '@/api/mock/db';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';

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
      <View className="px-4 py-3 bg-card border-b border-border flex-row items-center justify-between">
        <View>
          <Text className="text-h2 font-heading text-foreground">Developer Menu</Text>
          <Text className="text-xs font-body text-muted-foreground">
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
          <Text className="text-sm font-body-semibold text-foreground mb-2">
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
                  'flex-1 py-2.5 rounded-lg border items-center capitalize',
                  role === r
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card',
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-body-semibold',
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
          <Text className="text-sm font-body-semibold text-foreground mb-2">
            Simulated Network Latency
          </Text>
          <View className="flex-row gap-2 mb-3">
            {[100, 300, 600, 1200].map((ms) => (
              <TouchableOpacity
                key={ms}
                onPress={() => setMockLatency(ms)}
                className={cn(
                  'flex-1 py-2 rounded-lg border items-center',
                  mockLatency === ms
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card',
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-body-medium',
                    mockLatency === ms ? 'text-primary font-bold' : 'text-foreground',
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
              'p-3 rounded-xl border flex-row items-center justify-between',
              isOffline ? 'border-destructive bg-destructive/10' : 'border-border bg-card',
            )}
          >
            <View className="flex-row items-center">
              {isOffline ? (
                <WifiOff size={18} className="text-destructive mr-2.5" />
              ) : (
                <Wifi size={18} className="text-foreground mr-2.5" />
              )}
              <Text
                className={cn(
                  'text-xs font-body-semibold',
                  isOffline ? 'text-destructive' : 'text-foreground',
                )}
              >
                Force Offline Mode ({isOffline ? 'ON' : 'OFF'})
              </Text>
            </View>
            <Text className="text-[11px] font-body text-muted-foreground">
              {isOffline ? 'Simulating no connection' : 'Connected'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Injection */}
        <View className="mb-6">
          <Text className="text-sm font-body-semibold text-foreground mb-2">
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
                  'p-2.5 rounded-lg border flex-row items-center justify-between',
                  forceError === code
                    ? 'border-warning bg-warning/10'
                    : 'border-border bg-card',
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-body',
                    forceError === code ? 'text-warning font-semibold' : 'text-foreground',
                  )}
                >
                  {label}
                </Text>
                {forceError === code && <CheckCircle2 size={14} color="hsl(var(--warning))" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Per-Feature API Mode Override (§6) */}
        <View className="mb-6">
          <Text className="text-sm font-body-semibold text-foreground mb-2">
            Per-Feature Transport Modes (Mock ↔ HTTP)
          </Text>
          <Text className="text-xs font-body text-muted-foreground mb-3">
            Global mode defaults to EXPO_PUBLIC_API_MODE (mock). Toggle individual features to test against the NestJS backend as phases ship.
          </Text>

          <View className="bg-card border border-border rounded-xl divide-y divide-border">
            {FEATURES.map((feature) => {
              const currentMode = apiModeOverrides[feature] ?? 'mock';
              return (
                <View
                  key={feature}
                  className="p-3 flex-row items-center justify-between"
                >
                  <Text className="text-xs font-body-medium text-foreground capitalize">
                    {feature}
                  </Text>
                  <View className="flex-row bg-muted rounded-md p-0.5">
                    <TouchableOpacity
                      onPress={() => setApiMode(feature, 'mock')}
                      className={cn(
                        'px-2.5 py-1 rounded text-center',
                        currentMode === 'mock' ? 'bg-primary' : '',
                      )}
                    >
                      <Text
                        className={cn(
                          'text-[10px] font-bold uppercase',
                          currentMode === 'mock' ? 'text-primary-foreground' : 'text-muted-foreground',
                        )}
                      >
                        Mock
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setApiMode(feature, 'http')}
                      className={cn(
                        'px-2.5 py-1 rounded text-center',
                        currentMode === 'http' ? 'bg-primary' : '',
                      )}
                    >
                      <Text
                        className={cn(
                          'text-[10px] font-bold uppercase',
                          currentMode === 'http' ? 'text-primary-foreground' : 'text-muted-foreground',
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
            className="bg-card border border-border p-3.5 rounded-xl flex-row items-center justify-center shadow-elevation-1"
          >
            <RotateCcw size={16} className="text-primary mr-2" />
            <Text className="text-xs font-body-semibold text-primary">
              Reset Mock DB to Default Seed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              resetAll();
              toast.success('Dev settings reset to default');
            }}
            className="bg-card border border-border p-3.5 rounded-xl flex-row items-center justify-center shadow-elevation-1"
          >
            <Sliders size={16} className="text-muted-foreground mr-2" />
            <Text className="text-xs font-body-semibold text-muted-foreground">
              Reset All Dev Settings
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
