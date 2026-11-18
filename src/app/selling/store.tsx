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
import { PhoneVerificationModal } from "@/components/selling/PhoneVerificationModal";
import { useStoreEditor } from "@/hooks/use-store-editor";

export default function StoreEditor() {
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
        phoneChanged,
        accountPhone,
        phoneVerificationOpen,
        cancelPhoneVerification,
        handlePhoneVerified,
        refresh,
        save,
    } = useStoreEditor();
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
                            <Text style={ui.small}>
                                Shared with your CheFu account for SSO and other
                                apps. It is not shown on your public storefront.
                            </Text>
                            {phoneChanged && (
                                <Text style={ui.small}>
                                    A changed number must be verified by SMS
                                    before it is saved.
                                </Text>
                            )}
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
                                onPress={() => void save()}
                            />
                        </>
                    )}
                </>
            )}
            {session && (
                <PhoneVerificationModal
                    key={`${phoneVerificationOpen ? "open" : "closed"}:${form.phone}`}
                    visible={phoneVerificationOpen}
                    phone={form.phone}
                    required={accountPhone?.phoneVerificationRequired}
                    onVerified={handlePhoneVerified}
                    onCancel={cancelPhoneVerification}
                />
            )}
        </Page>
    );
}
