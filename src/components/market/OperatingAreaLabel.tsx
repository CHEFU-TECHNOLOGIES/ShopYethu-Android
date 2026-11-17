import { Text, type StyleProp, type TextStyle } from "react-native";
import { useResource } from "@/hooks/use-resource";
import { OperatingAreaLabelSkeleton } from "./OperatingAreaLabelSkeleton";

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
    const resource = useResource<{ label: string }>(
        `/areas/${encodeURIComponent(placeId || "")}`,
        !!placeId && !area,
    );

    if (!placeId) {
        return <Text style={style} numberOfLines={numberOfLines}>{prefix}{area}</Text>;
    }
    if (area) {
        return (
            <>
                <Text style={style} numberOfLines={numberOfLines}>{prefix}{area}</Text>
            </>
        );
    }
    if (resource.loading) {
        return <OperatingAreaLabelSkeleton prefix={prefix} style={style} />;
    }
    return (
        <Text style={style} numberOfLines={numberOfLines}>
            {prefix}{resource.data?.label || "Location unavailable"}
        </Text>
    );
}
