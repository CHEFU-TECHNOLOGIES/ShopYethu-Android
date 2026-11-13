import { StyleSheet } from 'react-native';
import { palette } from './market-theme';

export const authLoading = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.canvas },
  content: { flexGrow: 1, paddingHorizontal: 28, paddingVertical: 30, alignItems: 'center', gap: 24 },
  brand: { color: palette.ink, fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },
  main: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 34, paddingVertical: 32, width: '100%' },
  halo: { width: 186, height: 186, borderRadius: 93, backgroundColor: '#EFF1E9', alignItems: 'center', justifyContent: 'center' },
  track: { width: 146, height: 146, borderRadius: 73, borderWidth: 2, borderColor: '#D8E2D5', alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute', width: 146, height: 146, borderRadius: 73, borderWidth: 2,
    borderColor: 'transparent', borderTopColor: palette.brand, borderRightColor: palette.brand,
  },
  logoFrame: { padding: 9, borderRadius: 31, backgroundColor: palette.paper, borderWidth: 1, borderColor: '#E4E9DD' },
  logo: { width: 80, height: 80, borderRadius: 22 },
  copy: { alignItems: 'center', gap: 12, maxWidth: 320 },
  title: { color: palette.ink, fontSize: 28, lineHeight: 36, fontWeight: '600', textAlign: 'center', letterSpacing: -0.7 },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 23, textAlign: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, backgroundColor: palette.soft },
  footerText: { color: palette.brand, fontSize: 11, lineHeight: 17, fontWeight: '500' },
});
