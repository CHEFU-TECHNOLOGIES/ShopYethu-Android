import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/constants/market-theme';
import { applicationStyles as styles } from '@/constants/application-styles';

export function Choice({ label, selected, onPress, disabled, checkbox = false }: {
  label: string; selected: boolean; onPress: () => void; disabled: boolean; checkbox?: boolean;
}) {
  return <Pressable accessibilityRole={checkbox ? 'checkbox' : 'radio'} accessibilityState={{ checked: selected, disabled }} disabled={disabled} onPress={onPress} style={[styles.choice, selected && styles.selected]}>
    <Ionicons name={checkbox ? selected ? 'checkbox' : 'square-outline' : selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? palette.brand : palette.muted} />
    <Text style={styles.choiceText}>{label}</Text>
  </Pressable>;
}

export function CategoryChoices({ options, value, onChange, disabled }: { options: string[]; value: string[]; onChange: (categories: string[]) => void; disabled: boolean }) {
  return <View style={styles.chips}>{options.map(category => {
    const selected = value.includes(category);
    return <Pressable key={category} accessibilityRole="checkbox" accessibilityLabel={category} accessibilityState={{ checked: selected, disabled }} disabled={disabled} onPress={() => onChange(selected ? value.filter(item => item !== category) : [...value, category])} style={[styles.chip, selected && styles.selected]}>
      <Text style={styles.chipText}>{selected ? '✓ ' : ''}{category}</Text>
    </Pressable>;
  })}</View>;
}
