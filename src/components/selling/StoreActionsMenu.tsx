import * as Clipboard from "expo-clipboard";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { shareStore, storeShareUrl } from "@/lib/store-sharing";
import type { Storefront } from "@/types/marketplace";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { StoreActionsDropdown } from "./StoreActionsDropdown";
import { StorePauseConfirmation } from "./StorePauseConfirmation";

export function StoreActionsMenu({
    store,
    open,
    onOpenChange,
}: {
    store: Storefront;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const sharing = useRef(false);
    const copying = useRef(false);
    const changingPauseState = useRef(false);
    const [pauseConfirmationOpen, setPauseConfirmationOpen] = useState(false);

    function editStore() {
        onOpenChange(false);
        router.navigate("/selling/store");
    }

    function share() {
        onOpenChange(false);
        if (sharing.current) return;
        sharing.current = true;
        void shareStore(store)
            .catch((cause: unknown) => {
                toast.error(
                    cause instanceof Error
                        ? cause.message
                        : "Could not share your storefront. Please try again.",
                );
            })
            .finally(() => {
                sharing.current = false;
            });
    }

    async function copyLink() {
        onOpenChange(false);
        if (copying.current) return;
        copying.current = true;
        try {
            await Clipboard.setStringAsync(storeShareUrl(store.id));
            toast.success("Store link copied.");
        } catch (cause) {
            toast.error(
                cause instanceof Error
                    ? cause.message
                    : "Could not copy your store link. Please try again.",
            );
        } finally {
            copying.current = false;
        }
    }

    async function updatePauseState() {
        onOpenChange(false);
        setPauseConfirmationOpen(false);
        if (changingPauseState.current) return;
        changingPauseState.current = true;
        try {
            await api<Storefront>("/seller/store/status", {
                method: "PUT",
                body: JSON.stringify({ paused: !store.sellerPaused }),
            });
        } catch (cause) {
            toast.error(
                cause instanceof Error
                    ? cause.message
                    : "Could not update your store status. Please try again.",
            );
        } finally {
            changingPauseState.current = false;
        }
    }

    return (
        <>
            <StoreActionsDropdown
                open={open}
                onOpenChange={onOpenChange}
                paused={!!store.sellerPaused}
                onEdit={editStore}
                onShare={share}
                onCopy={() => void copyLink()}
                onPause={() => {
                    onOpenChange(false);
                    setPauseConfirmationOpen(true);
                }}
            />
            <StorePauseConfirmation
                paused={!!store.sellerPaused}
                visible={pauseConfirmationOpen}
                onDismiss={() => setPauseConfirmationOpen(false)}
                onConfirm={() => void updatePauseState()}
            />
        </>
    );
}
