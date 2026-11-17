import { ActivityIndicator, Text, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { Button, Page } from "@/components/market/Primitives";
import { applicationStyles as styles } from "@/constants/application-styles";
import { palette, ui } from "@/constants/market-theme";
import { applicationSteps } from "@/lib/application-form";
import type { Session } from "@/lib/session";
import type { SellerApplication } from "@/types/marketplace";
import { useApplicationWizard } from "@/hooks/use-application-wizard";
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
    const {
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
    } = useApplicationWizard(session, previous, onSubmitted);
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
                            <Text style={ui.subtitle}>{previous?.reason}</Text>
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
                            requested={responding ? previous?.reason : undefined}
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
 