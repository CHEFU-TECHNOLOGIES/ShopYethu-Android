import { useState } from "react";
import { Text } from "react-native";
import {
    Page,
    ResourceState,
    SignInNotice,
} from "@/components/market/Primitives";
import { ApplicationStatus } from "@/components/application/ApplicationStatus";
import { ApplicationWizard } from "@/components/application/ApplicationWizard";
import { useAuth } from "@/lib/auth";
import type { Session } from "@/lib/session";
import { useResource } from "@/hooks/use-resource";
import type { SellerApplication, Storefront } from "@/types/marketplace";
import { ui } from "@/constants/market-theme";

type Account = {
    application: SellerApplication | null;
    store: Storefront | null;
};

function SignedInApplication({ session }: { session: Session }) {
    const resource = useResource<Account>("/me");
    const [submitted, setSubmitted] = useState<SellerApplication | null>(null);
    const [warning, setWarning] = useState("");
    const [editing, setEditing] = useState(false);
    const application = submitted || resource.data?.application;
    if (
        resource.data &&
        !submitted &&
        (!application || (application.status === "more-info" && editing))
    ) {
        return (
            <ApplicationWizard
                key={`${session.user.uid}:${application?.updatedAt || "new"}`}
                session={session}
                previous={application || null}
                onCheckStatus={resource.refresh}
                onSubmitted={(result, message) => {
                    setSubmitted(result);
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
            onRefresh={() => {
                setSubmitted(null);
                resource.refresh();
            }}
            refreshing={resource.loading}
        >
            {!submitted && (
                <ResourceState {...resource} retry={resource.refresh} />
            )}
            {!!warning && (
                <Text accessibilityRole="alert" style={ui.error}>
                    {warning}
                </Text>
            )}
            {application && (
                <ApplicationStatus
                    application={application}
                    store={resource.data?.store || null}
                    onEdit={() => setEditing(true)}
                />
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
