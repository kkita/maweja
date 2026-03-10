import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useToast } from "../hooks/use-toast";
import { X } from "lucide-react";
export function Toaster() {
    const { toasts, dismiss } = useToast();
    return (_jsx("div", { className: "fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm", children: toasts.map((toast) => (_jsx("div", { "data-testid": `toast-${toast.id}`, className: `rounded-xl p-4 shadow-2xl border transition-all animate-in slide-in-from-right ${toast.variant === "destructive"
                ? "bg-red-600 text-white border-red-700"
                : "bg-white text-gray-900 border-gray-200"}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-semibold text-sm", children: toast.title }), toast.description && _jsx("p", { className: "text-sm opacity-80 mt-1", children: toast.description })] }), _jsx("button", { onClick: () => dismiss(toast.id), className: "opacity-60 hover:opacity-100", "data-testid": `dismiss-toast-${toast.id}`, children: _jsx(X, { size: 16 }) })] }) }, toast.id))) }));
}
//# sourceMappingURL=Toaster.js.map