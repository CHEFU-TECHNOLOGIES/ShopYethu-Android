import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { toast } from "@/lib/toast";
import { Button } from "@/components/market/Button";
import { ResourceState } from "@/components/market/ResourceState";
import { palette, ui } from "@/constants/market-theme";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import type { ProductReview, ProductReviewFeed } from "@/types/marketplace";

function ReviewStars({ rating }: { rating: number }) {
    return (
        <View
            accessibilityLabel={`${rating} out of 5 stars`}
            style={{ flexDirection: "row", gap: 2 }}
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                    key={star}
                    name={star <= rating ? "star" : "star-outline"}
                    size={15}
                    color={palette.accent}
                    accessible={false}
                />
            ))}
        </View>
    );
}

export function ProductReviews({ productId }: { productId: string }) {
    const path = `/products/${encodeURIComponent(productId)}/reviews`;
    const resource = useResource<ProductReviewFeed>(path);
    const [loadingMore, setLoadingMore] = useState(false);

    async function loadMore() {
        const cursor = resource.data?.nextCursor;
        if (!cursor || loadingMore) return;
        setLoadingMore(true);
        try {
            const page = await api<ProductReviewFeed>(
                `${path}?after=${encodeURIComponent(cursor)}`,
            );
            resource.mutate((current) => ({
                ...current,
                reviews: [
                    ...current.reviews,
                    ...page.reviews.filter(
                        (review) =>
                            !current.reviews.some(
                                (existing) => existing.id === review.id,
                            ),
                    ),
                ],
                nextCursor: page.nextCursor,
            }));
        } catch (cause) {
            toast.error(
                cause instanceof Error
                    ? cause.message
                    : "Could not load more reviews.",
            );
        } finally {
            setLoadingMore(false);
        }
    }

    if (!resource.data) {
        return (
            <ResourceState
                {...resource}
                retry={resource.refresh}
                empty="No verified reviews yet."
            />
        );
    }

    return (
        <View style={ui.card}>
            <View style={ui.between}>
                <Text style={ui.heading}>Buyer reviews</Text>
                <Text style={ui.small}>
                    {resource.data.averageRating === null
                        ? "No ratings yet"
                        : `${resource.data.averageRating} / 5 · ${resource.data.reviewCount}`}
                </Text>
            </View>
            {resource.data.reviews.length ? (
                resource.data.reviews.map((review: ProductReview) => (
                    <ReviewCard key={review.id} review={review} />
                ))
            ) : (
                <Text style={ui.subtitle}>No verified reviews yet.</Text>
            )}
            {resource.data.nextCursor && (
                <Button
                    title={loadingMore ? "Loading reviews…" : "Load more reviews"}
                    secondary
                    loading={loadingMore}
                    onPress={() => void loadMore()}
                />
            )}
        </View>
    );
}

function ReviewCard({ review }: { review: ProductReview }) {
    return (
        <View style={{ gap: 6, paddingVertical: 8 }}>
            <View style={ui.between}>
                <ReviewStars rating={review.rating} />
                {review.verifiedPurchase && (
                    <Text style={ui.small}>Verified purchase</Text>
                )}
            </View>
            <Text style={ui.small}>
                {new Date(review.createdAt).toLocaleDateString("en-ZA")}
            </Text>
            {review.comment ? (
                <Text style={ui.body}>{review.comment}</Text>
            ) : (
                <Text style={ui.small}>Rating only</Text>
            )}
        </View>
    );
}
