import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";

export function useReportSubmission(
    productId: string | undefined,
    orderId: string | undefined,
) {
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const [reference, setReference] = useState("");
    const [error, setError] = useState("");
    const locked = useRef(false);

    async function submit() {
        if (locked.current) return;
        locked.current = true;
        setBusy(true);
        setError("");
        try {
            const report = await api<{ id: string }>("/reports", {
                method: "POST",
                body: JSON.stringify({
                    ...(orderId ? { orderId } : { productId }),
                    message,
                }),
            });
            setReference(report.id);
        } catch (cause) {
            const failure =
                cause instanceof Error
                    ? cause
                    : new Error("Could not submit your report. Please try again.");
            setError(failure.message);
            toast.error(failure.message);
        } finally {
            locked.current = false;
            setBusy(false);
        }
    }

    return { message, setMessage, busy, reference, error, submit };
}
