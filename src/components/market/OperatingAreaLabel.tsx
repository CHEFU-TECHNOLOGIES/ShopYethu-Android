import { useEffect, useState } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { api } from "@/lib/api";

export function OperatingAreaLabel({
    area,
    placeId,
    prefix = "",
    style,
    numberOfLines,
}: {
    area: string;
    placeId?: string;
    prefix?: string;
    style?: StyleProp<TextStyle>;
    numberOfLines?: number;
}) {
    const [resolution, setResolution] = useState<{
        placeId: string;
        label: string;
        failed: boolean;
    } | null>(null);

    useEffect(() => {
        if (!placeId || area) return;
        let active = true;
        void api<{ label: string }>(`/areas/${encodeURIComponent(placeId)}`)
            .then((result) => {
                if (active) setResolution({ placeId, label: result.label, failed: false });
            })
            .catch(() => {
                if (active) setResolution({ placeId, label: "", failed: true });
            });
        return () => {
            active = false;
        };
    }, [area, placeId]);

    if (!placeId) {
        return <Text style={style} numberOfLines={numberOfLines}>{prefix}{area}</Text>;
    }
    if (area) {
        return (
            <>
                <Text style={style} numberOfLines={numberOfLines}>{prefix}{area}</Text>
                <Text style={{ color: "#5E5E5E", fontSize: 12 }}>Google Maps</Text>
            </>
        );
    }
    const current = resolution?.placeId === placeId ? resolution : null;
    return (
        <>
            <Text style={style} numberOfLines={numberOfLines}>
                {prefix}{current?.label || (current?.failed ? "Location unavailable" : "Loading location…")}
            </Text>
            <Text style={{ color: "#5E5E5E", fontSize: 12 }}>Google Maps</Text>
        </>
    );
}
