import { useCallback, useEffect, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export const notificationTypes = [
    {
        key: "orderUpdates",
        title: "Order status and fulfilment",
        description:
            "Updates about order progress, collection, and fulfilment.",
    },
    {
        key: "sellerUpdates",
        title: "Seller application and store status",
        description:
            "Updates about seller applications, store reviews, and status changes.",
    },
    {
        key: "accountSecurityAlerts",
        title: "Account and security alerts",
        description:
            "Important notices about your sign-in and account security.",
    },
] as const;

export type NotificationPreferenceKey =
    (typeof notificationTypes)[number]["key"];

export type NotificationPreferences = Record<
    NotificationPreferenceKey,
    boolean
>;

const STORAGE_KEY = "shopyethu.notification-preferences.v1";
const accountStorageKey = (uid: string) =>
    `${STORAGE_KEY}.account.${encodeURIComponent(uid)}`;

const defaultPreferences: NotificationPreferences = {
    orderUpdates: true,
    sellerUpdates: true,
    accountSecurityAlerts: true,
};

function parsePreferences(value: unknown): NotificationPreferences {
    if (
        typeof value !== "object" ||
        value === null ||
        Array.isArray(value)
    ) {
        throw new Error("Notification preferences are invalid.");
    }

    const record = value as Record<string, unknown>;
    const readPreference = (key: NotificationPreferenceKey) => {
        const saved = record[key];
        if (saved === undefined) return defaultPreferences[key];
        if (typeof saved !== "boolean") {
            throw new Error("Notification preferences are invalid.");
        }
        return saved;
    };

    return {
        orderUpdates: readPreference("orderUpdates"),
        sellerUpdates: readPreference("sellerUpdates"),
        accountSecurityAlerts: readPreference("accountSecurityAlerts"),
    };
}

function parseStoredPreferences(value: string | null) {
    return value === null
        ? { ...defaultPreferences }
        : parsePreferences(JSON.parse(value) as unknown);
}

function parseServerPreferences(value: unknown) {
    if (
        typeof value !== "object" ||
        value === null ||
        Array.isArray(value)
    ) {
        throw new Error("Notification preferences are invalid.");
    }

    const response = value as Record<string, unknown>;
    if (typeof response.configured !== "boolean") {
        throw new Error("Notification preferences are invalid.");
    }

    return {
        preferences: parsePreferences(response.preferences),
        configured: response.configured,
    };
}

export function useNotificationSettings() {
    const { session, ready: authReady } = useAuth();
    const [preferences, setPreferences] =
        useState<NotificationPreferences>(defaultPreferences);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [saveError, setSaveError] = useState("");
    const [retryCount, setRetryCount] = useState(0);
    const savingLock = useRef(false);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        async function loadPreferences() {
            if (!authReady) return;
            setLoading(true);
            setLoadError("");
            setSaveError("");
            try {
                let loaded: NotificationPreferences;
                if (session) {
                    const accountKey = accountStorageKey(session.user.uid);
                    const cached = await SecureStore.getItemAsync(accountKey);
                    if (cached !== null) {
                        try {
                            loaded = parseStoredPreferences(cached);
                            if (active) setPreferences(loaded);
                            return;
                        } catch {
                            await SecureStore.deleteItemAsync(accountKey);
                        }
                    }

                    const saved = await SecureStore.getItemAsync(STORAGE_KEY);
                    const remote = parseServerPreferences(
                        await api<unknown>("/notifications/preferences"),
                    );
                    loaded = remote.preferences;

                    if (!remote.configured && saved !== null) {
                        const migrated = await api<unknown>(
                            "/notifications/preferences",
                            {
                                method: "PATCH",
                                body: JSON.stringify(
                                    parseStoredPreferences(saved),
                                ),
                            },
                        );
                        loaded = parseServerPreferences(migrated).preferences;
                    }

                    if (active) setPreferences(loaded);
                    try {
                        await SecureStore.setItemAsync(
                            accountKey,
                            JSON.stringify(loaded),
                        );
                    } catch {
                        if (active) {
                            setSaveError(
                                "Preferences loaded, but could not be cached on this device.",
                            );
                        }
                    }

                    if (saved !== null) {
                        await SecureStore.deleteItemAsync(STORAGE_KEY);
                    }
                } else {
                    const saved = await SecureStore.getItemAsync(STORAGE_KEY);
                    loaded = parseStoredPreferences(saved);
                }
                if (active) setPreferences(loaded);
            } catch {
                if (active) {
                    setLoadError(
                        "Could not load your notification preferences. Please try again.",
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadPreferences();
        return () => {
            active = false;
        };
    }, [authReady, retryCount, session]);

    const updatePreference = useCallback(
        async (key: NotificationPreferenceKey, enabled: boolean) => {
            if (savingLock.current || loading || loadError) return;

            const previous = preferences;
            const next = { ...previous, [key]: enabled };
            savingLock.current = true;
            setSaving(true);
            setSaveError("");
            setPreferences(next);

            try {
                if (session) {
                    const saved = await api<unknown>(
                        "/notifications/preferences",
                        {
                            method: "PATCH",
                            body: JSON.stringify({ [key]: enabled }),
                        },
                    );
                    const remote = parseServerPreferences(saved);
                    if (mounted.current) setPreferences(remote.preferences);
                    const cacheKey = accountStorageKey(session.user.uid);
                    let cacheInvalidated = false;
                    try {
                        await SecureStore.deleteItemAsync(cacheKey);
                        cacheInvalidated = true;
                    } catch {
                        cacheInvalidated = false;
                    }
                    try {
                        await SecureStore.setItemAsync(
                            cacheKey,
                            JSON.stringify(remote.preferences),
                        );
                    } catch {
                        if (mounted.current) {
                            setSaveError(
                                cacheInvalidated
                                    ? "Your changes were saved, but could not be cached. The next visit will reload your settings."
                                    : "Your changes were saved, but the local cache could not be updated. Please retry if old settings appear next time.",
                            );
                        }
                    }
                } else {
                    await SecureStore.setItemAsync(
                        STORAGE_KEY,
                        JSON.stringify(next),
                    );
                }
            } catch {
                if (mounted.current) {
                    setPreferences(previous);
                    setSaveError(
                        "Could not save your changes. Please try again.",
                    );
                }
            } finally {
                savingLock.current = false;
                if (mounted.current) setSaving(false);
            }
        },
        [loading, loadError, preferences, session],
    );

    const retry = useCallback(() => {
        setRetryCount((count) => count + 1);
    }, []);

    return {
        preferences,
        loading,
        saving,
        loadError,
        saveError,
        updatePreference,
        retry,
    };
}
