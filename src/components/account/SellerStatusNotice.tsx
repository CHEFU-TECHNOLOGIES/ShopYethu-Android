import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { notice } from '@/constants/notice-styles';

export function SellerStatusNotice({ onRetry }: { onRetry: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <View style={notice.position} pointerEvents="box-none">
      <View style={notice.card}>
        <View style={notice.heading}>
          <Feather name="alert-circle" size={18} color="#DCE7DF" accessible={false} />
          <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={notice.title}>
            Seller status couldn’t refresh
          </Text>
        </View>
        <Text style={notice.message}>You’re viewing your last saved status. Try again when you’re ready.</Text>
        <View style={notice.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Dismiss seller status notice"
            onPress={() => setDismissed(true)} style={({ pressed }) => [notice.action, pressed && notice.pressed]}>
            <Text style={notice.actionText}>Dismiss</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Retry refreshing seller status"
            onPress={onRetry} style={({ pressed }) => [notice.action, notice.retry, pressed && notice.pressed]}>
            <Text style={[notice.actionText, notice.retryText]}>Retry</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
