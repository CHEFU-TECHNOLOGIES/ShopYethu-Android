import * as AuthSession from "expo-auth-session";
import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { accountUserFromInfo } from "./account-user";
import { ACCOUNT_BASE, API_BASE, CLIENT_ID, REDIRECT_URI } from "./config";
import {
    hydrateSession,
    saveSession,
    subscribe,
    type Session,
} from "./session";
import { toast } from "./toast";

WebBrowser.maybeCompleteAuthSession();
type Auth = {
    session: Session | null;
    ready: boolean;
    busy: boolean;
    error: string;
    signIn: () => Promise<void>;
    signUp: () => Promise<void>;
    signOut: () => Promise<void>;
};
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [ready, setReady] = useState(false),
        [busy, setBusy] = useState(false),
        [error, setError] = useState("");

    useEffect(() => {
        const unsubscribe = subscribe(setSession);
        let active = true;
        void hydrateSession()
            .then((value) => {
                if (active) setSession(value);
            })
            .catch(() => {
                if (active)
                    setError(
                        "Could not restore your sign-in. Please sign in again.",
                    );
            })
            .finally(() => {
                if (active) setReady(true);
            });
        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    async function authorize(accountPath: "/login" | "/register") {
        if (busy) return;
        setBusy(true);
        setError("");
        try {
            const state = randomUUID();
            const request = new AuthSession.AuthRequest({
                clientId: CLIENT_ID,
                redirectUri: REDIRECT_URI,
                scopes: ["openid", "profile", "email"],
                responseType: AuthSession.ResponseType.Code,
                usePKCE: true,
                state,
                extraParams: { nonce: randomUUID() },
            });
            const discovery = {
                authorizationEndpoint: `${API_BASE}/oauth/authorize`,
                tokenEndpoint: `${API_BASE}/oauth/token`,
            };
            const authorize = await request.makeAuthUrlAsync(discovery);
            const account = new URL(accountPath, ACCOUNT_BASE);
            account.searchParams.set("app", "shopyethu");
            account.searchParams.set("returnTo", authorize);
            account.searchParams.set("prompt", "select_account");
            const result = await request.promptAsync(discovery, {
                url: account.toString(),
            });
            if (result.type !== "success") {
                if (result.type === "error")
                    throw new Error(
                        result.params.error_description ||
                            "Sign-in was not completed.",
                    );
                return;
            }
            if (
                result.params.state !== state ||
                !result.params.code ||
                !request.codeVerifier
            )
                throw new Error("Sign-in validation failed. Please try again.");
            const token = await AuthSession.exchangeCodeAsync(
                {
                    clientId: CLIENT_ID,
                    code: result.params.code,
                    redirectUri: REDIRECT_URI,
                    extraParams: { code_verifier: request.codeVerifier },
                },
                discovery,
            );
            const response = await fetch(`${API_BASE}/oauth/userinfo`, {
                headers: { Authorization: `Bearer ${token.accessToken}` },
                signal: AbortSignal.timeout(10000),
            });
            const userInfo: unknown = await response.json();

            if (!response.ok)
                throw new Error(
                    "Unable to verify your account. Please sign in again.",
                );
            const user = accountUserFromInfo(userInfo);
            await saveSession({
                token: token.accessToken,
                refreshToken: token.refreshToken,
                expiresAt: Date.now() + (token.expiresIn || 3600) * 1000,
                user,
            });
            router.replace("/account");
            toast.success("You’re signed in.");
        } catch (cause) {
            toast.error(
                cause instanceof Error
                    ? cause.message
                    : "Sign-in failed. Please try again.",
            );
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Sign-in failed. Please try again.",
            );
        } finally {
            setBusy(false);
        }
    }
    async function signIn() {
        await authorize("/login");
    }
    async function signUp() {
        await authorize("/register");
    }
    return (
        <Context.Provider
            value={{
                session,
                ready,
                busy,
                error,
                signIn,
                signUp,
                signOut: async () => {
                    await saveSession(null);
                    toast.success("You’re signed out.");
                },
            }}
        >
            {children}
        </Context.Provider>
    );
}
export function useAuth() {
    const value = useContext(Context);
    if (!value) throw new Error("AuthProvider is required.");
    return value;
}
