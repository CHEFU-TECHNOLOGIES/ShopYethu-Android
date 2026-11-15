export type AccountUser = { uid: string; email: string; name: string; picture?: string };

function text(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function userInfoRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function accountUserFromInfo(value: unknown): AccountUser {
    const info = userInfoRecord(value);
    const uid = text(info.sub), email = text(info.email);
    if (info.app !== "shopyethu" || !uid || !email || !email.includes("@")) {
        throw new Error("Unable to verify your account. Please sign in again.");
    }
    const suppliedName = text(info.name) || [text(info.given_name), text(info.family_name)].filter(Boolean).join(" ");
    const name = suppliedName.replace(/\s+/g, " ") || email;
    let picture: string | undefined;
    const suppliedPicture = text(info.picture);
    if (suppliedPicture) {
        try {
            const url = new URL(suppliedPicture);
            if (url.protocol === "https:" && !url.username && !url.password) picture = url.href;
        } catch { /* Invalid photos use the initials fallback. */ }
    }
    return { uid, email, name, ...(picture ? { picture } : {}) };
}

// Explicit profile allowlist: never log access tokens, refresh tokens, auth
// codes, headers or the complete OAuth token response, even in development.
export function accountUserDiagnostics(value: unknown) {
    const info = userInfoRecord(value);
    const fields = ["sub", "uid", "email", "name", "given_name", "family_name", "picture", "profilePicture", "photoURL", "avatarUrl", "gender", "app", "scope"];
    return {
        fields: Object.keys(info),
        profile: Object.fromEntries(fields.filter(key => typeof info[key] === "string").map(key => [key, info[key]])),
    };
}
