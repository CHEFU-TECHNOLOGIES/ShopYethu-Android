import { StyleSheet } from 'react-native';
import { palette } from '@/constants/market-theme';

export const home = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 34, height: 34, borderRadius: 9 },
  name: { color: palette.ink, fontSize: 23, fontWeight: '700' },
  search: {
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: palette.paper,
    color: palette.ink,
    fontSize: 15,
  },
  categories: { gap: 22 },
  category: {
    minHeight: 44,
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  selectedCategory: { borderBottomColor: palette.brand },
  categoryText: { color: palette.muted, fontSize: 13, fontWeight: '500' },
  selectedText: { color: palette.brand, fontWeight: '700' },
  sectionTitle: { color: palette.ink, fontSize: 18, fontWeight: '600' },
  products: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
