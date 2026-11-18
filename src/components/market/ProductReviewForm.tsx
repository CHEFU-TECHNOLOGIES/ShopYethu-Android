import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { Button } from "@/components/market/Button";
import { ClearableTextInput } from "@/components/market/ClearableTextInput";
import { palette, ui } from "@/constants/market-theme";
import { api } from "@/lib/api";

export function ProductReviewForm({
    orderId,
    productId,
    productName,
    onSubmitted,
}: {
    orderId: string;
    productId: string;
    productName: string;
    onSubmitted: (productId: string) => void;
}) {
    const [rating, setRating] = useState<number | null>(null);
    const [comment, setComment] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function submit() {
        if (busy || rating === null) return;
        setBusy(true);
        setError("");
        try {
            await api(`/products/${encodeURIComponent(productId)}/reviews`, {
                method: "POST",
                body: JSON.stringify({ orderId, rating, comment }),
            });
            onSubmitted(productId);
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Could not submit your review.",
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <View style={ui.card}>
            <Text style={ui.heading}>Review {productName}</Text>
            <Text style={ui.small}>
                Your review will be marked as a verified purchase.
            </Text>
            <View
                accessibilityLabel={
                    rating === null
                        ? "Choose a rating"
                        : `Rating: ${rating} out of 5 stars`
                }
                style={{ flexDirection: "row", gap: 8 }}
            >
                {[1, 2, 3, 4, 5].map((value) => (
                    <Pressable
                        key={value}
                        accessibilityRole="button"
                        accessibilityLabel={`${value} star${value === 1 ? "" : "s"}`}
                        accessibilityState={{ selected: rating === value }}
                        onPress={() => setRating(value)}
                        style={{ padding: 5 }}
                    >
                        <Ionicons
                            name={
                                value <= (rating || 0)
                                    ? "star"
                                    : "star-outline"
                            }
                            size={25}
                            color={palette.accent}
                            accessible={false}
                        />
                    </Pressable>
                ))}
            </View>
            <ClearableTextInput
                accessibilityLabel={`Review for ${productName}`}
                clearLabel={`review for ${productName}`}
                placeholder="Share a few details (optional)"
                placeholderTextColor={palette.muted}
                value={comment}
                onChangeText={setComment}
                maxLength={500}
                multiline
                textAlignVertical="top"
                style={[ui.input, { minHeight: 96 }]}
            />
            {!!error && (
                <Text accessibilityRole="alert" style={ui.error}>
                    {error}
                </Text>
            )}
            <Button
                title="Submit review"
                loading={busy}
                disabled={busy || rating === null}
                onPress={() => void submit()}
            />
        </View>
    );
}
