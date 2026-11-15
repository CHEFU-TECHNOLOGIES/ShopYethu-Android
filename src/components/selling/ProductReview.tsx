import { Text, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { Ionicons } from "@expo/vector-icons";
import { money, palette, ui } from "@/constants/market-theme";
import { sellerStyles as styles } from "@/constants/seller-styles";
import type { ProductForm } from "@/lib/product-form";
import { ProductThumbnail } from "./InventoryRow";

export function ProductReview({
    form,
    edit,
    disabled,
}: {
    form: ProductForm;
    edit: (step: number) => void;
    disabled: boolean;
}) {
    const sections = [
        {
            title: "Product details",
            step: 0,
            lines: [form.category, form.description],
        },
        {
            title: "Photos",
            step: 1,
            lines: [
                form.photos.length
                    ? `${form.photos.length} product photo${form.photos.length === 1 ? "" : "s"}`
                    : "No photos yet · draft only",
            ],
        },
        {
            title: "Price & stock",
            step: 2,
            lines: [
                money(Math.round(Number(form.price.replace(",", ".")) * 100)),
                `${form.stock} available`,
                form.fulfilment
                    .map((value) =>
                        value === "collection"
                            ? "Customer collection"
                            : "Local delivery",
                    )
                    .join(" · "),
            ],
        },
    ];
    return (
        <>
            <Text style={ui.subtitle}>
                Take one last look before your product goes live.
            </Text>
            <View style={styles.previewImage}>
                <ProductThumbnail key={form.photos[0]} url={form.photos[0]} />
            </View>
            <Text style={ui.heading}>{form.name}</Text>
            {sections.map((section) => (
                <View key={section.title} style={ui.card}>
                    <View style={ui.between}>
                        <Text style={styles.productName}>{section.title} 123</Text>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Edit ${section.title.toLowerCase()}`}
                            disabled={disabled}
                            onPress={() => edit(section.step)}
                            style={styles.link}
                        >
                            <Ionicons
                                name="create-outline"
                                color={palette.brand}
                                size={23}
                            />
                        </Pressable>
                    </View>
                    {section.lines.map((line, index) => (
                        <Text key={index} style={ui.subtitle}>
                            {line}
                        </Text>
                    ))}
                </View>
            ))}
        </>
    );
}
