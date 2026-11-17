import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from "react-native";
import type { Href } from "expo-router";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { ExternalLink } from "@/components/external-link";
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
  title, description, onPress, href, disabled = false, titleAccessory,
  accessibilityLabel, accessibilityRole, danger = false, divider = false,
  trailingIcon = 'chevron-right', descriptionLines = 1,
}: {
  title: string;
  description?: string;
  descriptionLines?: number;
  onPress?: () => void;
  href?: Href & string;
  disabled?: boolean;
  titleAccessory?: ReactNode;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link';
  danger?: boolean;
  divider?: boolean;
  trailingIcon?: IconName | null;
}) {
  const row = (
    <Pressable
      accessibilityRole={accessibilityRole ?? (href ? 'link' : 'button')}
      accessibilityLabel={accessibilityLabel ?? (description ? `${title}, ${description}` : title)}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={
        href
          ? StyleSheet.flatten([account.row, disabled && account.disabled])
          : ({ pressed }) => [
              account.row,
              pressed && account.pressed,
              disabled && account.disabled,
            ]
      }
      pressedStyle={href ? account.pressed : undefined}
    >
      <View style={account.rowText}>
        {titleAccessory ? (
          <View style={account.rowTitleLine}>
            <Text style={[account.rowTitle, account.rowTitleWithAccessory, danger && account.dangerText]}>{title}</Text>
            {titleAccessory}
          </View>
        ) : (
          <Text style={[account.rowTitle, danger && account.dangerText]}>{title}</Text>
        )}
        {!!description && <Text style={account.rowDescription} numberOfLines={descriptionLines} ellipsizeMode="tail">{description}</Text>}
      </View>
      {trailingIcon && <Feather name={trailingIcon} size={17} color={palette.muted} accessible={false} />}
    </Pressable>
  );

  return (
    <>
      {href ? <ExternalLink href={href} asChild>{row}</ExternalLink> : row}
      {divider && <View style={account.separator} />}
    </>
  );
}
