import { Text } from "react-native";
import { ui } from "@/constants/market-theme";
import type { ApplicationFieldKey, ApplicationIssue } from "@/lib/application-form";

export function ApplicationFieldError({
    field,
    issue,
}: {
    field: ApplicationFieldKey;
    issue?: ApplicationIssue | null;
}) {
    if (issue?.field !== field) return null;
    return (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={ui.error}>
            {issue.message}
        </Text>
    );
}
