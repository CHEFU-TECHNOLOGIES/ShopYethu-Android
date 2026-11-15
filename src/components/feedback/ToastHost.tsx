import { useEffect, useSyncExternalStore } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
    useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { toastStore, type ToastMessage } from "@/lib/toast";

const tones = {
    success: "#20815a",
    error: "#dc5555",
    warning: "#b97620",
    info: "#497db8",
};
const icons = {
    success: "check-circle",
    error: "alert-circle",
    warning: "alert-triangle",
    info: "info",
} as const;
function Message({ item }: { item: ToastMessage }) {
    const dark = useColorScheme() === "dark";
    useEffect(() => {
        const timer = setTimeout(
            () => toastStore.dismiss(item.id),
            item.kind === "error" ? 6500 : 4000,
        );
        return () => clearTimeout(timer);
    }, [item]);
    return (
        <View
            accessibilityRole={item.kind === "error" ? "alert" : "summary"}
            accessibilityLiveRegion="polite"
            style={[
                styles.message,
                {
                    backgroundColor: dark ? "#202724" : "#fff",
                    borderColor: dark ? "#37433c" : "#dce6df",
                },
            ]}
        >
            <Feather
                name={icons[item.kind]}
                size={20}
                color={tones[item.kind]}
                accessible={false}
            />
            <Text
                style={[styles.text, { color: dark ? "#edf4ef" : "#192b21" }]}
            >
                {item.message}
            </Text>
            {item.action && (
                <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                        toastStore.dismiss(item.id);
                        item.action?.run();
                    }}
                    style={styles.action}
                >
                    <Text
                        style={{ color: tones[item.kind], fontWeight: "700" }}
                    >
                        {item.action.label}
                    </Text>
                </Pressable>
            )}
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss notification"
                hitSlop={8}
                style={styles.close}
                onPress={() => toastStore.dismiss(item.id)}
            >
                <Feather
                    name="x"
                    size={17}
                    color={dark ? "#b2c3b8" : "#66786d"}
                />
            </Pressable>
        </View>
    );
}
export function ToastHost() {
    const messages = useSyncExternalStore(
        toastStore.subscribe,
        toastStore.get,
        toastStore.get,
    );
    const insets = useSafeAreaInsets();
    return (
        <View
            pointerEvents="box-none"
            style={[styles.host, { top: insets.top + 12 }]}
        >
            {messages.map((item) => (
                <Message key={item.id} item={item} />
            ))}
        </View>
    );
}
const styles = StyleSheet.create({
    host: {
        position: "absolute",
        left: 16,
        right: 16,
        gap: 8,
        zIndex: 1000,
        alignItems: "center",
    },
    message: {
        width: "100%",
        maxWidth: 520,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        elevation: 8,
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
    },
    text: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: "500" },
    close: { padding: 4, minHeight: 36, justifyContent: "center" },
    action: { paddingVertical: 8 },
});
