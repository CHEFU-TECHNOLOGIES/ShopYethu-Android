import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import { sellerLoading as styles } from '@/constants/seller-loading-styles';

export function SellerAccountSkeleton() {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!reducedMotion) {
      opacity.value = withRepeat(withTiming(0.45, { duration: 900 }), -1, true);
    }
    return () => cancelAnimation(opacity);
  }, [opacity, reducedMotion]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel="Loading seller status"
      accessibilityState={{ busy: true }} accessibilityLiveRegion="polite">
      <Animated.View style={[styles.content, pulse]} accessible={false} importantForAccessibility="no-hide-descendants">
        <View style={styles.row}>
          <View style={styles.icon} />
          <View style={styles.copy}>
            <View style={[styles.bar, styles.title]} />
            <View style={[styles.bar, styles.subtitle]} />
          </View>
        </View>
        <View style={[styles.bar, styles.badge]} />
      </Animated.View>
    </View>
  );
}
