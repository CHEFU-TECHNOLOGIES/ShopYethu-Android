import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useSellerAccount } from "@/hooks/use-seller-account";
import { createRefreshCooldown } from "@/lib/refresh-cooldown";
import { useAuth } from "@/lib/auth";
import { toast } from "@/lib/toast";

const ACCOUNT_REFRESH_COOLDOWN_MS = 30_000;

export function useAccountScreen() {
    const router = useRouter();
    const { session, ready, busy, error, signIn, signOut } = useAuth();
    const resource = useSellerAccount();
    const signOutLock = useRef(false);
    const lastRefreshCooldownToast = useRef(0);
    const [refreshCooldown] = useState(() =>
        createRefreshCooldown(ACCOUNT_REFRESH_COOLDOWN_MS),
    );
    const [signingOut, setSigningOut] = useState(false);
    const [confirmingSignOut, setConfirmingSignOut] = useState(false);
    const [actionError, setActionError] = useState("");
    const [refreshCooldownSeconds, setRefreshCooldownSeconds] = useState(0);
    const authBusy = busy || signingOut;

    useEffect(() => {
        if (refreshCooldownSeconds <= 0) return;
        const timer = setTimeout(
            () =>
                setRefreshCooldownSeconds(
                    Math.ceil(refreshCooldown.remainingMs() / 1000),
                ),
            1000,
        );
        return () => clearTimeout(timer);
    }, [refreshCooldown, refreshCooldownSeconds]);

    function handleSignIn() {
        setActionError("");
        void signIn();
    }

    function refreshAccount() {
        if (resource.loading || resource.refreshing) return;
        if (!refreshCooldown.tryStart()) {
            const now = Date.now();
            if (now - lastRefreshCooldownToast.current >= 2000) {
                toast.info("Please wait before refreshing account status again.");
                lastRefreshCooldownToast.current = now;
            }
            return;
        }
        setRefreshCooldownSeconds(
            Math.ceil(refreshCooldown.remainingMs() / 1000),
        );
        resource.refresh();
    }

    function openNotificationSettings() {
        router.push("/notification-settings");
    }

    async function handleSignOut() {
        if (signOutLock.current || busy) return;
        signOutLock.current = true;
        setSigningOut(true);
        setActionError("");
        try {
            await signOut();
        } catch {
            setActionError("Could not sign out. Please try again.");
        } finally {
            signOutLock.current = false;
            setSigningOut(false);
        }
    }

    return {
        session,
        ready,
        busy,
        error,
        resource,
        signingOut,
        confirmingSignOut,
        setConfirmingSignOut,
        actionError,
        refreshCooldownSeconds,
        authBusy,
        version: Constants.expoConfig?.version ?? "",
        versionCode: Constants.expoConfig?.android?.versionCode ?? "",
        handleSignIn,
        refreshAccount,
        openNotificationSettings,
        handleSignOut,
    };
}
