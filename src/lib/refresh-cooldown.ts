export function createRefreshCooldown(
    cooldownMs: number,
    now: () => number = Date.now,
) {
    let nextAllowedAt = 0;

    return {
        tryStart() {
            const current = now();
            if (current < nextAllowedAt) return false;
            nextAllowedAt = current + cooldownMs;
            return true;
        },
        remainingMs() {
            return Math.max(0, nextAllowedAt - now());
        },
    };
}
