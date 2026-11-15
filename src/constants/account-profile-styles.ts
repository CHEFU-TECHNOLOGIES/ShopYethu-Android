import { StyleSheet } from "react-native";
import { palette } from "./market-theme";

const card = {
    backgroundColor: palette.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.line,
};

export const profile = StyleSheet.create({
    identityCard: { ...card, padding: 20 },
    identityHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
    avatarFrame: {
        padding: 4, borderRadius: 999, borderWidth: 1, borderColor: palette.line,
        backgroundColor: palette.paper, flexShrink: 0,
    },
    avatar: {
        width: 72, height: 72, borderRadius: 36, backgroundColor: palette.soft,
        alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden",
    },
    avatarPhoto: { position: "absolute", width: "100%", height: "100%" },
    initials: { color: palette.brand, fontSize: 26, fontWeight: "700", letterSpacing: 0.3 },
    identity: { flex: 1, minWidth: 0, gap: 6 },
    profileLabel: { color: palette.muted, fontSize: 12, lineHeight: 17, fontWeight: "500" },
    name: { color: palette.ink, fontSize: 22, lineHeight: 29, fontWeight: "700", letterSpacing: -0.5 },
    emailRow: {
        flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20,
        paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line,
    },
    emailIcon: {
        width: 30, height: 30, borderRadius: 10, backgroundColor: palette.soft,
        alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    email: { flex: 1, minWidth: 0, color: palette.muted, fontSize: 13, lineHeight: 20 },
    signIn: {
        alignItems: "stretch",
        paddingTop: 24,
        paddingBottom: 28,
        gap: 16,
    },
    eyebrow: {
        color: palette.brand,
        fontSize: 11,
        lineHeight: 16,
        fontWeight: "700",
        letterSpacing: 1.4,
    },
    signInCopy: { alignItems: "flex-start", gap: 10 },
    title: {
        color: palette.ink,
        fontSize: 32,
        lineHeight: 38,
        fontWeight: "700",
        letterSpacing: -0.9,
        textAlign: "left",
    },
    description: {
        color: palette.muted,
        fontSize: 15,
        lineHeight: 23,
        textAlign: "left",
        maxWidth: 320,
    },
    actions: { width: "100%", gap: 11 },
    hint: { color: palette.muted, fontSize: 12, lineHeight: 18, textAlign: "left" },
});
