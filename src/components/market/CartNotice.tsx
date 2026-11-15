import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { palette, ui } from "@/constants/market-theme";
import { styles } from "./cart-styles";

type NoticeTone = "error" | "info" | "warning";

export function CartNotice({
    title,
    message,
    tone = "info",
}: {
    title: string;
    message: string;
    tone?: NoticeTone;
}) {
    const color =
        tone === "error"
            ? palette.danger
            : tone === "warning"
              ? "#9A5A18"
              : palette.brand;

    return (
        <View
            accessibilityRole={tone === "error" ? "alert" : undefined}
            accessibilityLiveRegion="polite"
            style={[styles.notice, styles[`notice_${tone}`]]}
        >
            <Ionicons
                name={
                    tone === "error"
                        ? "alert-circle-outline"
                        : tone === "warning"
                          ? "time-outline"
                          : "information-circle-outline"
                }
                size={20}
                color={color}
                accessible={false}
            />
            <View style={styles.noticeCopy}>
                <Text style={[styles.noticeTitle, { color }]}>{title}</Text>
                <Text style={[ui.small, styles.noticeMessage]}>{message}</Text>
            </View>
        </View>
    );
}
