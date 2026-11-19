import { StyleSheet } from 'react-native';
import { palette } from '@/constants/market-theme';

export const home = StyleSheet.create({
    brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    icon: { width: 34, height: 34, borderRadius: 9 },
    name: { color: palette.ink, fontSize: 23, fontWeight: '700', letterSpacing: -0.5 },
    search: {
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 8,
        borderRadius: 14,
        backgroundColor: palette.paper,
    },
    searchInput: {
        flex: 1,
        minHeight: 44,
        paddingHorizontal: 16,
        paddingLeft: 45,
        paddingVertical: 12,
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
    sectionTitle: { color: palette.ink, fontSize: 16, fontWeight: '600' },
    products: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
