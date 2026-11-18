import { useRef, useState } from "react";
import { useDraft } from "@/hooks/use-draft";
import { useSellerInventory } from "@/hooks/use-seller-inventory";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { publishSellerChange } from "@/lib/seller-events";
import { normalizeApplicationPhone } from "@/lib/contact-phone";
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
              whatsappAvailable: resource.data.whatsappAvailable === true,
          }
        : null;
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
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
            whatsappAvailable: accountPhone?.whatsappAvailable || false,
        },
    );
    const [busy, setBusy] = useState(false);
    const notice = "";
    const [error, setError] = useState("");
    const locked = useRef(false);
    const initialPhone = accountPhone?.phone || "";
    const initialWhatsappAvailable = accountPhone?.whatsappAvailable || false;
    const phoneChanged = storePhoneChanged(form.phone, initialPhone);
    const whatsappChanged = form.whatsappAvailable !== initialWhatsappAvailable;
    const hasChanges = storeHasChanges(
        initial,
        form,
        initialPhone,
        initialWhatsappAvailable,
    ) || contactSyncPending;

    function updatePhone(phone: string) {
        setForm((value) => ({ ...value, phone }));
        setError("");
    }

    function refresh() {
        resource.refresh();
    }

    async function save(contactWhatsappAvailable?: boolean): Promise<boolean> {
        if (locked.current || !session) return false;
        const updatingContact = contactWhatsappAvailable !== undefined;
        if (updatingContact && !initial) return false;
        if (!updatingContact && (phoneChanged || whatsappChanged)) {
            if (!form.phone.trim()) {
                setError("Enter a phone number before saving contact details.");
                return false;
            }
            setShowWhatsAppModal(true);
            return false;
        }
        if (updatingContact && !form.phone.trim()) {
            setError("Enter a phone number before saving contact details.");
            return false;
        }
        const normalizedPhone = updatingContact
            ? normalizeApplicationPhone(form.phone)
            : null;
        if (updatingContact && !normalizedPhone) {
            setError("Enter a valid South African phone number.");
            return false;
        }
        if (!updatingContact && !hasChanges) return false;
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
                    ...(updatingContact
                        ? {
                              phone: normalizedPhone,
                              whatsappAvailable: contactWhatsappAvailable,
                          }
                        : {}),
                }),
            });
            publishSellerChange({ uid: session.user.uid, store });
            const savedPhone = updatingContact
                ? normalizedPhone || form.phone
                : accountPhone?.phone || "";
            const savedWhatsappAvailable = updatingContact
                ? contactWhatsappAvailable === true
                : initialWhatsappAvailable;
            if (updatingContact && resource.data) {
                resource.mutate((current) => ({
                    ...current,
                    phone: savedPhone,
                    whatsappAvailable: savedWhatsappAvailable,
                }));
            }
            setForm({
                name: store.name,
                description: store.description,
                area: store.area,
                areaPlaceId: store.areaPlaceId || "",
                areaSessionToken: "",
                phone: savedPhone,
                whatsappAvailable: savedWhatsappAvailable,
            });
            setContactSyncPending(false);
            return true;
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
            return false;
        } finally {
            locked.current = false;
            setBusy(false);
        }
    }

    function handleWhatsAppConfirm(available: boolean): Promise<boolean> {
        setShowWhatsAppModal(false);
        setForm((value) => ({ ...value, whatsappAvailable: available }));
        setContactSyncPending(true);
        return save(available);
    }

    function cancelWhatsAppModal() {
        setShowWhatsAppModal(false);
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
        whatsappModalOpen: showWhatsAppModal,
        cancelWhatsAppModal,
        handleWhatsAppConfirm,
        refresh,
        save,
    };
}
