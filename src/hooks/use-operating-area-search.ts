import { useEffect, useRef, useState } from "react";
import { randomUUID } from "expo-crypto";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";

type Suggestion = { placeId: string; text: string };

export function useOperatingAreaSearch({
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
    const savedArea = useResource<{ label: string }>(
        `/areas/${encodeURIComponent(placeId || "")}`,
        editable && !!placeId && !value,
    );
    const visibleMessage =
        message || (editable && placeId && !value ? savedArea.error || "" : "");

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (!placeId || value || !editable) return;
        if (savedArea.data?.label) {
            onChangeRef.current(savedArea.data.label, placeId, sessionToken);
        }
    }, [
        editable,
        placeId,
        savedArea.data?.label,
        savedArea.error,
        sessionToken,
        value,
    ]);

    useEffect(() => {
        if (!shouldSearch || !editable || placeId || value.trim().length < 3) {
            return;
        }
        const controller = new AbortController();
        const token = sessionToken || randomUUID();
        const timeout = setTimeout(() => {
            setSearching(true);
            setMessage("");
            void api<{ suggestions: Suggestion[] }>(
                "/application/areas/suggestions",
                {
                    method: "POST",
                    body: JSON.stringify({
                        input: value.trim(),
                        sessionToken: token,
                    }),
                    signal: controller.signal,
                },
            )
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

    return {
        searching,
        shouldSearch,
        suggestions,
        visibleMessage,
        changeQuery,
        select,
    };
}
