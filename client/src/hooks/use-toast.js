import { useState, useCallback } from "react";
let toastState = [];
let listeners = [];
function notify() {
    listeners.forEach((fn) => fn());
}
export function useToast() {
    const [, setTick] = useState(0);
    useState(() => {
        const listener = () => setTick((t) => t + 1);
        listeners.push(listener);
        return () => {
            listeners = listeners.filter((l) => l !== listener);
        };
    });
    const toast = useCallback(({ title, description, variant }) => {
        const id = Math.random().toString(36).slice(2);
        toastState = [...toastState, { id, title, description, variant }];
        notify();
        setTimeout(() => {
            toastState = toastState.filter((t) => t.id !== id);
            notify();
        }, 4000);
    }, []);
    const dismiss = useCallback((id) => {
        toastState = toastState.filter((t) => t.id !== id);
        notify();
    }, []);
    return { toasts: toastState, toast, dismiss };
}
//# sourceMappingURL=use-toast.js.map