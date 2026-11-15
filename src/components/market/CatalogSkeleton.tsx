import { StyleSheet, View } from 'react-native';
import { palette } from '@/constants/market-theme';
export function CatalogSkeleton() {
  return <View accessibilityRole="progressbar" accessibilityLabel="Loading products" accessibilityState={{ busy: true }} style={styles.grid}>
    {[0, 1, 2, 3].map(id => <View key={id} style={styles.item} accessible={false} importantForAccessibility="no-hide-descendants">
      <View style={styles.photo} /><View style={styles.line} /><View style={[styles.line, { width: '45%' }]} />
    </View>)}
  </View>;
}
const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 }, item: { width: '47%', gap: 10, marginBottom: 18 },
  photo: { aspectRatio: 0.95, backgroundColor: palette.soft, borderRadius: 16 }, line: { height: 13, width: '80%', backgroundColor: palette.soft, borderRadius: 5 } });
