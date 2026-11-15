import { StyleSheet } from 'react-native';
import { palette } from './market-theme';

export const sellerLoading = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 48 },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: palette.soft },
  copy: { flex: 1, gap: 9 },
  bar: { borderRadius: 5, backgroundColor: palette.soft },
  title: { width: '54%', height: 14 },
  subtitle: { width: '76%', height: 10 },
  badge: { width: 112, height: 26, borderRadius: 13 },
});
