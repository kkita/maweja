import { useState } from "react";
import { ShieldAlert, Lock, Unlock, Eye, EyeOff, X } from "lucide-react";
import { apiRequest, queryClient } from "../../../lib/queryClient";
import { useToast } from "../../../hooks/use-toast";
import { statusLabels } from "../../../lib/utils";
import type { Order } from "@shared/schema";

interface Props {
  orderId: number | null;
  orders: Order[];
  onClose: () => void;
}

export default function OverrideModal({ orderId, orders, onClose }: Props) {
  const { toast } = useToast();
  const [overrideCode, setOverrideCode] = useState("");
  const [overrideNewStatus, setOverrideNewStatus] = useState("pending");
  const [overrideError, setOverrideError] = useState("");
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideCodeVisible, setOverrideCodeVisible] = useState(false);

  if (orderId === null) return null;

  const currentOrder = orders.find(o => o.id === orderId);

  const handleClose = () => {
    setOverrideCode("");
    setOverrideNewStatus("pending");
    setOverrideError("");
    setOverrideCodeVisible(false);
    onClose();
  };

  const submitOverride = async () => {
    if (!overrideCode.trim()) { setOverrideError("Veuillez saisir le code d'accès"); return; }
    setOverrideLoading(true);
    setOverrideError("");
    try {
      await apiRequest(`/api/orders/${orderId}/status-override`, {
        method: "POST",
        body: JSON.stringify({ code: overrideCode, newStatus: overrideNewStatus }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      handleClose();
      toast({ title: "✅ Statut modifié", description: `Statut changé en "${(statusLabels as any)[overrideNewStatus] || overrideNewStatus}" (override enregistré)` });
    } catch (err: any) {
      setOverrideError(err?.message || "Code incorrect ou erreur serveur");
    } finally {
      setOverrideLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#1a1a22] rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              <ShieldAlert size={20} className="text-white" />
            </div>
            <div>
              <p className="font-black text-white text-base">Modification sécurisée</p>
              <p className="text-red-100 text-[11px]">Action réservée — historique enregistré</p>
            </div>
            <button onClick={handleClose} className="ml-auto p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <X size={16} className="text-white" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl px-4 py-3 flex items-start gap-2.5">
            <ShieldAlert size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
              Vous êtes sur le point de modifier un statut final. Cette opération sera tracée dans l'historique de la commande avec votre identité.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1.5 block">Nouveau statut</label>
            <select
              value={overrideNewStatus}
              onChange={e => setOverrideNewStatus(e.target.value)}
              data-testid="select-override-new-status"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white font-medium"
            >
              {Object.entries(statusLabels).filter(([k]) => k !== currentOrder?.status).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1.5 block">Code d'accès confidentiel</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type={overrideCodeVisible ? "text" : "password"}
                value={overrideCode}
                onChange={e => { setOverrideCode(e.target.value); setOverrideError(""); }}
                placeholder="Entrez le code d'accès…"
                data-testid="input-override-code-entry"
                onKeyDown={e => e.key === "Enter" && submitOverride()}
                autoFocus
                className="w-full pl-10 pr-10 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setOverrideCodeVisible(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {overrideCodeVisible ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {overrideError && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                <X size={10} /> {overrideError}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleClose}
              className="flex-1 py-3 rounded-xl font-semibold text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={submitOverride}
              disabled={overrideLoading || !overrideCode.trim()}
              data-testid="button-confirm-override"
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {overrideLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Unlock size={14} />
              )}
              {overrideLoading ? "Vérification…" : "Confirmer l'override"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
