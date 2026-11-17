import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Linking, Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import {
    AndroidImportance,
    getPermissionsAsync,
    requestPermissionsAsync,
    setNotificationChannelAsync,
} from "expo-notifications";

type PermissionState = {
    granted: boolean;
    canAskAgain: boolean;
};

async function readPermission(): Promise<PermissionState> {
    if (Platform.OS === "android") {
        await setNotificationChannelAsync("default", {
            name: "ShopYethu",
            importance: AndroidImportance.DEFAULT,
        });
    }

    const permission = await getPermissionsAsync();
    return {
        granted: permission.granted,
        canAskAgain: permission.canAskAgain,
    };
}

export function useNotificationPermission() {
    const [permission, setPermission] = useState<PermissionState | null>(null);
    const [checking, setChecking] = useState(true);
    const [working, setWorking] = useState(false);
    const [error, setError] = useState("");
    const focused = useRef(false);

    const refresh = useCallback(async () => {
        if (!focused.current) return;
        setChecking(true);
        setError("");
        try {
            const current = await readPermission();
            if (focused.current) setPermission(current);
        } catch {
            if (focused.current) {
                setError(
                    "Could not check notification permission. Please try again.",
                );
            }
        } finally {
            if (focused.current) setChecking(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            focused.current = true;
            void refresh();
            return () => {
                focused.current = false;
            };
        }, [refresh]),
    );

    useEffect(() => {
        const subscription = AppState.addEventListener("change", (state) => {
            if (state === "active" && focused.current) void refresh();
        });
        return () => subscription.remove();
    }, [refresh]);

    const enable = useCallback(async () => {
        if (working) return;
        setWorking(true);
        setError("");
        try {
            let current = await readPermission();
            if (!current.granted && current.canAskAgain) {
                const requested =
                    await requestPermissionsAsync();
                current = {
                    granted: requested.granted,
                    canAskAgain: requested.canAskAgain,
                };
            } else if (!current.granted) {
                await Linking.openSettings();
            }
            if (focused.current) setPermission(current);
        } catch {
            if (focused.current) {
                setError(
                    "Could not update notification permission. Please try again.",
                );
            }
        } finally {
            if (focused.current) setWorking(false);
        }
    }, [working]);

    return { permission, checking, working, error, refresh, enable };
}
