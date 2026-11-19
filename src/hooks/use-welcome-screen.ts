import { useRef, useState } from "react";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { useWelcome } from "@/lib/welcome";

export function useWelcomeScreen() {
    const { ready, session, signIn, signUp, busy: authBusy, error } = useAuth();
    const { complete } = useWelcome();
    const entering = useRef(false);
    const [busy, setBusy] = useState(false);

    async function enter(destination: "/" | "/account") {
        if (entering.current || authBusy) return;
        entering.current = true;
        setBusy(true);
        try {
            await complete();
            router.replace(destination);
        } finally {
            entering.current = false;
            setBusy(false);
        }
    }

    async function openAccount() {
        if (entering.current || authBusy) return;
        if (session) {
            await enter("/account");
            return;
        }
        entering.current = true;
        setBusy(true);
        try {
            await complete();
            await signIn();
        } finally {
            entering.current = false;
            setBusy(false);
        }
    }

    async function openSignUp() {
        if (entering.current || authBusy) return;
        entering.current = true;
        setBusy(true);
        try {
            await complete();
            await signUp();
        } finally {
            entering.current = false;
            setBusy(false);
        }
    }

    return { ready, session, authBusy, error, busy, enter, openAccount, openSignUp };
}
