import { useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import {
    ScrollView,
    Switch,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { NotificationSettingsSkeleton } from "@/components/account/NotificationSettingsSkeleton";
import { account } from "@/constants/account-styles";
import { notificationSettings } from "@/constants/notification-settings-styles";
import { palette, ui } from "@/constants/market-theme";
import {
    notificationTypes,
    useNotificationSettings,
} from "@/hooks/use-notification-settings";
import { useNotificationPermission } from "@/hooks/use-notification-permission";

export function NotificationSettingsScreen() {
    const router = useRouter();
    const {
        preferences,
        loading,
        saving,
        loadError,
        saveError,
        updatePreference,
        retry,
    } = useNotificationSettings();
    const {
        permission,
        checking: checkingPermission,
        working: updatingPermission,
        error: permissionError,
        refresh: refreshPermission,
        enable: enablePermission,
    } = useNotificationPermission();

    return (
        <SafeAreaView style={ui.page} edges={["top"]}>
            <ScrollView
                contentContainerStyle={notificationSettings.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={notificationSettings.header}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Go back to Settings"
                        onPress={() => router.back()}
                        style={({ pressed }) => [
                            notificationSettings.backButton,
                            pressed && account.pressed,
                        ]}
                    >
                        <Feather
                            name="arrow-left"
                            size={20}
                            color={palette.brand}
                            accessible={false}
                        />
                    </Pressable>
                    <View style={notificationSettings.headerCopy}>
                        <Text
                            accessibilityRole="header"
                            style={notificationSettings.title}
                        >
                            Notification settings
                        </Text>
                        <Text style={notificationSettings.subtitle}>
                            Choose the updates that matter to you.
                        </Text>
                    </View>
                </View>

                <View style={notificationSettings.permissionCard}>
                    <Text style={notificationSettings.permissionTitle}>
                        Device notifications
                    </Text>
                    <Text style={notificationSettings.permissionDescription}>
                        {checkingPermission && !permission
                            ? "Checking this device’s permission…"
                            : permission?.granted
                              ? "Notifications are allowed on this device. Push delivery for these categories is not active yet."
                              : permission && !permission.canAskAgain
                                ? "Notifications are blocked for ShopYethu. Enable them in your device settings."
                                : "Allow notifications on this device to receive alerts."}
                    </Text>
                    {!permission?.granted && (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={
                                permission && !permission.canAskAgain
                                    ? "Open device settings to allow notifications"
                                    : "Allow notifications on this device"
                            }
                            disabled={checkingPermission || updatingPermission}
                            onPress={() =>
                                permission
                                    ? void enablePermission()
                                    : void refreshPermission()
                            }
                            style={({ pressed }) => [
                                notificationSettings.permissionButton,
                                pressed && account.pressed,
                                (checkingPermission || updatingPermission) &&
                                    notificationSettings.permissionButtonDisabled,
                            ]}
                        >
                            <Text
                                style={
                                    notificationSettings.permissionButtonText
                                }
                            >
                                {checkingPermission || updatingPermission
                                    ? "Please wait…"
                                    : !permission
                                      ? "Check permission"
                                      : permission.canAskAgain
                                        ? "Allow notifications"
                                        : "Open device settings"}
                            </Text>
                        </Pressable>
                    )}
                    {!!permissionError && (
                        <Text
                            accessibilityRole="alert"
                            accessibilityLiveRegion="polite"
                            style={notificationSettings.permissionError}
                        >
                            {permissionError}
                        </Text>
                    )}
                </View>

                <View style={notificationSettings.section}>
                    <Text
                        accessibilityRole="header"
                        style={notificationSettings.sectionTitle}
                    >
                        Notification types
                    </Text>

                    {loading ? (
                        <NotificationSettingsSkeleton />
                    ) : loadError ? (
                        <View style={notificationSettings.error}>
                            <Text
                                accessibilityRole="alert"
                                accessibilityLiveRegion="polite"
                                style={notificationSettings.errorText}
                            >
                                {loadError}
                            </Text>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Retry loading notification preferences"
                                onPress={retry}
                                style={({ pressed }) => [
                                    notificationSettings.retryButton,
                                    pressed && account.pressed,
                                ]}
                            >
                                <Text style={notificationSettings.retryText}>
                                    Try again
                                </Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={notificationSettings.group}>
                            {notificationTypes.map((type, index) => (
                                <View key={type.key}>
                                    <View style={notificationSettings.row}>
                                        <View
                                            style={notificationSettings.copy}
                                        >
                                            <Text
                                                style={
                                                    notificationSettings.rowTitle
                                                }
                                            >
                                                {type.title}
                                            </Text>
                                            <Text
                                                style={
                                                    notificationSettings.description
                                                }
                                            >
                                                {type.description}
                                            </Text>
                                        </View>
                                        <Switch
                                            accessibilityLabel={type.title}
                                            accessibilityHint={
                                                type.description
                                            }
                                            value={preferences[type.key]}
                                            onValueChange={(enabled) =>
                                                void updatePreference(
                                                    type.key,
                                                    enabled,
                                                )
                                            }
                                            disabled={saving}
                                            trackColor={{
                                                false: palette.line,
                                                true: palette.brand,
                                            }}
                                            thumbColor={palette.paper}
                                        />
                                    </View>
                                    {index < notificationTypes.length - 1 && (
                                        <View
                                            style={
                                                notificationSettings.separator
                                            }
                                        />
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {!!saveError && !loadError && (
                    <Text
                        accessibilityRole="alert"
                        accessibilityLiveRegion="polite"
                        style={notificationSettings.saveError}
                    >
                        {saveError}
                    </Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
