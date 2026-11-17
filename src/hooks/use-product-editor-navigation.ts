import { useCallback, useState } from "react";
import { BackHandler } from "react-native";
import { router, useFocusEffect } from "expo-router";
import type { useProductEditor } from "@/hooks/use-product-editor";

type ProductEditorState = ReturnType<typeof useProductEditor>;

export function useProductEditorNavigation(
    editor: ProductEditorState,
    reload: () => void,
) {
    const [reviewEdit, setReviewEdit] = useState(false);
    const [reloadConfirmationOpen, setReloadConfirmationOpen] = useState(false);
    const { step, busy, pending, goTo } = editor;

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
        }, [step, busy, pending, goTo, reviewEdit]),
    );

    function requestReload() {
        setReloadConfirmationOpen(true);
    }

    function confirmReload() {
        setReloadConfirmationOpen(false);
        reload();
    }

    function continueEditing() {
        if (editor.next(reviewEdit ? 3 : undefined)) setReviewEdit(false);
    }

    function saveAndReturn(published: boolean) {
        void editor.save(published).then((saved) => {
            if (saved) router.replace("/selling");
        });
    }

    return {
        reviewEdit,
        setReviewEdit,
        reloadConfirmationOpen,
        setReloadConfirmationOpen,
        requestReload,
        confirmReload,
        continueEditing,
        saveAndReturn,
    };
}
