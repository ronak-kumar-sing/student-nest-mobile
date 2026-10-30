import React, { useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { cn } from '@/lib/cn';

/* ─────────────────────────── types ─────────────────────────────── */

interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  /** List of tab definitions. */
  tabs: Tab[];
  /** Key of the currently active tab. */
  activeTab: string;
  /** Called when a tab is pressed with the tab's key. */
  onTabChange: (key: string) => void;
  /** Additional className for the outer container. */
  className?: string;
}

/* ─────────────────────────── component ────────────────────────── */

/**
 * Segmented control / tab bar with animated active indicator.
 * Scrolls horizontally when tabs overflow.
 *
 * @example
 * ```tsx
 * const [tab, setTab] = useState('all');
 * <Tabs
 *   tabs={[
 *     { key: 'all', label: 'All' },
 *     { key: 'active', label: 'Active' },
 *     { key: 'draft', label: 'Draft' },
 *   ]}
 *   activeTab={tab}
 *   onTabChange={setTab}
 * />
 * ```
 */
function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <View className={cn('border-b border-border', className)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-1 px-4"
      >
        {tabs.map((tab) => (
          <TabItem
            key={tab.key}
            tab={tab}
            isActive={activeTab === tab.key}
            onPress={() => onTabChange(tab.key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

/* ─────────────────────────── TabItem ──────────────────────────── */

interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  onPress: () => void;
}

function TabItem({ tab, isActive, onPress }: TabItemProps) {
  const indicatorOpacity = useSharedValue(isActive ? 1 : 0);

  // Animate indicator when active state changes
  React.useEffect(() => {
    indicatorOpacity.value = withTiming(isActive ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  }, [isActive, indicatorOpacity]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
  }));

  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      className="relative items-center px-3 pb-3 pt-2"
    >
      <Text
        className={cn(
          'text-sm',
          isActive ? 'font-body-semibold text-primary' : 'font-body-medium text-muted-foreground',
        )}
        maxFontSizeMultiplier={1.3}
      >
        {tab.label}
      </Text>

      {/* Animated underline indicator */}
      <Animated.View
        style={indicatorStyle}
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary"
      />
    </Pressable>
  );
}

export { Tabs };
export type { TabsProps, Tab };
