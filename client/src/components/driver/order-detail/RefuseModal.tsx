import { useState } from "react";
import { ThumbsDown, X, Loader2 } from "lucide-react";

interface RefuseModalProps {
  isPending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function RefuseModal({ isPending, onClose, onConfirm }: RefuseModalProps) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-t-3xl pb-10 bg-driver-surface border border-driver-border2"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-driver-s3" />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-driver-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-driver-red/12">
              <ThumbsDown size={18} className="text-driver-red" />
            </div>
            <h3 className="font-black text-base text-driver-text">Refuser la commande</h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-driver-s2 text-driver-subtle"
            data-testid="button-close-refuse-modal"
          >
            <X size={17} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-driver-muted">
            Indiquez obligatoirement la raison de votre refus. L'admin sera notifié et pourra réassigner la commande.
          </p>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide block mb-2 text-driver-subtle">Motif du refus *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Zone trop lointaine, véhicule en panne..."
              rows={3}
              data-testid="textarea-refusal-reason"
              className="w-full px-4 py-3 rounded-2xl text-sm text-driver-text resize-none focus:outline-none placeholder-driver-subtle bg-driver-s2 border border-driver-border"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-sm font-medium bg-driver-s2 text-driver-muted"
              data-testid="button-cancel-refuse"
            >
              Annuler
            </button>
            <button
              onClick={() => onConfirm(reason)}
              disabled={!reason.trim() || isPending}
              data-testid="button-confirm-refuse"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50 transition-all bg-driver-red shadow-[0_4px_16px_rgba(239,68,68,0.35)]"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <ThumbsDown size={14} />}
              Confirmer le refus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
