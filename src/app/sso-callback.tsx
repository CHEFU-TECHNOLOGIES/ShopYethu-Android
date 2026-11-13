import { Redirect } from "expo-router";
import { SignInLoading } from "@/components/auth/SignInLoading";
import { useAuth } from "@/lib/auth";

export default function Callback() {
    const { ready, busy } = useAuth();
    // AuthProvider finishes the pending OAuth request and verifies the session.
    // Account handles retries if verification fails or no request is pending.
    if (!ready || busy) return <SignInLoading />;
    return <Redirect href="/account" />;
}
