import { useState } from "react";
import { Text } from "react-native";
import {
    Button,
    Page,
    ResourceState,
    SignInNotice,
} from "@/components/market/Primitives";
import { ApplicationStatus } from "@/components/application/ApplicationStatus";
import { ApplicationWizard } from "@/components/application/ApplicationWizard";
import { useAuth } from "@/lib/auth";
import type { Session } from "@/lib/session";
import { useSellerAccount } from "@/hooks/use-seller-account";
import { recordSellerApplication } from "@/lib/seller-account";
import { ui } from "@/constants/market-theme";

function SignedInApplication({ session }: { session: Session }) {
    const resource = useSellerAccount();
    const [warning, setWarning] = useState("");
    const [editing, setEditing] = useState(false);
    const application = resource.data?.application;
    if (
        resource.data &&
        (!application || (application.status === "more-info" && editing))
    ) {
        return (
            <ApplicationWizard
                key={`${session.user.uid}:${application?.updatedAt || "new"}`}
                session={session}
                previous={application || null}
                onCheckStatus={resource.refresh}
                onSubmitted={(result, message) => {
                    recordSellerApplication(session.user.uid, result);
                    setWarning(message);
                    setEditing(false);
                }}
            />
        );
    }
    return (
        <Page
            title="Seller application"
            subtitle="Your next chapter starts here."
            back
            onRefresh={resource.refresh}
            refreshing={resource.refreshing}
        >
            <ResourceState {...resource} loading={resource.loading && !resource.data} retry={resource.refresh} />
            {!!warning && (
                <Text accessibilityRole="alert" style={ui.error}>
                    {warning}
                </Text>
            )}
            {application && (
                <>
                    <Button
                        title="Check status"
                        secondary
                        compact
                        inline
                        loading={resource.refreshing}
                        disabled={resource.refreshing}
                        onPress={resource.refresh}
                    />
                    <ApplicationStatus
                        application={application}
                        store={resource.data?.store || null}
                        onEdit={() => setEditing(true)}
                    />
                </>
            )}
        </Page>
    );
}

export default function ApplicationScreen() {
    const { session } = useAuth();
    return session ? (
        <SignedInApplication key={session.user.uid} session={session} />
    ) : (
        <Page title="Start selling" back>
            <SignInNotice />
        </Page>
    );
}
