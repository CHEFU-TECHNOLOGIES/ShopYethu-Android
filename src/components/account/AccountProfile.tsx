import { Button } from "@/components/market/Primitives";
import { ExternalLink } from "@/components/external-link";
import { profile } from "@/constants/account-profile-styles";
import { palette } from "@/constants/market-theme";
import { ACCOUNT_BASE } from "@/lib/config";
import type { Session } from "@/lib/session";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { Image } from "expo-image";
import Feather from "@expo/vector-icons/Feather";

function AccountAvatar({
    picture,
    initials,
}: {
    picture?: string;
    initials: string;
}) {
    const [failed, setFailed] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const uri =
        typeof picture === "string" && picture.trim().startsWith("https://")
            ? picture.trim()
            : undefined;
    return (
        <View
            style={profile.avatar}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
        >
            {!loaded || failed ? (
                <Text style={profile.initials}>{initials}</Text>
            ) : null}
            {uri && !failed ? (
                <Image
                    source={{ uri }}
                    style={[profile.avatarPhoto, !loaded && { opacity: 0 }]}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    recyclingKey={uri}
                    accessible={false}
                    onLoad={() => setLoaded(true)}
                    onError={() => setFailed(true)}
                />
            ) : null}
        </View>
    );
}

export function AccountIdentity({ user }: { user: Session["user"] }) {
    const email = user.email.trim();
    const savedName = user.name.trim();
    const name =
        savedName && savedName.toLowerCase() !== email.toLowerCase()
            ? savedName
            : "Your account";
    const words = (
        savedName && name !== "Your account" ? savedName : email.split("@")[0]
    )
        .split(/\s+/)
        .filter(Boolean);
    const initials = (
        words.length > 1
            ? [words[0], words[words.length - 1]]
            : [words[0] || "U"]
    )
        .map((word) => Array.from(word)[0])
        .join("")
        .toLocaleUpperCase();

    return (
        <ExternalLink
            href={`${ACCOUNT_BASE}/account?section=personal-info`}
            asChild
        >
            <Pressable
                accessibilityRole="link"
                accessibilityLabel="Manage your account and personal information"
                accessibilityHint="Opens My Account."
                style={({ pressed }) => [
                    profile.identityCard,
                    pressed && profile.identityCardPressed,
                ]}
            >
                <View style={profile.identityHeader}>
                    <View style={profile.avatarFrame}>
                        <AccountAvatar
                            key={`${user.uid}:${user.picture || ""}`}
                            picture={user.picture}
                            initials={initials}
                        />
                    </View>
                    <View style={profile.identity}>
                        <Text
                            accessibilityRole="header"
                            style={profile.name}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {name}
                        </Text>
                        <Text
                            style={profile.email}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            accessibilityLabel={`Email address, ${email}`}
                            selectable
                        >
                            {email}
                        </Text>
                    </View>
                </View>
                <View style={profile.manageAccount}>
                    <Text style={profile.manageAccountText}>
                        Manage account
                    </Text>
                    <Feather
                        name="external-link"
                        size={15}
                        color={palette.brand}
                        accessible={false}
                    />
                </View>
            </Pressable>
        </ExternalLink>
    );
}

export function AccountSignIn({
    busy,
    onSignIn,
}: {
    busy: boolean;
    onSignIn: () => void;
}) {
    return (
        <View style={profile.signIn}>
            <View style={profile.signInCopy}>
                <Text accessibilityRole="header" style={profile.title}>
                    Shop and sell{"\n"}with one account.
                </Text>
                <Text style={profile.description}>
                    Sign in to follow your orders and manage your store.
                </Text>
            </View>
            <View style={profile.actions}>
                <Button
                    title={busy ? "Signing in…" : "Sign in to ShopYethu"}
                    disabled={busy}
                    onPress={onSignIn}
                    trailingIcon={
                        busy ? (
                            <ActivityIndicator
                                size="small"
                                color={palette.paper}
                                accessible={false}
                            />
                        ) : undefined
                    }
                />
                
            </View>
        </View>
    );
}
