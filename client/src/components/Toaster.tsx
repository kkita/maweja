import { useToast } from "../hooks/use-toast";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          data-testid={`toast-${toast.id}`}
          className={`rounded-xl p-4 shadow-2xl border transition-all animate-in slide-in-from-right ${
            toast.variant === "destructive"
              ? "bg-red-600 text-white border-red-700"
              : "bg-white text-gray-900 border-gray-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="font-semibold text-sm">{toast.title}</p>
              {toast.description && <p className="text-sm opacity-80 mt-1">{toast.description}</p>}
            </div>
            <button onClick={() => dismiss(toast.id)} className="opacity-60 hover:opacity-100" data-testid={`dismiss-toast-${toast.id}`}>
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
