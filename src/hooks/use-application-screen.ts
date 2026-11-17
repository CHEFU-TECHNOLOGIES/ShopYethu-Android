import { useState } from "react";
import { useSellerAccount } from "@/hooks/use-seller-account";
import { recordSellerApplication } from "@/lib/seller-account";
import type { Session } from "@/lib/session";
import type { SellerApplication } from "@/types/marketplace";

export function useApplicationScreen(session: Session) {
    const resource = useSellerAccount();
    const [warning, setWarning] = useState("");
    const [editing, setEditing] = useState(false);
    const application = resource.data?.application;

    function onSubmitted(result: SellerApplication, message: string) {
        recordSellerApplication(session.user.uid, result);
        setWarning(message);
        setEditing(false);
    }

    return {
        resource,
        warning,
        editing,
        setEditing,
        application,
        onSubmitted,
    };
}
