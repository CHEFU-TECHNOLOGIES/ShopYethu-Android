import { API_BASE, CLIENT_ID } from "./config";
import { accessToken } from "./session";

export type PhoneVerificationReceipt = {
    verified: true;
    phone: string;
    verifiedAt: string;
};

function record(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {};
}

async function request(path: string, method = "GET", body?: object) {
    const token = await accessToken();
    if (!token) throw new Error("Sign in again to manage your account phone number.");
    const headers = new Headers({
        Authorization: `Bearer ${token}`,
        "x-chefu-app": CLIENT_ID,
    });
    if (body) headers.set("Content-Type", "application/json");
    let response: Response;
    try {
        response = await fetch(`${API_BASE}${path}`, {
            method,
            headers,
            ...(body ? { body: JSON.stringify(body) } : {}),
            cache: "no-store",
            signal: AbortSignal.timeout(12000),
        });
    } catch {
        throw new Error("Could not reach CheFu account services. Check your connection and try again.");
    }
    const data = record(await response.json().catch(() => null));
    if (!response.ok) {
        const message = typeof data.message === "string"
            ? data.message
            : Array.isArray(data.message)
                ? data.message.filter((item): item is string => typeof item === "string").join(" ")
                : "";
        throw new Error(message || "CheFu account services could not complete the request.");
    }
    return data;
}

export async function sendAccountPhoneCode(phone: string) {
    const data = await request("/phone-verification/send", "POST", { phone });
    if (typeof data.phone !== "string" || !/^\+[1-9]\d{7,14}$/.test(data.phone)) {
        throw new Error("The phone verification response was invalid. Please try again.");
    }
    if (data.verified === true && typeof data.verifiedAt === "string") {
        return {
            verified: true as const,
            phone: data.phone,
            verifiedAt: data.verifiedAt,
        };
    }
    if (data.verified !== false) {
        throw new Error("The phone verification response was invalid. Please try again.");
    }
    return { verified: false as const, phone: data.phone };
}

export async function checkAccountPhoneCode(phone: string, code: string): Promise<PhoneVerificationReceipt> {
    const data = await request("/phone-verification/check", "POST", { phone, code });
    if (
        data.verified !== true ||
        data.phone !== phone ||
        typeof data.verifiedAt !== "string" ||
        !Number.isFinite(Date.parse(data.verifiedAt))
    ) {
        throw new Error("The phone verification was not confirmed. Please try again.");
    }
    return {
        verified: true,
        phone,
        verifiedAt: data.verifiedAt,
    };
}
