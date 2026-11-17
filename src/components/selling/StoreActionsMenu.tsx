import { useStoreActions } from "@/hooks/use-store-actions";
import type { Storefront } from "@/types/marketplace";
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
    const {
        pauseConfirmationOpen,
        setPauseConfirmationOpen,
        editStore,
        share,
        copyLink,
        updatePauseState,
        requestPauseChange,
    } = useStoreActions(store, onOpenChange);

    return (
        <>
            <StoreActionsDropdown
                open={open}
                onOpenChange={onOpenChange}
                paused={!!store.sellerPaused}
                onEdit={editStore}
                onShare={share}
                onCopy={() => void copyLink()}
                onPause={requestPauseChange}
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
