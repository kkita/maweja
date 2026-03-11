interface Toast {
    id: string;
    title: string;
    description?: string;
    variant?: "default" | "destructive";
}
export declare function useToast(): {
    toasts: Toast[];
    toast: ({ title, description, variant }: Omit<Toast, "id">) => void;
    dismiss: (id: string) => void;
};
export {};
//# sourceMappingURL=use-toast.d.ts.map