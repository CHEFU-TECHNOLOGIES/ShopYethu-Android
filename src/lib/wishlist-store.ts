type State = {
    uid: string | null;
    productIds: string[];
    ready: boolean;
    saving: boolean;
    error: string;
};

type Storage = {
    read: (key: string) => Promise<unknown>;
    write: (key: string, value: unknown) => Promise<void>;
};

const KEY = "shopyethu.wishlist.v1";
const GUEST_KEY = `${KEY}.guest`;
const accountKey = (uid: string) => `${KEY}.account.${encodeURIComponent(uid)}`;

function storedIds(value: unknown): string[] {
    if (value === null) return [];
    if (
        !Array.isArray(value) ||
        value.some(
            (id) =>
                typeof id !== "string" ||
                id.length === 0 ||
                id.length > 150,
        )
    ) {
        throw new Error("Invalid saved wishlist.");
    }
    return [...new Set(value)];
}

export function createWishlistStore(storage: Storage) {
    let state: State = {
        uid: null,
        productIds: [],
        ready: false,
        saving: false,
        error: "",
    };
    let version = 0;
    let activating: string | null | undefined;
    const listeners = new Set<() => void>();
    const emit = () => listeners.forEach((listener) => listener());

    return {
        get: () => state,
        subscribe(listener: () => void) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        async activate(uid: string | null) {
            if (
                state.uid === uid &&
                (state.ready || activating === uid)
            ) {
                return;
            }

            activating = uid;
            const epoch = ++version;
            state = {
                uid,
                productIds: [],
                ready: false,
                saving: false,
                error: "",
            };
            emit();

            try {
                const key = uid ? accountKey(uid) : GUEST_KEY;
                const productIds = storedIds(await storage.read(key));
                if (epoch !== version) return;
                state = { uid, productIds, ready: true, saving: false, error: "" };
                emit();
            } catch {
                if (epoch === version) {
                    state = {
                        uid,
                        productIds: [],
                        ready: false,
                        saving: false,
                        error: "Could not load your wishlist. Please try again.",
                    };
                    emit();
                }
            } finally {
                if (activating === uid) activating = undefined;
            }
        },
        async toggle(productId: string) {
            if (!productId || productId.length > 150) {
                throw new Error("This product cannot be saved.");
            }
            if (!state.ready) {
                throw new Error(
                    state.error || "Your wishlist is still loading.",
                );
            }
            if (state.saving) {
                throw new Error("Please wait for your wishlist to finish saving.");
            }

            const { uid, productIds } = state;
            const epoch = version;
            const exists = productIds.includes(productId);
            const nextIds = exists
                ? productIds.filter((id) => id !== productId)
                : [...productIds, productId];
            state = { ...state, saving: true, error: "" };
            emit();

            try {
                await storage.write(
                    uid ? accountKey(uid) : GUEST_KEY,
                    nextIds,
                );
            } catch {
                if (epoch === version) {
                    state = {
                        ...state,
                        saving: false,
                        error: "Could not save your wishlist. Please try again.",
                    };
                    emit();
                }
                throw new Error(
                    "Could not save your wishlist. Please try again.",
                );
            }

            if (epoch === version) {
                state = {
                    ...state,
                    productIds: nextIds,
                    ready: true,
                    saving: false,
                    error: "",
                };
                emit();
            }
            return !exists;
        },
    };
}
