import { useRouter } from "expo-router";
import { Text } from "react-native";
import {
    Button,
    Field,
    Page,
    ResourceState,
    SignInNotice,
} from "@/components/market/Primitives";
import { OperatingAreaField } from "@/components/market/OperatingAreaField";
import { ui } from "@/constants/market-theme";
import { StoreEditorSkeleton } from "@/components/selling/StoreEditorSkeleton";
import { WhatsAppAvailabilityModal } from "@/components/selling/WhatsAppAvailabilityModal";
import { useStoreEditor } from "@/hooks/use-store-editor";

export default function StoreEditor() {
    const router = useRouter();
    const {
        session,
        resource,
        initial,
        nameEditable,
        form,
        setForm,
        updatePhone,
        busy,
        notice,
        error,
        hasChanges,
        accountPhone,
        whatsappModalOpen,
        cancelWhatsAppModal,
        handleWhatsAppConfirm,
        refresh,
        save,
    } = useStoreEditor();
    function goBack() {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/");
        }
    }

    async function saveAndGoBack() {
        if (await save()) goBack();
    }

    async function confirmAndGoBack(available: boolean) {
        if (await handleWhatsAppConfirm(available)) goBack();
    }

    return (
        <Page
            title="Your storefront"
            subtitle="Give customers a little insight into your business."
            back
            onRefresh={session && !busy ? refresh : undefined}
            refreshing={resource.refreshing}
        >
            {!session ? (
                <SignInNotice />
            ) : (
                <>
                    <ResourceState
                        {...resource}
                        retry={resource.refresh}
                        loadingFallback={<StoreEditorSkeleton />}
                    />
                    {resource.data && accountPhone && (
                        <>
                            <Field
                                label="Store name"
                                placeholder="e.g. Cape Town Crafts"
                                value={nameEditable ? form.name : initial?.name || ""}
                                onChangeText={(name) =>
                                    nameEditable && setForm((value) => ({ ...value, name }))
                                }
                                editable={!busy && nameEditable}
                                locked={!nameEditable}
                            />
                            {initial?.nameEditable === false && (
                                <Text style={ui.small}>Store names are locked for registered businesses.</Text>
                            )}
                            <Field
                                label="About your store"
                                placeholder="Tell customers what makes your store special"
                                value={form.description}
                                multiline
                                onChangeText={(description) =>
                                    setForm((value) => ({
                                        ...value,
                                        description,
                                    }))
                                }
                                editable={!busy}
                            />
                            <Field
                                label="Business contact number"
                                placeholder="e.g. 082 123 4567"
                                value={form.phone}
                                onChangeText={updatePhone}
                                keyboardType="phone-pad"
                                maxLength={30}
                                editable={!busy}
                            />
                            <OperatingAreaField
                                value={form.area}
                                placeId={form.areaPlaceId}
                                sessionToken={form.areaSessionToken}
                                editable={!busy}
                                onChange={(
                                    area,
                                    areaPlaceId,
                                    areaSessionToken,
                                ) =>
                                    setForm((value) => ({
                                        ...value,
                                        area,
                                        areaPlaceId,
                                        areaSessionToken,
                                    }))
                                }
                            />
                            {error && (
                                <Text
                                    accessibilityRole="alert"
                                    style={ui.error}
                                >
                                    {error}
                                </Text>
                            )}
                            {notice && <Text style={ui.body}>{notice}</Text>}
                            <Button
                                title={busy ? "Saving…" : "Save storefront"}
                                disabled={
                                    busy ||
                                    !hasChanges
                                }
                                onPress={() => void saveAndGoBack()}
                            />
                        </>
                    )}
                </>
            )}
            {session && (
                <WhatsAppAvailabilityModal
                    key={`${whatsappModalOpen ? "open" : "closed"}:${form.phone}:${form.whatsappAvailable}`}
                    visible={whatsappModalOpen}
                    whatsappAvailable={form.whatsappAvailable}
                    onConfirm={(available) => void confirmAndGoBack(available)}
                    onCancel={cancelWhatsAppModal}
                />
            )}
        </Page>
    );
}
