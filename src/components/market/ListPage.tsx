import type { ReactNode } from 'react';
import { FlatList, Pressable, Text, View, type FlatListProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ui } from '@/constants/market-theme';

export function ListPage<T>({ title, back, header, ...props }: Omit<FlatListProps<T>, 'ListHeaderComponent'> & { title: string; back?: boolean; header?: ReactNode }) {
  return <SafeAreaView style={ui.page} edges={['top']}>
    <FlatList {...props} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      initialNumToRender={8} maxToRenderPerBatch={8} windowSize={7}
      contentContainerStyle={[ui.content, { gap: 14 }]}
      ListHeaderComponent={<View style={{ gap: 18 }}>
        {back && <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><Text style={ui.badge}>‹ Back</Text></Pressable>}
        <Text accessibilityRole="header" style={ui.title}>{title}</Text>
        {header}
      </View>}
    />
  </SafeAreaView>;
}
