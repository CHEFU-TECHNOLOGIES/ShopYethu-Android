import { useState } from "react";
import { Text, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { palette, ui } from "@/constants/market-theme";

export function ExpandableDescription({
    description,
}: {
    description: string;
}) {
    const [lineCount, setLineCount] = useState<number | null>(null);
    const [expanded, setExpanded] = useState(false);
    const canExpand = lineCount !== null && lineCount > 3;

    return (
        <View>
            <Text
                numberOfLines={expanded || lineCount === null ? undefined : 3}
                onTextLayout={(event) => {
                    if (lineCount === null) {
                        setLineCount(event.nativeEvent.lines.length);
                    }
                }}
                style={[ui.body, lineCount === null && { opacity: 0 }]}
            >
                {description}
            </Text>
            {canExpand && (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                        expanded ? "Show less description" : "Read more"
                    }
                    accessibilityState={{ expanded }}
                    hitSlop={6}
                    onPress={() => setExpanded((current) => !current)}
                >
                    <Text
                        style={{
                            color: palette.brand,
                            fontSize: 13,
                            fontWeight: "700",
                            marginTop: 6,
                        }}
                    >
                        {expanded ? "Show less" : "Read more"}
                    </Text>
                </Pressable>
            )}
        </View>
    );
}
