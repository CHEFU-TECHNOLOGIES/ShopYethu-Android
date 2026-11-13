import { StyleSheet } from 'react-native';
import { palette } from './market-theme';

export const welcome = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.canvas },
  content: { flexGrow: 1, padding: 28, gap: 32 },
  brand: { alignItems: 'center', gap: 6, paddingTop: 12 },
  name: { color: palette.ink, fontSize: 23, fontWeight: '700' },
  byline: { color: palette.muted, fontSize: 12 },
  introduction: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 26 },
  icon: { width: 140, height: 140, borderRadius: 36 },
  copy: { alignItems: 'center', gap: 16, maxWidth: 340 },
  title: {
    color: palette.ink,
    fontFamily: 'serif',
    fontSize: 36,
    lineHeight: 44,
    textAlign: 'center',
  },
  description: { color: palette.muted, fontSize: 15, lineHeight: 24, textAlign: 'center' },
  actions: { gap: 12, width: '100%', maxWidth: 440, alignSelf: 'center' },
  note: { color: palette.muted, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 4 },
});
