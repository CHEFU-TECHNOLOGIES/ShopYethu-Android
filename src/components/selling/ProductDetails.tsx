import { Pressable, Text, View } from "react-native";
import { Field } from "@/components/market/Primitives";
import { categories } from "@/lib/config";
import type { ProductForm } from "@/lib/product-form";
import { ui } from "@/constants/market-theme";
import { sellerStyles as styles } from "@/constants/seller-styles";

export type ProductFieldsProps = {
    form: ProductForm;
    disabled: boolean;
    update: <K extends keyof ProductForm>(
        field: K,
        value: ProductForm[K],
    ) => void;
};
export function ProductDetails({ form, disabled, update }: ProductFieldsProps) {
    const choices = [
        ...new Set([
            ...categories.filter((category) => category !== "All"),
            form.category,
        ]),
    ];
    return (
        <>
            <Text style={ui.subtitle}>
                Give customers a clear picture of what you’re selling.
            </Text>
            <Field
                label="Product name"
                placeholder="What would you call it?"
                value={form.name}
                onChangeText={(value) => update("name", value)}
                maxLength={120}
                editable={!disabled}
                autoCapitalize="sentences"
            />
            <Text style={ui.small}>Category</Text>
            <View style={styles.tabs}>
                {choices.map((category) => (
                    <Pressable
                        key={category}
                        accessibilityRole="radio"
                        accessibilityLabel={category}
                        accessibilityState={{
                            checked: form.category === category,
                            disabled,
                        }}
                        hitSlop={2}
                        disabled={disabled}
                        style={[
                            styles.categoryTab,
                            form.category === category && styles.tabActive,
                        ]}
                        onPress={() => update("category", category)}
                    >
                        <Text
                            style={[
                                styles.categoryTabText,
                                form.category === category &&
                                    styles.tabActiveText,
                            ]}
                        >
                            {category}
                        </Text>
                    </Pressable>
                ))}
            </View>
            <Field
                label="Description"
                placeholder="Materials, size, features and what makes it special."
                value={form.description}
                onChangeText={(value) => update("description", value)}
                maxLength={4000}
                multiline
                editable={!disabled}
            />
        </>
    );
}
export function ProductPricing({ form, disabled, update }: ProductFieldsProps) {
    return (
        <>
            <Text style={ui.subtitle}>
                Set your price and the quantity you have available.
            </Text>
            <Field
                label="Price in rand (R)"
                placeholder="0.00"
                value={form.price}
                onChangeText={(value) => update("price", value)}
                keyboardType="decimal-pad"
                maxLength={12}
                editable={!disabled}
            />
            <Field
                label="Stock available"
                placeholder="0"
                value={form.stock}
                onChangeText={(value) => update("stock", value)}
                keyboardType="number-pad"
                maxLength={6}
                editable={!disabled}
            />
            <Text style={ui.small}>
                Use 0 when the product is out of stock.
            </Text>
            <View style={ui.card}>
                <Text style={ui.heading}>Fulfilment</Text>
                <Text style={ui.subtitle}>
                    {form.fulfilment
                        .map((value) =>
                            value === "collection"
                                ? "Customer collection"
                                : "Local delivery",
                        )
                        .join(" · ")}
                </Text>
                <Text style={ui.small}>
                    Customers will see the available fulfilment options before
                    ordering.
                </Text>
            </View>
        </>
    );
}
