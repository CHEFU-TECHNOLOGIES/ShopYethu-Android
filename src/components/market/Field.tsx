import { Text, TextInput, View, type TextInputProps } from "react-native";
import { palette, ui } from "@/constants/market-theme";

export function Field({ label, ...props }: TextInputProps & { label: string }) {
    return (
        <View style={{ gap: 7 }}>
            <Text style={[ui.small, { fontWeight: "600" }]}>{label}</Text>
            <TextInput
                accessibilityLabel={label}
                placeholderTextColor={palette.muted}
                style={[
                    ui.input,
                    props.multiline && {
                        minHeight: 94,
                        textAlignVertical: "top",
                    },
                ]}
                {...props}
            />
        </View>
    );
}
