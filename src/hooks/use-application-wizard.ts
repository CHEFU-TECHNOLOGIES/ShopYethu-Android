import { useCallback, useRef, useState } from "react";
import { BackHandler } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { router, useFocusEffect } from "expo-router";
import { useApplicationDraft } from "@/hooks/use-application-draft";
import { applicationIssue } from "@/lib/application-form";
import { api } from "@/lib/api";
import { currentSession, type Session } from "@/lib/session";
import type { SellerApplication } from "@/types/marketplace";

function errorMessage(cause: unknown, fallback: string) {
    if (
        cause &&
        typeof cause === "object" &&
        "message" in cause &&
        typeof cause.message === "string"
    ) {
        return cause.message;
    }
    return fallback;
}

export function useApplicationWizard(
    session: Session,
    previous: SellerApplication | null,
    onSubmitted: (application: SellerApplication, warning: string) => void,
) {
    const draft = useApplicationDraft(
        session.user.uid,
        session.user.name,
        previous,
    );
    const { form, step, ready, goTo } = draft;
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [uploadingProof, setUploadingProof] = useState(false);
    const lock = useRef(false);
    const responding = previous?.status === "more-info";
    const requiredIssue = (step === 3 ? [0, 1, 2, 3] : [step])
        .map((index) => ({
            index,
            issue: applicationIssue(form, index, responding),
        }))
        .find((result) => result.issue !== null);
    const exit = () => router.replace("/account");

    function changeStep(next: number) {
        if (lock.current || !ready) return;
        setError("");
        draft.goTo(next);
    }

    useFocusEffect(
        useCallback(() => {
            const listener = BackHandler.addEventListener(
                "hardwareBackPress",
                () => {
                    if (lock.current) return true;
                    if (step > 0) {
                        goTo(step - 1);
                        setError("");
                        return true;
                    }
                    return false;
                },
            );
            return () => listener.remove();
        }, [step, goTo]),
    );

    async function saveAndExit() {
        if (lock.current || !ready || uploadingProof) return;
        lock.current = true;
        setBusy(true);
        const saved = await draft.save();
        lock.current = false;
        setBusy(false);
        if (saved) exit();
    }

    function next() {
        if (lock.current || !ready || uploadingProof || step >= 3) return;
        if (applicationIssue(form, step, responding)) return;
        changeStep(step + 1);
    }

    async function submit(whatsappAvailable: boolean) {
        if (lock.current || !ready || uploadingProof) return;
        for (let index = 0; index < 4; index++) {
            const issue = applicationIssue(form, index, responding);
            if (issue) {
                draft.goTo(index);
                setError("");
                return;
            }
        }
        lock.current = true;
        setBusy(true);
        setSubmitting(true);
        setError("");
        try {
            const application = await api<SellerApplication>("/application", {
                method: "POST",
                body: JSON.stringify({
                    ...form,
                    whatsappAvailable,
                    area: "",
                    email: session.user.email,
                }),
            });
            let warning = "";
            try {
                await draft.discard();
            } catch {
                warning =
                    "Your application was submitted, but the saved draft could not be removed from this device.";
            }
            onSubmitted(application, warning);
        } catch (cause) {
            setError(
                errorMessage(
                    cause,
                    "Could not submit your application. Please try again.",
                ),
            );
            setSubmitting(false);
            lock.current = false;
            setBusy(false);
        }
    }

    async function uploadProof() {
        if (lock.current || !ready) return;
        lock.current = true;
        setUploadingProof(true);
        setError("");
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
                copyToCacheDirectory: true,
                multiple: false,
            });
            if (result.canceled) return;
            const asset = result.assets[0];
            const extension = asset.name.toLowerCase().split(".").pop() || "";
            const mimeType = asset.mimeType?.toLowerCase() || "";
            const format =
                extension === "pdf" || mimeType === "application/pdf"
                    ? "pdf"
                    : ["jpg", "jpeg"].includes(extension) ||
                        mimeType === "image/jpeg"
                      ? "jpg"
                      : extension === "png" || mimeType === "image/png"
                        ? "png"
                        : extension === "webp" || mimeType === "image/webp"
                          ? "webp"
                          : "";
            if (!format) {
                throw new Error("Choose a PDF, JPG, PNG or WebP certificate.");
            }
            const file = new File(asset.uri);
            if ((asset.size ?? file.size) > 2 * 1024 * 1024) {
                throw new Error("Choose a certificate smaller than 2 MB.");
            }
            const content = await file.base64();
            if (!content || content.length > 2_800_000) {
                throw new Error("Choose a certificate smaller than 2 MB.");
            }
            const uploaded = await api<{
                assetId: string;
                format: "pdf" | "jpg" | "png" | "webp";
            }>("/application/proof", {
                method: "POST",
                body: JSON.stringify({ file: content, format }),
            });
            if (currentSession()?.user.uid !== session.user.uid) {
                throw new Error(
                    "Your account changed. Please sign in and try again.",
                );
            }
            draft.update("cipcCertificateId", uploaded.assetId);
            draft.update("cipcCertificateFormat", uploaded.format);
            draft.update("cipcCertificateName", asset.name.slice(0, 160));
        } catch (cause) {
            setError(
                errorMessage(
                    cause,
                    "Could not upload the CIPC certificate. Please try again.",
                ),
            );
        } finally {
            lock.current = false;
            setUploadingProof(false);
        }
    }

    const fields = {
        form,
        email: session.user.email,
        disabled: busy || uploadingProof || !ready,
        fieldIssue:
            requiredIssue?.index === step ? requiredIssue.issue : null,
        uploadProof,
        uploadingProof,
        update: draft.update,
    };

    return {
        draft,
        step,
        ready,
        busy,
        error,
        submitting,
        uploadingProof,
        responding,
        requiredIssue,
        fields,
        exit,
        changeStep,
        saveAndExit,
        next,
        submit,
    };
}
