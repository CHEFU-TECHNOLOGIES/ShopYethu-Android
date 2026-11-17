import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { Field } from "@/components/market/Primitives";
import { palette, ui } from "@/constants/market-theme";
import { useOperatingAreaSearch } from "@/hooks/use-operating-area-search";

export function OperatingAreaField({
    value,
    placeId,
    sessionToken,
    editable,
    onChange,
}: {
    value: string;
    placeId: string;
    sessionToken: string;
    editable: boolean;
    onChange: (value: string, placeId: string, sessionToken: string) => void;
}) {
    const {
        searching,
        shouldSearch,
        suggestions,
        visibleMessage,
        changeQuery,
        select,
    } = useOperatingAreaSearch({
        value,
        placeId,
        sessionToken,
        editable,
        onChange,
    });

    return (
        <View style={styles.container}>
            <Field
                label="Operating area"
                placeholder="Search a South African town or suburb"
                value={value}
                onChangeText={changeQuery}
                maxLength={120}
                autoCapitalize="words"
                editable={editable}
            />
            {searching && (
                <ActivityIndicator
                    accessibilityLabel="Searching locations"
                    color={palette.brand}
                    size="small"
                />
            )}
            {suggestions.length > 0 && (
                <View style={styles.results}>
                    {suggestions.map((suggestion) => (
                        <Pressable
                            key={suggestion.placeId}
                            accessibilityRole="button"
                            onPress={() => select(suggestion)}
                            style={styles.result}
                        >
                            <Text style={styles.resultText}>
                                {suggestion.text}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            )}
            {shouldSearch && !searching && value.trim().length >= 3 &&
                suggestions.length === 0 && !visibleMessage && (
                    <Text style={ui.small}>No matching South African areas found.</Text>
                )}
            {!!visibleMessage && (
                <Text accessibilityRole="alert" style={ui.error}>
                    {visibleMessage}
                </Text>
            )}
            
            <Text style={ui.small}>Choose a town or suburb, not a private street address.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 8 },
    results: {
        overflow: "hidden",
        borderWidth: 1,
        borderColor: palette.line,
        borderRadius: 12,
        backgroundColor: palette.paper,
    },
    result: { minHeight: 48, justifyContent: "center", paddingHorizontal: 14, paddingVertical: 10 },
    resultText: { color: palette.ink, fontSize: 14, lineHeight: 20 },
    attribution: { color: "#5E5E5E", fontSize: 12, fontWeight: "400" },
});
