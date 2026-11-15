import { StyleSheet } from "react-native";
import { palette } from "@/constants/market-theme";

export const styles = StyleSheet.create({
    compactButton: {
        minHeight: 44,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    inlineButton: {
        flex: 1,
    },
    dangerButton: {
        backgroundColor: "#F8EAE7",
        borderColor: "#E8C9C4",
        borderWidth: 1,
    },
    quietButton: {
        backgroundColor: "transparent",
        borderColor: palette.line,
        borderWidth: 1,
    },
});
