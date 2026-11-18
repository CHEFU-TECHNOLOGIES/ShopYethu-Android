import { useRef, useState } from "react";
import { useDraft } from "@/hooks/use-draft";
import { useSellerInventory } from "@/hooks/use-seller-inventory";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { publishSellerChange } from "@/lib/seller-events";
import type { PhoneVerificationReceipt } from "@/lib/account-phone";
import { saveSession } from "@/lib/session";
import { storeHasChanges, storePhoneChanged } from "@/lib/store-form";
import { toast } from "@/lib/toast";
import type { Storefront } from "@/types/marketplace";

export function useStoreEditor() {
    const { session } = useAuth();
    const resource = useSellerInventory();
    const initial = resource.data?.store;
    const accountPhone = resource.data
        ? {
              phone: resource.data.phone || "",
              phoneVerificationRequired:
                  resource.data.phoneVerificationRequired === true,
          }
        : null;
    const [showPhoneVerification, setShowPhoneVerification] = useState(false);
    const phoneVerificationOpen = showPhoneVerification ||
        accountPhone?.phoneVerificationRequired === true;
    const [contactSyncPending, setContactSyncPending] = useState(false);
    const nameEditable = initial?.nameEditable === true;
    const phoneReady = resource.data !== null;
    const [form, setForm] = useDraft(
        `${session?.user.uid}:${initial?.id || "store"}:${phoneReady ? "phone-ready" : "phone-loading"}`,
        {
            name: initial?.name || "",
            description: initial?.description || "",
            area: initial?.area || "",
            areaPlaceId: initial?.areaPlaceId || "",
            areaSessionToken: "",
            phone: accountPhone?.phone || "",
        },
    );
    const [busy, setBusy] = useState(false);
    const notice = "";
    const [error, setError] = useState("");
    const locked = useRef(false);
    const initialPhone = accountPhone?.phone || "";
    const phoneChanged = storePhoneChanged(form.phone, initialPhone);
    const hasChanges = storeHasChanges(initial, form, initialPhone) || contactSyncPending;

    function updatePhone(phone: string) {
        setForm((value) => ({ ...value, phone }));
        setError("");
    }

    function refresh() {
        resource.refresh();
    }

    async function save(verifiedPhone?: string) {
        if (locked.current || !session) return;
        if (verifiedPhone && !initial) return;
        if (!verifiedPhone && accountPhone?.phoneVerificationRequired) {
            setShowPhoneVerification(true);
            return;
        }
        if (!verifiedPhone && phoneChanged) {
            if (!form.phone.trim()) {
                setError("Enter a phone number before verifying it.");
                return;
            }
            setShowPhoneVerification(true);
            return;
        }
        if (!verifiedPhone && !hasChanges) return;
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
                    name: nameEditable ? form.name : initial?.name,
                    description: form.description,
                    area: form.area,
                    areaPlaceId: form.areaPlaceId,
                    areaSessionToken: form.areaSessionToken,
                }),
            });
            publishSellerChange({ uid: session.user.uid, store });
            const savedPhone = verifiedPhone || accountPhone?.phone || "";
            setForm({
                name: store.name,
                description: store.description,
                area: store.area,
                areaPlaceId: store.areaPlaceId || "",
                areaSessionToken: "",
                phone: savedPhone,
            });
            setContactSyncPending(false);
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

    function handlePhoneVerified(receipt: PhoneVerificationReceipt) {
        setShowPhoneVerification(false);
        if (resource.data) {
            resource.mutate((current) => ({
                ...current,
                phone: receipt.phone,
                phoneVerificationRequired: false,
            }));
        }
        setForm((value) => ({ ...value, phone: receipt.phone }));
        setContactSyncPending(true);
        if (!initial) resource.refresh();
        void save(receipt.phone);
    }

    function cancelPhoneVerification() {
        if (accountPhone?.phoneVerificationRequired) {
            void saveSession(null);
        } else {
            setShowPhoneVerification(false);
        }
    }

    return {
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
    };
}
