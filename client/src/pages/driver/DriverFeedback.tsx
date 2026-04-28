/**
 * PARTIE 6 — Feedback livreur (vue livreur connecté).
 *
 * Affiche la note moyenne, la répartition des étoiles, les tags les plus
 * fréquents et les derniers commentaires anonymisés (sans nom/email/téléphone
 * du client). Si la note moyenne est sous le seuil critique, on affiche un
 * encart pédagogique.
 */
import { useQuery } from "@tanstack/react-query";
import { Star, TrendingDown } from "lucide-react";
import DriverNav from "../../components/DriverNav";
import { formatDate } from "../../lib/utils";

interface FeedbackResp {
  summary: { average: number; count: number };
  tagCounts: Record<string, number>;
  ratingHistogram: Record<string, number>;
  recentComments: { id: number; rating: number | null; comment: string | null; createdAt: string }[];
  lowRatingFlag: boolean;
}

function StarsRow({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={20}
          className={i <= rounded ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}
        />
      ))}
      <span className="ml-2 font-semibold text-lg dark:text-white" data-testid="text-average-rating">
        {value.toFixed(2)}/5
      </span>
    </div>
  );
}

export default function DriverFeedback() {
  const { data, isLoading } = useQuery<FeedbackResp>({
    queryKey: ["/api/drivers/me/feedback"],
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DriverNav />
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const totalRatings = data.summary.count;
  const histogram = data.ratingHistogram;
  const sortedTags = Object.entries(data.tagCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24" data-testid="page-driver-feedback">
      <DriverNav />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Mes évaluations</h1>

        {/* Résumé global */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-4">
          {totalRatings === 0 ? (
            <p className="text-sm text-gray-500" data-testid="text-no-ratings">
              Vous n'avez pas encore reçu d'évaluation. Continuez le bon travail !
            </p>
          ) : (
            <>
              <StarsRow value={data.summary.average} />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2" data-testid="text-rating-count">
                Basé sur {totalRatings} évaluation{totalRatings > 1 ? "s" : ""}
              </p>
            </>
          )}
          {data.lowRatingFlag && (
            <div
              className="mt-4 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 flex items-start gap-2"
              data-testid="alert-low-rating"
            >
              <TrendingDown size={18} className="text-orange-600 mt-0.5" />
              <div className="text-xs text-orange-700 dark:text-orange-300">
                Votre note moyenne est en dessous de 3.5/5. Veillez à la ponctualité, la
                courtoisie et la qualité de la communication avec vos clients.
              </div>
            </div>
          )}
        </div>

        {/* Histogramme */}
        {totalRatings > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Répartition des notes
            </h2>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((s) => {
                const c = histogram[String(s)] ?? 0;
                const pct = totalRatings > 0 ? (c / totalRatings) * 100 : 0;
                return (
                  <div
                    key={s}
                    className="flex items-center gap-2 text-xs"
                    data-testid={`histogram-row-${s}`}
                  >
                    <span className="w-6 text-gray-600 dark:text-gray-400">{s}★</span>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-gray-500">{c}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags fréquents */}
        {sortedTags.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Mots-clés les plus fréquents
            </h2>
            <div className="flex flex-wrap gap-2">
              {sortedTags.map(([tag, count]) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300"
                  data-testid={`tag-count-${tag.replace(/\s+/g, "-")}`}
                >
                  {tag} · {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Commentaires anonymisés */}
        {data.recentComments.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Derniers commentaires (anonymisés)
            </h2>
            <ul className="space-y-3">
              {data.recentComments.map((c) => (
                <li
                  key={c.id}
                  className="border-b border-gray-100 dark:border-gray-800 pb-2 last:border-b-0"
                  data-testid={`comment-${c.id}`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={12}
                        className={
                          c.rating != null && i <= c.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-2">
                      {c.createdAt && formatDate(new Date(c.createdAt))}
                    </span>
                  </div>
                  {c.comment && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">{c.comment}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
