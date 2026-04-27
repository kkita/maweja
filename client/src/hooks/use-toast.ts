import { useState, useCallback, useEffect } from "react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export type ToastFn = (opts: Omit<Toast, "id">) => void;

let toastState: Toast[] = [];
let listeners: (() => void)[] = [];

function notify() {
  listeners.forEach((fn) => fn());
}

export function useToast() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const toast = useCallback(({ title, description, variant }: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    toastState = [...toastState, { id, title, description, variant }];
    notify();
    setTimeout(() => {
      toastState = toastState.filter((t) => t.id !== id);
      notify();
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    toastState = toastState.filter((t) => t.id !== id);
    notify();
  }, []);

  return { toasts: toastState, toast, dismiss };
}
