import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    BackHandler,
    Pressable,
    Text,
    View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Button, Page } from "@/components/market/Primitives";
import { applicationStyles as styles } from "@/constants/application-styles";
import { palette, ui } from "@/constants/market-theme";
import { useApplicationDraft } from "@/hooks/use-application-draft";
import {
    applicationSteps,
    validateApplicationStep,
} from "@/lib/application-form";
import { api } from "@/lib/api";
import type { Session } from "@/lib/session";
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
    const lock = useRef(false);
    const responding = previous?.status === "more-info";
    const exit = () => router.replace("/account");
    function changeStep(next: number) {
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
        if (lock.current || !ready) return;
        lock.current = true;
        setBusy(true);
        const saved = await draft.save();
        lock.current = false;
        setBusy(false);
        if (saved) exit();
    }
    function next() {
        const issue = validateApplicationStep(form, step, responding);
        if (issue) {
            setError(issue);
            return;
        }
        changeStep(step + 1);
    }
    async function submit() {
        if (lock.current) return;
        for (let index = 0; index < 4; index++) {
            const issue = validateApplicationStep(form, index, responding);
            if (issue) {
                draft.goTo(index);
                setError(issue);
                return;
            }
        }
        lock.current = true;
        setBusy(true);
        setError("");
        try {
            const application = await api<SellerApplication>("/application", {
                method: "POST",
                body: JSON.stringify({ ...form, email: session.user.email }),
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
            lock.current = false;
            setBusy(false);
        }
    }
    const fields = {
        form,
        email: session.user.email,
        disabled: busy || !ready,
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
                            accessibilityState={{ disabled: busy || !ready }}
                            disabled={busy || !ready}
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
                                    disabled={busy}
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
                                disabled={busy}
                                onPress={() =>
                                    step === 3 ? void submit() : next()
                                }
                            />
                        </View>
                    </View>
                    <Text accessibilityLiveRegion="polite" style={ui.small}>
                        {draft.saving
                            ? "Saving on this device…"
                            : draft.savedAt
                              ? "Draft saved on this device. You can come back later."
                              : "Your progress saves on this device as you go."}
                    </Text>
                </>
            )}
        </Page>
    );
}
