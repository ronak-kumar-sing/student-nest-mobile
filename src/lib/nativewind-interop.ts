/**
 * NativeWind only maps `className` to `style` for components it knows about.
 * Third-party components have to be registered once, before any screen renders,
 * or their `className` is silently ignored (no padding, no background).
 */
import { cssInterop } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';

cssInterop(SafeAreaView, { className: 'style' });
