import {
    forwardRef,
    useCallback,
    useEffect,
    useRef,
    useState,
    type ComponentRef,
} from "react";
import {
    Pressable as NativePressable,
    type PressableProps,
} from "react-native";

type Props = PressableProps & { debounceMs?: number };

export const DebouncedPressable = forwardRef<ComponentRef<typeof NativePressable>, Props>(
    function DebouncedPressable(
        {
            accessibilityState,
            debounceMs = 500,
            disabled = false,
            onPress,
            ...props
        },
        ref,
    ) {
        const [debouncing, setDebouncing] = useState(false);
        const locked = useRef(false);
        const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

        useEffect(
            () => () => {
                if (timer.current) clearTimeout(timer.current);
            },
            [],
        );

        const handlePress = useCallback<NonNullable<PressableProps["onPress"]>>(
            (event) => {
                if (disabled || locked.current) return;

                locked.current = true;
                setDebouncing(true);
                timer.current = setTimeout(() => {
                    locked.current = false;
                    timer.current = null;
                    setDebouncing(false);
                }, debounceMs);
                onPress?.(event);
            },
            [debounceMs, disabled, onPress],
        );

        const isDisabled = disabled || debouncing;
        return (
            <NativePressable
                {...props}
                ref={ref}
                disabled={isDisabled}
                accessibilityState={{
                    ...accessibilityState,
                    disabled: isDisabled,
                }}
                onPress={handlePress}
            />
        );
    },
);
