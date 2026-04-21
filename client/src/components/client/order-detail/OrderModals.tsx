import { useState } from "react";
import { Star, X, AlertTriangle } from "lucide-react";

const CANCEL_REASONS = ["Delai trop long", "Changement d'avis", "Erreur de commande", "Autre"];

interface CancelModalProps {
  isPending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function CancelModal({ isPending, onClose, onConfirm }: CancelModalProps) {
  const [reason, setReason]       = useState("");
  const [customReason, setCustom] = useState("");

  const handleConfirm = () => {
    const final = reason === "Autre" ? customReason : reason;
    if (!final.trim()) return;
    onConfirm(final);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" data-testid="modal-cancel">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg p-6 pb-8 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between gap-2 mb-6">
          <h3 className="font-bold text-lg dark:text-white">Annuler la commande</h3>
          <button
            onClick={onClose}
            data-testid="button-close-cancel-modal"
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
          >
            <X size={16} className="dark:text-gray-300" />
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Pourquoi souhaitez-vous annuler ?</p>
        <div className="space-y-2 mb-4">
          {CANCEL_REASONS.map(r => (
            <button
              key={r}
              onClick={() => setReason(r)}
              data-testid={`cancel-reason-${r}`}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                reason === r
                  ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-2 border-red-300 dark:border-red-700"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        {reason === "Autre" && (
          <textarea
            value={customReason}
            onChange={e => setCustom(e.target.value)}
            placeholder="Decrivez votre raison..."
            data-testid="input-custom-reason"
            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl p-3 text-sm mb-4 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        )}
        <button
          onClick={handleConfirm}
          disabled={isPending || !reason}
          data-testid="button-confirm-cancel"
          className="w-full py-3 rounded-2xl bg-red-600 text-white font-semibold text-sm disabled:opacity-50"
        >
          {isPending ? "Annulation..." : "Confirmer l'annulation"}
        </button>
      </div>
    </div>
  );
}

interface RateModalProps {
  isPending: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => void;
}

export function RateModal({ isPending, onClose, onSubmit }: RateModalProps) {
  const [rating,   setRating]   = useState(0);
  const [feedback, setFeedback] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" data-testid="modal-rate">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg p-6 pb-8 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between gap-2 mb-6">
          <h3 className="font-bold text-lg dark:text-white">Evaluer la commande</h3>
          <button
            onClick={onClose}
            data-testid="button-close-rate-modal"
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
          >
            <X size={16} className="dark:text-gray-300" />
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">Comment etait votre commande ?</p>
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => setRating(s)} data-testid={`star-${s}`} className="p-1 transition-transform">
              <Star size={36} className={s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600"} />
            </button>
          ))}
        </div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="Un commentaire ? (optionnel)"
          data-testid="input-feedback"
          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl p-3 text-sm mb-4 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-300"
        />
        <button
          onClick={() => onSubmit(rating, feedback)}
          disabled={isPending || rating === 0}
          data-testid="button-submit-rating"
          className="w-full py-3 rounded-2xl bg-red-600 text-white font-semibold text-sm disabled:opacity-50"
        >
          {isPending ? "Envoi..." : "Envoyer mon avis"}
        </button>
      </div>
    </div>
  );
}
