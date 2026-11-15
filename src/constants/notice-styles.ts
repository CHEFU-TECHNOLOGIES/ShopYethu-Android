import { StyleSheet } from 'react-native';
import { palette } from './market-theme';

export const notice = StyleSheet.create({
  position: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  card: {
    backgroundColor: palette.ink, borderRadius: 18, padding: 16, gap: 8,
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, color: '#FFFFFF', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  message: { color: '#DCE7DF', fontSize: 13, lineHeight: 20 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  action: { minHeight: 44, minWidth: 64, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  retry: { backgroundColor: '#FFFFFF' },
  actionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  retryText: { color: palette.ink },
  pressed: { opacity: 0.7 },
});
