import { Button } from "@/components/market/Primitives";
import { profile } from "@/constants/account-profile-styles";
import { palette } from "@/constants/market-theme";
import type { Session } from "@/lib/session";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Image } from "expo-image";

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
        <View style={profile.identityCard}>
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
        </View>
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
