import { useState } from "react";
import { Star, X } from "lucide-react";
import { REVIEW_TAGS } from "@shared/schema";

interface ReviewModalProps {
  isPending: boolean;
  hasRestaurant: boolean;
  hasDriver: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    restaurantRating: number | null;
    driverRating: number | null;
    comment: string;
    tags: string[];
  }) => void;
}

function StarRow({
  label,
  value,
  onChange,
  testIdPrefix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  testIdPrefix: string;
}) {
  return (
    <div className="mb-4">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</p>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            data-testid={`${testIdPrefix}-${s}`}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              size={32}
              className={s <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewModal({ isPending, hasRestaurant, hasDriver, onClose, onSubmit }: ReviewModalProps) {
  const [restoRating, setRestoRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const toggleTag = (t: string) =>
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const submitDisabled =
    isPending ||
    ((!hasRestaurant || restoRating === 0) && (!hasDriver || driverRating === 0));

  const handleSubmit = () => {
    onSubmit({
      restaurantRating: hasRestaurant && restoRating > 0 ? restoRating : null,
      driverRating: hasDriver && driverRating > 0 ? driverRating : null,
      comment: comment.trim(),
      tags,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" data-testid="modal-review">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg p-6 pb-8 animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-2 mb-6">
          <h3 className="font-bold text-lg dark:text-white">Évaluer la commande</h3>
          <button
            onClick={onClose}
            data-testid="button-close-review-modal"
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
          >
            <X size={16} className="dark:text-gray-300" />
          </button>
        </div>

        {hasRestaurant && (
          <StarRow
            label="Le restaurant"
            value={restoRating}
            onChange={setRestoRating}
            testIdPrefix="star-restaurant"
          />
        )}
        {hasDriver && (
          <StarRow
            label="Le livreur"
            value={driverRating}
            onChange={setDriverRating}
            testIdPrefix="star-driver"
          />
        )}

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags rapides</p>
          <div className="flex flex-wrap gap-2">
            {REVIEW_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                data-testid={`tag-${t.replace(/\s+/g, "-")}`}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  tags.includes(t)
                    ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-2 border-red-300 dark:border-red-700"
                    : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Un commentaire (facultatif)…"
          maxLength={2000}
          data-testid="input-review-comment"
          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl p-3 text-sm mb-4 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-red-300"
        />

        <button
          onClick={handleSubmit}
          disabled={submitDisabled}
          data-testid="button-submit-review"
          className="w-full py-3 rounded-2xl bg-red-600 text-white font-semibold text-sm disabled:opacity-50"
        >
          {isPending ? "Envoi…" : "Envoyer mon avis"}
        </button>
      </div>
    </div>
  );
}
