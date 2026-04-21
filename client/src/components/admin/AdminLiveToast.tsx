import { Volume2, X } from "lucide-react";
import { NOTIF_CFG, type Notif } from "./AdminNotifPanel";

interface AdminLiveToastProps {
  toast: Notif | null;
  onClose: () => void;
  onNavigate: (href: string) => void;
}

export default function AdminLiveToast({ toast, onClose, onNavigate }: AdminLiveToastProps) {
  if (!toast) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[200] flex items-start gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3.5 shadow-2xl cursor-pointer max-w-sm"
      style={{ animation: "slideInDown 0.3s cubic-bezier(.16,1,.3,1)", boxShadow: "0 8px 40px rgba(220,38,38,0.12), 0 2px 8px rgba(0,0,0,0.1)" }}
      onClick={() => { onNavigate(toast.href); onClose(); }}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${NOTIF_CFG[toast.type].bg}`}>
        {(() => { const IC = NOTIF_CFG[toast.type].icon; return <IC size={18} className={NOTIF_CFG[toast.type].color} />; })()}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Volume2 size={10} className="text-rose-500 flex-shrink-0" />
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">MAWEJA Admin</p>
        </div>
        <p className="font-bold text-[13px] text-zinc-900 dark:text-zinc-50 leading-snug">{toast.title}</p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{toast.description}</p>
      </div>
      <button onClick={e => { e.stopPropagation(); onClose(); }} className="p-1 rounded-lg text-zinc-300 hover:text-zinc-500 transition-colors flex-shrink-0">
        <X size={13} />
      </button>
    </div>
  );
}
