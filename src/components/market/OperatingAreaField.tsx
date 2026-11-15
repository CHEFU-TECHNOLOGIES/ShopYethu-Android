import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { randomUUID } from "expo-crypto";
import { Field } from "@/components/market/Primitives";
import { palette, ui } from "@/constants/market-theme";
import { api } from "@/lib/api";

type Suggestion = { placeId: string; text: string };

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
    const [searching, setSearching] = useState(false);
    const [shouldSearch, setShouldSearch] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [message, setMessage] = useState("");
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (!placeId || value || !editable) return;
        let active = true;
        void api<{ label: string }>(`/areas/${encodeURIComponent(placeId)}`)
            .then(({ label }) => {
                if (active) onChangeRef.current(label, placeId, sessionToken);
            })
            .catch((error: unknown) => {
                if (active) {
                    setMessage(
                        error instanceof Error
                            ? error.message
                            : "Could not load this saved location.",
                    );
                }
            });
        return () => {
            active = false;
        };
    }, [editable, placeId, sessionToken, value]);

    useEffect(() => {
        if (!shouldSearch || !editable || placeId || value.trim().length < 3) return;
        const controller = new AbortController();
        const token = sessionToken || randomUUID();
        const timeout = setTimeout(() => {
            setSearching(true);
            setMessage("");
            void api<{ suggestions: Suggestion[] }>("/application/areas/suggestions", {
                method: "POST",
                body: JSON.stringify({ input: value.trim(), sessionToken: token }),
                signal: controller.signal,
            })
                .then((result) => {
                    if (!controller.signal.aborted) {
                        setSuggestions(result.suggestions);
                    }
                })
                .catch((error: unknown) => {
                    if (!controller.signal.aborted) {
                        setSuggestions([]);
                        setMessage(
                            error instanceof Error
                                ? error.message
                                : "Could not search locations.",
                        );
                    }
                })
                .finally(() => {
                    if (!controller.signal.aborted) setSearching(false);
                });
        }, 350);
        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [editable, placeId, sessionToken, shouldSearch, value]);

    function changeQuery(next: string) {
        const token = sessionToken || randomUUID();
        setShouldSearch(true);
        setMessage("");
        setSuggestions([]);
        setSearching(next.trim().length >= 3);
        onChange(next, "", token);
    }

    function select(suggestion: Suggestion) {
        setShouldSearch(false);
        setSuggestions([]);
        setSearching(false);
        setMessage("");
        onChange(suggestion.text, suggestion.placeId, sessionToken);
    }

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
                suggestions.length === 0 && !message && (
                    <Text style={ui.small}>No matching South African areas found.</Text>
                )}
            {!!message && (
                <Text accessibilityRole="alert" style={ui.error}>
                    {message}
                </Text>
            )}
            {(suggestions.length > 0 || placeId) && (
                <Text style={styles.attribution}>Google Maps</Text>
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
