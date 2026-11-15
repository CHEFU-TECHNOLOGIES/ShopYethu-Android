import type { ComponentProps, ReactNode } from 'react';
import { Text, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import Feather from '@expo/vector-icons/Feather';
import { account } from '@/constants/account-styles';
import { palette } from '@/constants/market-theme';

type IconName = ComponentProps<typeof Feather>['name'];

export function AccountSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={account.section}>
      <Text accessibilityRole="header" style={account.sectionTitle}>{title}</Text>
      <View style={account.group}>{children}</View>
    </View>
  );
}

export function AccountRow({
  icon, title, description, onPress, disabled = false, titleAccessory,
  accessibilityLabel, danger = false, divider = false, trailingIcon = 'chevron-right',
}: {
  icon: IconName;
  title: string;
  description?: string;
  onPress: () => void;
  disabled?: boolean;
  titleAccessory?: ReactNode;
  accessibilityLabel?: string;
  danger?: boolean;
  divider?: boolean;
  trailingIcon?: IconName | null;
}) {
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? (description ? `${title}, ${description}` : title)}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [account.row, pressed && account.pressed, disabled && account.disabled]}
      >
        <View style={[account.rowIcon, danger && account.dangerIcon]}>
          <Feather name={icon} size={18} color={danger ? palette.danger : palette.brand} accessible={false} />
        </View>
        <View style={account.rowText}>
          {titleAccessory ? (
            <View style={account.rowTitleLine}>
              <Text style={[account.rowTitle, account.rowTitleWithAccessory, danger && account.dangerText]}>{title}</Text>
              {titleAccessory}
            </View>
          ) : (
            <Text style={[account.rowTitle, danger && account.dangerText]}>{title}</Text>
          )}
          {!!description && <Text style={account.rowDescription} numberOfLines={1} ellipsizeMode="tail">{description}</Text>}
        </View>
        {trailingIcon && <Feather name={trailingIcon} size={17} color={palette.muted} accessible={false} />}
      </Pressable>
      {divider && <View style={account.separator} />}
    </>
  );
}
