import {
    ActivityIndicator,
    Text,
    View,
} from "react-native";
import { Button, Page } from "@/components/market/Primitives";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { applicationStyles as steps } from "@/constants/application-styles";
import { palette, ui } from "@/constants/market-theme";
import { useProductEditor } from "@/hooks/use-product-editor";
import { useProductEditorNavigation } from "@/hooks/use-product-editor-navigation";
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
    const { step, busy, pending } = editor;
    const {
        reviewEdit,
        setReviewEdit,
        reloadConfirmationOpen,
        setReloadConfirmationOpen,
        requestReload,
        confirmReload,
        continueEditing,
        saveAndReturn,
    } = useProductEditorNavigation(editor, reload);
    const fields = {
        form: editor.form,
        update: editor.update,
        disabled: busy || !!pending,
    };
    const continueDisabled = busy || !editor.canContinue;
    return (
        <>
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
                        <Text
                            accessibilityLiveRegion="polite"
                            style={ui.subtitle}
                        >
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
                    {busy && step === 3 && (
                        <View style={ui.card} accessibilityLiveRegion="polite">
                            <Text style={ui.heading}>Saving your product</Text>
                            <Text style={ui.subtitle}>
                                These changes are not confirmed yet. Your listing will update when the save succeeds.
                            </Text>
                        </View>
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
                            onPress={requestReload}
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
                                    onPress={continueEditing}
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
            <ConfirmationDialog
                visible={reloadConfirmationOpen}
                title="Reload product?"
                message="Unsaved changes will be replaced with the latest store details."
                cancelLabel="Keep editing"
                confirmLabel="Reload"
                onCancel={() => setReloadConfirmationOpen(false)}
                onConfirm={confirmReload}
            />
            <ConfirmationDialog
                visible={editor.leaveConfirmationOpen}
                title={pending ? "Save not confirmed" : "Leave without saving?"}
                message={
                    pending
                        ? "The save may have reached your store. Your save attempt is kept on this device so you can retry safely when you return."
                        : "Changes you haven’t saved will be lost."
                }
                cancelLabel="Keep editing"
                confirmLabel="Leave"
                destructive
                onCancel={editor.cancelLeave}
                onConfirm={editor.confirmLeave}
            />
        </>
    );
}
