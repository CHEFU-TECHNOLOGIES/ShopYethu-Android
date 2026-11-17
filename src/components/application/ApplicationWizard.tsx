import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    BackHandler,
    Text,
    View,
} from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { router, useFocusEffect } from "expo-router";
import { Button, Page } from "@/components/market/Primitives";
import { applicationStyles as styles } from "@/constants/application-styles";
import { palette, ui } from "@/constants/market-theme";
import { useApplicationDraft } from "@/hooks/use-application-draft";
import {
    applicationIssue,
    applicationSteps,
} from "@/lib/application-form";
import { api } from "@/lib/api";
import { currentSession, type Session } from "@/lib/session";
import type { SellerApplication } from "@/types/marketplace";
import {
    BusinessFields,
    ContactFields,
    ProductFields,
} from "./ApplicationFields";
import { ApplicationReview } from "./ApplicationReview";

export function ApplicationWizard({
    session,
    previous,
    onSubmitted,
    onCheckStatus,
}: {
    session: Session;
    previous: SellerApplication | null;
    onSubmitted: (application: SellerApplication, warning: string) => void;
    onCheckStatus: () => void;
}) {
    const draft = useApplicationDraft(
        session.user.uid,
        session.user.name,
        previous,
    );
    const { form, step, ready, goTo } = draft;
    const [busy, setBusy] = useState(false),
        [error, setError] = useState("");
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
    async function submit() {
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
                body: JSON.stringify({ ...form, area: "", email: session.user.email }),
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
            setError((cause as Error).message);
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
                cause instanceof Error
                    ? cause.message
                    : "Could not upload the CIPC certificate. Please try again.",
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
            requiredIssue?.index === step
                ? requiredIssue.issue
                : null,
        uploadProof,
        uploadingProof,
        update: draft.update,
    };
    return (
        <Page
            key={step}
            title="Start selling"
            header={
                <View style={{ gap: 8 }}>
                    <View style={styles.top}>
                        <Text style={[ui.title, styles.topTitle]}>
                            {applicationSteps[step]}
                        </Text>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ disabled: busy || uploadingProof || !ready }}
                            disabled={busy || uploadingProof || !ready}
                            onPress={() => void saveAndExit()}
                            style={styles.link}
                        >
                            <Text style={styles.linkText}>Save & exit</Text>
                        </Pressable>
                    </View>
                    <Text accessibilityLiveRegion="polite" style={ui.subtitle}>
                        Step {step + 1} of 4
                        {responding ? " · Update your application" : ""}
                    </Text>
                    <View
                        accessible
                        accessibilityLabel={`Step ${step + 1} of 4`}
                        style={styles.progress}
                    >
                        {applicationSteps.map((title, index) => (
                            <View
                                key={title}
                                style={[
                                    styles.segment,
                                    index <= step && styles.complete,
                                ]}
                            />
                        ))}
                    </View>
                </View>
            }
        >
            {!ready ? (
                draft.loadError ? (
                    <View style={ui.card}>
                        <Text accessibilityRole="alert" style={ui.error}>
                            {draft.loadError}
                        </Text>
                        <Button
                            title="Try opening draft again"
                            disabled={draft.saving}
                            onPress={draft.retryLoad}
                        />
                        <Button
                            title={
                                draft.saving
                                    ? "Starting fresh…"
                                    : "Start a new draft"
                            }
                            secondary
                            disabled={draft.saving}
                            onPress={() => void draft.startFresh()}
                        />
                        <Button
                            title="Back to account"
                            secondary
                            disabled={draft.saving}
                            onPress={exit}
                        />
                    </View>
                ) : (
                    <ActivityIndicator
                        color={palette.brand}
                        accessibilityLabel="Opening your application"
                    />
                )
            ) : (
                <>
                    {submitting && (
                        <View style={ui.card} accessibilityLiveRegion="polite">
                            <Text style={ui.heading}>Sending your application</Text>
                            <Text style={ui.subtitle}>
                                Your application is not confirmed yet. Please wait while we send it.
                            </Text>
                        </View>
                    )}
                    {responding && step === 0 && (
                        <View style={ui.card}>
                            <Text style={ui.heading}>
                                A little more information
                            </Text>
                            <Text style={ui.subtitle}>{previous.reason}</Text>
                            <Text style={ui.small}>
                                Update your details, then add your response on
                                the review step.
                            </Text>
                        </View>
                    )}
                    {step === 0 && <BusinessFields {...fields} />}
                    {step === 1 && <ProductFields {...fields} />}
                    {step === 2 && <ContactFields {...fields} />}
                    {step === 3 && (
                        <ApplicationReview
                            {...fields}
                            edit={changeStep}
                            issue={
                                requiredIssue?.issue
                                    ? {
                                          ...requiredIssue.issue,
                                          index: requiredIssue.index,
                                      }
                                    : undefined
                            }
                            requested={responding ? previous.reason : undefined}
                        />
                    )}
                    {!!error && (
                        <View style={{ gap: 8 }}>
                            <Text accessibilityRole="alert" style={ui.error}>
                                {error}
                            </Text>
                            <Pressable
                                accessibilityRole="button"
                                disabled={busy}
                                onPress={onCheckStatus}
                                style={styles.link}
                            >
                                <Text style={styles.linkText}>
                                    Check application status
                                </Text>
                            </Pressable>
                        </View>
                    )}
                    {!!draft.draftError && (
                        <View style={ui.card}>
                            <Text accessibilityRole="alert" style={ui.error}>
                                {draft.draftError}
                            </Text>
                            <Button
                                title="Save draft again"
                                secondary
                                disabled={busy || draft.saving}
                                onPress={() => void draft.save()}
                            />
                        </View>
                    )}
                    <View style={styles.controls}>
                        {step > 0 && (
                            <View style={styles.control}>
                                <Button
                                    title="Back"
                                    secondary
                                    disabled={busy || uploadingProof}
                                    onPress={() => changeStep(step - 1)}
                                />
                            </View>
                        )}
                        <View style={styles.control}>
                            <Button
                                title={
                                    busy
                                        ? "Please wait…"
                                        : step === 3
                                          ? responding
                                              ? "Resubmit application"
                                              : "Submit application"
                                          : "Continue"
                                }
                                disabled={busy || uploadingProof || !ready || Boolean(requiredIssue)}
                                onPress={() =>
                                    step === 3 ? void submit() : next()
                                }
                            />
                        </View>
                    </View>
                </>
            )}
        </Page>
    );
}
 