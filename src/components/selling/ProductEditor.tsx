import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Text,
    View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Button, Page } from "@/components/market/Primitives";
import { applicationStyles as steps } from "@/constants/application-styles";
import { palette, ui } from "@/constants/market-theme";
import { useProductEditor } from "@/hooks/use-product-editor";
import { productSteps } from "@/lib/product-form";
import type { Product } from "@/types/marketplace";
import { ProductDetails, ProductPricing } from "./ProductDetails";
import { ProductPhotos } from "./ProductPhotos";
import { ProductReview } from "./ProductReview";

export function ProductEditor({
    uid,
    product,
    reload,
}: {
    uid: string;
    product?: Product;
    reload: () => void;
}) {
    const editor = useProductEditor(uid, product);
    const { step, busy, pending, goTo } = editor;
    const [reviewEdit, setReviewEdit] = useState(false);
    useFocusEffect(
        useCallback(() => {
            const listener = BackHandler.addEventListener(
                "hardwareBackPress",
                () => {
                    if (step > 0 && !busy && !pending) {
                        goTo(reviewEdit ? 3 : step - 1);
                        setReviewEdit(false);
                        return true;
                    }
                    return false;
                },
            );
            return () => listener.remove();
        }, [step, busy, pending, reviewEdit, goTo]),
    );
    const fields = {
        form: editor.form,
        update: editor.update,
        disabled: busy || !!pending,
    };
    const continueDisabled = busy || !editor.canContinue;
    function reloadProduct() {
        Alert.alert(
            "Reload product?",
            "Unsaved changes will be replaced with the latest store details.",
            [
                { text: "Keep editing", style: "cancel" },
                { text: "Reload", onPress: reload },
            ],
        );
    }
    function saveAndReturn(published: boolean) {
        void editor.save(published).then((saved) => {
            if (saved) router.replace("/selling");
        });
    }
    return (
        <Page
            key={step}
            title="Product"
            back
            backAccessory={
                <Text style={ui.badge}>
                    {editor.current ? "EDIT PRODUCT" : "NEW PRODUCT"}
                </Text>
            }
            header={
                <View style={{ gap: 8 }}>
                    <Text style={ui.title}>{productSteps[step]}</Text>
                    <Text accessibilityLiveRegion="polite" style={ui.subtitle}>
                        Step {step + 1} of 4
                    </Text>
                    <View
                        accessible
                        accessibilityLabel={`Step ${step + 1} of 4`}
                        style={steps.progress}
                    >
                        {productSteps.map((title, index) => (
                            <View
                                key={title}
                                style={[
                                    steps.segment,
                                    index <= step && steps.complete,
                                ]}
                            />
                        ))}
                    </View>
                </View>
            }
        >
            {!editor.ready ? (
                editor.loadError ? (
                    <View style={ui.card}>
                        <Text accessibilityRole="alert" style={ui.error}>
                            {editor.loadError}
                        </Text>
                        <Button title="Try again" onPress={editor.retryLoad} />
                    </View>
                ) : (
                    <ActivityIndicator color={palette.brand} />
                )
            ) : editor.blocked ? (
                <View style={ui.card}>
                    <Text style={ui.heading}>Selling access changed</Text>
                    <Text style={ui.subtitle}>{editor.error}</Text>
                    <Button title="Check seller access" onPress={reload} />
                </View>
            ) : (
                <>
                    {step === 0 && <ProductDetails {...fields} />}
                    {step === 1 && (
                        <ProductPhotos
                            {...fields}
                            uploading={busy}
                            upload={() => void editor.uploadPhotos()}
                        />
                    )}
                    {step === 2 && <ProductPricing {...fields} />}
                    {step === 3 && (
                        <ProductReview
                            form={editor.form}
                            disabled={fields.disabled}
                            edit={(index) => {
                                setReviewEdit(true);
                                editor.goTo(index);
                            }}
                        />
                    )}
                    {!!editor.error && (
                        <Text accessibilityRole="alert" style={ui.error}>
                            {editor.error}
                        </Text>
                    )}
                    {editor.conflict && (
                        <Button
                            title="Reload latest product"
                            secondary
                            disabled={busy}
                            onPress={reloadProduct}
                        />
                    )}
                    {pending ? (
                        <Button
                            title={busy ? "Confirming save…" : "Retry save"}
                            disabled={busy}
                            onPress={() => void editor.save(false)}
                        />
                    ) : step < 3 ? (
                        <View style={steps.controls}>
                            {step > 0 && !reviewEdit && (
                                <View style={steps.control}>
                                    <Button
                                        title="Back"
                                        secondary
                                        disabled={busy}
                                        onPress={() => editor.goTo(step - 1)}
                                    />
                                </View>
                            )}
                            <View style={steps.control}>
                                <Button
                                    title={
                                        reviewEdit
                                            ? "Review changes"
                                            : step === 2
                                              ? "Review product"
                                              : "Continue"
                                    }
                                    disabled={continueDisabled}
                                    onPress={() => {
                                        if (
                                            editor.next(
                                                reviewEdit ? 3 : undefined,
                                            )
                                        )
                                            setReviewEdit(false);
                                    }}
                                />
                            </View>
                        </View>
                    ) : (
                        <>
                            <Button
                                title={
                                    busy
                                        ? "Saving…"
                                        : editor.current?.published
                                          ? "Save changes"
                                          : "Publish product"
                                }
                                disabled={
                                    busy ||
                                    (!!editor.current?.published &&
                                        !editor.dirty)
                                }
                                onPress={() => saveAndReturn(true)}
                            />
                            <Button
                                title={
                                    editor.current?.published
                                        ? "Unpublish & save draft"
                                        : "Save draft"
                                }
                                secondary
                                disabled={
                                    busy ||
                                    (!!editor.current &&
                                        !editor.current.published &&
                                        !editor.dirty)
                                }
                                onPress={() => saveAndReturn(false)}
                            />
                        </>
                    )}
                </>
            )}
        </Page>
    );
}
