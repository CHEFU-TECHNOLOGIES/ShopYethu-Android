import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { readWelcome, saveWelcome } from "./welcome-storage";

type Welcome = {
    ready: boolean;
    completed: boolean;
    complete: () => Promise<void>;
};

const Context = createContext<Welcome | null>(null);

export function WelcomeProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState({ ready: false, completed: false });

    useEffect(() => {
        let active = true;
        void readWelcome()
            .then((value) => {
                if (active)
                    setState({ ready: true, completed: value === "complete" });
            })
            .catch(() => {
                // An unavailable device store must not prevent access to shopping.
                if (active) setState({ ready: true, completed: false });
            });
        return () => {
            active = false;
        };
    }, []);

    const complete = useCallback(async () => {
        // Keep the app usable even if this device cannot persist the preference.
        await saveWelcome().catch(() => undefined);
        setState({ ready: true, completed: true });
    }, []);

    return (
        <Context.Provider value={{ ...state, complete }}>
            {children}
        </Context.Provider>
    );
}

export function useWelcome() {
    const value = useContext(Context);
    if (!value) throw new Error("WelcomeProvider is required.");
    return value;
}
