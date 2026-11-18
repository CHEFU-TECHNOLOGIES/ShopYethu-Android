import { useCallback, useRef, useState } from "react";
import {
    readShopScrollPreference,
    saveShopScrollPreference,
} from "@/lib/shop-scroll-preference";

export function useShopScrollPreference() {
    const [keepHeaderFixed, setKeepHeaderFixed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const generation = useRef(0);
    const savingLock = useRef(false);

    const reload = useCallback(() => {
        const request = ++generation.current;
        void readShopScrollPreference()
            .then((value) => {
                if (request === generation.current) {
                    setKeepHeaderFixed(value);
                    setError("");
                }
            })
            .catch(() => {
                if (request === generation.current) {
                    setError("Could not load the Shop scrolling preference.");
                }
            })
            .finally(() => {
                if (request === generation.current) {
                    setLoading(false);
                }
            });
        return () => {
            if (request === generation.current) {
                generation.current++;
            }
        };
    }, []);

    const update = useCallback(
        async (value: boolean) => {
            if (savingLock.current) return;
            savingLock.current = true;
            generation.current++;
            const previous = keepHeaderFixed;
            setKeepHeaderFixed(value);
            setSaving(true);
            setError("");
            try {
                await saveShopScrollPreference(value);
            } catch {
                setKeepHeaderFixed(previous);
                setError("Could not save the Shop scrolling preference.");
            } finally {
                generation.current++;
                savingLock.current = false;
                setSaving(false);
            }
        },
        [keepHeaderFixed],
    );

    return {
        keepHeaderFixed,
        loading,
        saving,
        error,
        reload,
        setKeepHeaderFixed: update,
    };
}
