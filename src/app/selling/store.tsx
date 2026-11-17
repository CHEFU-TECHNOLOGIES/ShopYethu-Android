import { useRef, useState } from "react";
import { useDraft } from "@/hooks/use-draft";
import { Text } from "react-native";
import {
    Button,
    Field,
    Page,
    ResourceState,
    SignInNotice,
} from "@/components/market/Primitives";
import { OperatingAreaField } from "@/components/market/OperatingAreaField";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useSellerInventory } from "@/hooks/use-seller-inventory";
import { publishSellerChange } from "@/lib/seller-events";
import type { Storefront } from "@/types/marketplace";
import { ui } from "@/constants/market-theme";
import { toast } from "@/lib/toast";
import { storeHasChanges } from "@/lib/store-form";

export default function StoreEditor() {
    const { session } = useAuth();
    const resource = useSellerInventory();
    const initial = resource.data?.store;
    const nameEditable = initial?.nameEditable === true;
    const [form, setForm] = useDraft(
        `${session?.user.uid}:${initial?.id || "store"}`,
        {
            name: initial?.name || "",
            description: initial?.description || "",
            area: initial?.area || "",
            areaPlaceId: initial?.areaPlaceId || "",
            areaSessionToken: "",
        },
    );
    const [busy, setBusy] = useState(false),
        [notice, setNotice] = useState(""),
        [error, setError] = useState("");
    const locked = useRef(false);
    const hasChanges = storeHasChanges(initial, form);
    async function save() {
        if (locked.current || !session || !hasChanges) return;
        locked.current = true;
        setBusy(true);
        setNotice("");
        setError("");
        const previous = resource.data?.store;
        const optimistic = previous ? {
            ...previous,
            name: nameEditable ? form.name : previous.name,
            description: form.description,
            area: form.area,
            areaPlaceId: form.areaPlaceId || undefined,
        } : null;
        if (optimistic) {
            resource.mutate((current) => ({ ...current, store: optimistic }));
        }
        try {
            const store = await api<Storefront>("/seller/store", {
                method: "PUT",
                body: JSON.stringify({ ...form, name: nameEditable ? form.name : initial?.name }),
            });
            publishSellerChange({ uid: session.user.uid, store });
            setForm({
                name: store.name,
                description: store.description,
                area: store.area,
                areaPlaceId: store.areaPlaceId || "",
                areaSessionToken: "",
            });
        } catch (cause) {
            if (previous && optimistic) {
                resource.mutate((current) => current.store === optimistic
                    ? { ...current, store: previous }
                    : current);
            }
            setError((cause as Error).message);
            toast.error((cause as Error).message);
        } finally {
            locked.current = false;
            setBusy(false);
        }
    }
    return (
        <Page
            title="Your storefront"
            subtitle="Give customers a little insight into your business."
            back
            onRefresh={session && !busy ? resource.refresh : undefined}
            refreshing={resource.refreshing}
        >
            {!session ? (
                <SignInNotice />
            ) : (
                <>
                    <ResourceState {...resource} retry={resource.refresh} />
                    {resource.data && (
                        <>
                            <Field
                                label="Store name"
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
                                disabled={busy || !hasChanges}
                                onPress={() => void save()}
                            />
                        </>
                    )}
                </>
            )}
        </Page>
    );
}
