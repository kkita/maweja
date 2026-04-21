import { useState } from "react";
import {
  Bell, CheckCheck, X, ShoppingCart, Wrench,
  MessageSquare, UserCheck, Users, AlertTriangle,
} from "lucide-react";
import { EmptyState, FilterChip } from "./AdminUI";

/* ─── Types ───────────────────────────────────────────────────────────────── */
export type NotifType = "order" | "service" | "message" | "driver" | "user" | "alarm";

export interface Notif {
  id: string;
  title: string;
  description: string;
  type: NotifType;
  time: Date;
  read: boolean;
  href: string;
}

export const NOTIF_CFG: Record<NotifType, { icon: any; bg: string; color: string }> = {
  order:   { icon: ShoppingCart,   bg: "bg-rose-50 dark:bg-rose-950/30",     color: "text-rose-600 dark:text-rose-400" },
  service: { icon: Wrench,         bg: "bg-orange-50 dark:bg-orange-950/30", color: "text-orange-600 dark:text-orange-400" },
  message: { icon: MessageSquare,  bg: "bg-blue-50 dark:bg-blue-950/30",     color: "text-blue-600 dark:text-blue-400" },
  driver:  { icon: UserCheck,      bg: "bg-emerald-50 dark:bg-emerald-950/30", color: "text-emerald-600 dark:text-emerald-400" },
  user:    { icon: Users,          bg: "bg-purple-50 dark:bg-purple-950/30", color: "text-purple-600 dark:text-purple-400" },
  alarm:   { icon: AlertTriangle,  bg: "bg-red-100 dark:bg-red-900/40",      color: "text-red-700 dark:text-red-400" },
};

export const NOTIF_HREFS: Record<NotifType, string> = {
  order: "/admin/orders", service: "/admin/services", message: "/admin/chat",
  driver: "/admin/drivers", user: "/admin/customers", alarm: "/admin/orders",
};

export const NOTIF_SESSION_KEY = "maweja_admin_notifs_v2";

export function timeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "À l'instant";
  if (sec < 3600) return `il y a ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `il y a ${Math.floor(sec / 3600)} h`;
  return `il y a ${Math.floor(sec / 86400)} j`;
}

/* ─── NotifPanel Component ────────────────────────────────────────────────── */
interface NotifPanelProps {
  open: boolean;
  onClose: () => void;
  notifs: Notif[];
  onDismiss: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onNavigate: (href: string) => void;
}

export default function NotifPanel({ open, onClose, notifs, onDismiss, onMarkAllRead, onClearAll, onNavigate }: NotifPanelProps) {
  const [tab, setTab] = useState<"all" | NotifType>("all");
  const filtered = tab === "all" ? notifs : notifs.filter(n => n.type === tab);
  const tabs: { key: "all" | NotifType; label: string }[] = [
    { key: "all", label: "Toutes" },
    { key: "order", label: "Commandes" },
    { key: "service", label: "Services" },
    { key: "message", label: "Messages" },
    { key: "driver", label: "Agents" },
  ];

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative ml-auto h-full w-full max-w-sm bg-white dark:bg-zinc-900 shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800"
        style={{ animation: "slideInRight 0.22s cubic-bezier(.16,1,.3,1)" }}
        data-testid="notif-panel"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
              <Bell size={13} className="text-rose-600" />
            </div>
            <span className="font-bold text-[13px] text-zinc-900 dark:text-zinc-100">Notifications</span>
            {notifs.length > 0 && (
              <span className="text-[9px] font-black text-white bg-rose-500 px-1.5 py-0.5 rounded-full leading-none">{notifs.length}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onMarkAllRead} title="Tout marquer lu" className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors" data-testid="notif-mark-all-read">
              <CheckCheck size={13} />
            </button>
            <button onClick={onClearAll} title="Tout effacer" className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors" data-testid="notif-clear-all">
              <X size={13} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ml-1">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex gap-1 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0 overflow-x-auto scrollbar-none">
          {tabs.map(t => {
            const cnt = t.key === "all" ? notifs.length : notifs.filter(n => n.type === t.key).length;
            return (
              <FilterChip key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} count={cnt} />
            );
          })}
        </div>

        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <EmptyState icon={Bell} title="Aucune notification" description={tab === "all" ? "Tout est calme pour l'instant." : "Aucune notification dans cette catégorie."} />
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filtered.map(n => {
                const cfg = NOTIF_CFG[n.type];
                const IC = cfg.icon;
                const timeStr = n.time.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group cursor-pointer ${!n.read ? "bg-rose-50/20 dark:bg-rose-950/5 border-l-2 border-rose-400" : ""}`}
                    onClick={() => { onNavigate(n.href); onClose(); }}
                    data-testid={`notif-item-${n.id}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      <IC size={14} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-[12px] font-bold leading-snug ${!n.read ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-600 dark:text-zinc-400"}`}>{n.title}</p>
                        <span className="text-[9px] text-zinc-300 dark:text-zinc-600 font-medium flex-shrink-0 mt-0.5">{timeStr}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">{n.description}</p>
                      <p className="text-[10px] text-zinc-300 dark:text-zinc-600 mt-1 font-medium">{timeAgo(n.time)}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); onDismiss(n.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex-shrink-0 mt-0.5"
                      data-testid={`notif-dismiss-${n.id}`}
                    >
                      <X size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0 grid grid-cols-2 gap-2">
          <button onClick={() => { onNavigate("/admin/orders"); onClose(); }} className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center justify-center gap-1 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors border border-rose-100 dark:border-rose-900/30" data-testid="notif-see-orders">
            <ShoppingCart size={11} /> Commandes
          </button>
          <button onClick={() => { onNavigate("/admin/services"); onClose(); }} className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center justify-center gap-1 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors border border-orange-100 dark:border-orange-900/30" data-testid="notif-see-services">
            <Wrench size={11} /> Services
          </button>
        </div>
      </div>
    </div>
  );
}
