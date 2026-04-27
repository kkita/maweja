import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { formatPrice } from "../../../lib/utils";

interface Props {
  title: string;
  unit: string;
  currentValue: number;
  isMoney: boolean;
  onCancel: () => void;
  onConfirm: (delta: number, reason: string) => void;
  pending: boolean;
}

export default function CustomerWalletAdjustModal({
  title, unit, currentValue, isMoney, onCancel, onConfirm, pending,
}: Props) {
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const num = parseFloat(amount);
  const valid = isFinite(num) && num > 0 && reason.trim().length > 0;
  const newBalance = Math.max(0, currentValue + (mode === "add" ? num : -num));

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white">{title}</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Solde actuel : <span className="font-bold text-zinc-900 dark:text-white">{isMoney ? formatPrice(currentValue) : `${currentValue} ${unit}`}</span>
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("add")}
              data-testid="btn-mode-add"
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition ${mode === "add" ? "bg-green-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}
            >
              <Plus size={14} /> Créditer
            </button>
            <button
              onClick={() => setMode("remove")}
              data-testid="btn-mode-remove"
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition ${mode === "remove" ? "bg-red-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}
            >
              <Minus size={14} /> Débiter
            </button>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Montant ({unit})</label>
            <input
              type="number"
              step={isMoney ? "0.01" : "1"}
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              data-testid="input-adjust-amount"
              autoFocus
              className="w-full mt-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-lg font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder={isMoney ? "0.00" : "0"}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Motif (obligatoire)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              data-testid="input-adjust-reason"
              rows={2}
              maxLength={300}
              className="w-full mt-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              placeholder="Ex: Geste commercial après incident livraison"
            />
          </div>

          {valid && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
              <p className="text-xs text-zinc-500">Nouveau solde après ajustement :</p>
              <p className="text-lg font-black text-zinc-900 dark:text-white">
                {isMoney ? formatPrice(newBalance) : `${newBalance} ${unit}`}
              </p>
            </div>
          )}
        </div>
        <div className="p-5 pt-0 flex gap-2">
          <button onClick={onCancel} data-testid="btn-adjust-cancel" className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700">Annuler</button>
          <button
            onClick={() => onConfirm(mode === "add" ? num : -num, reason.trim())}
            disabled={!valid || pending}
            data-testid="btn-adjust-confirm"
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-sm font-semibold"
          >
            {pending ? "…" : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}
