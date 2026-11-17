import { useRef, useState } from "react";
import { useDraft } from "@/hooks/use-draft";
import { useSellerInventory } from "@/hooks/use-seller-inventory";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { publishSellerChange } from "@/lib/seller-events";
import { storeHasChanges } from "@/lib/store-form";
import { toast } from "@/lib/toast";
import type { Storefront } from "@/types/marketplace";

export function useStoreEditor() {
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
    const [busy, setBusy] = useState(false);
    const notice = "";
    const [error, setError] = useState("");
    const locked = useRef(false);
    const hasChanges = storeHasChanges(initial, form);

    async function save() {
        if (locked.current || !session || !hasChanges) return;
        locked.current = true;
        setBusy(true);
        setError("");
        const previous = resource.data?.store;
        const optimistic = previous
            ? {
                  ...previous,
                  name: nameEditable ? form.name : previous.name,
                  description: form.description,
                  area: form.area,
                  areaPlaceId: form.areaPlaceId || undefined,
              }
            : null;
        if (optimistic) {
            resource.mutate((current) => ({ ...current, store: optimistic }));
        }
        try {
            const store = await api<Storefront>("/seller/store", {
                method: "PUT",
                body: JSON.stringify({
                    ...form,
                    name: nameEditable ? form.name : initial?.name,
                }),
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
                resource.mutate((current) =>
                    current.store === optimistic
                        ? { ...current, store: previous }
                        : current,
                );
            }
            const message =
                cause instanceof Error
                    ? cause.message
                    : "Could not save your storefront. Please try again.";
            setError(message);
            toast.error(message);
        } finally {
            locked.current = false;
            setBusy(false);
        }
    }

    return {
        session,
        resource,
        initial,
        nameEditable,
        form,
        setForm,
        busy,
        notice,
        error,
        hasChanges,
        save,
    };
}
