/**
 * PARTIE 6 — Avis et notes (vue admin).
 *
 * Liste paginée des avis client + signalement des restaurants/livreurs
 * dont la moyenne est sous le seuil critique (3.5/5 par défaut).
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, AlertTriangle, Filter } from "lucide-react";
import { formatDate } from "../../lib/utils";
import type { Review } from "@shared/schema";
import AdminLayout from "../../components/AdminLayout";

interface LowRatedResp {
  threshold: number;
  minCount: number;
  restaurants: { id: number; name: string; average: number; count: number }[];
  drivers: { id: number; name: string; average: number; count: number }[];
}

function Stars({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        />
      ))}
      <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">{value}/5</span>
    </span>
  );
}

export default function AdminReviews() {
  const [maxRating, setMaxRating] = useState<string>("");

  const reviewsQuery = useQuery<Review[]>({
    queryKey: ["/api/reviews", { maxRating }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (maxRating) params.set("maxRating", maxRating);
      const res = await fetch(`/api/reviews?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Échec chargement avis");
      return res.json();
    },
  });

  const lowRatedQuery = useQuery<LowRatedResp>({
    queryKey: ["/api/reviews/low-rated"],
  });

  return (
    <AdminLayout title="Avis & notes">
      <div className="max-w-6xl mx-auto" data-testid="page-admin-reviews">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Star className="text-yellow-400" /> Avis & notes
        </h1>

        {/* Bloc signalement faibles notes */}
        <section className="mb-8" data-testid="section-low-rated">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={18} /> Notes faibles signalées
          </h2>
          {lowRatedQuery.isLoading ? (
            <div className="text-sm text-gray-500">Chargement…</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Restaurants</h3>
                {(lowRatedQuery.data?.restaurants ?? []).length === 0 ? (
                  <p className="text-xs text-gray-400">Aucun signalement.</p>
                ) : (
                  <ul className="space-y-2">
                    {lowRatedQuery.data!.restaurants.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between text-sm"
                        data-testid={`row-low-restaurant-${r.id}`}
                      >
                        <span className="font-medium dark:text-white">{r.name}</span>
                        <span className="text-orange-600">
                          {r.average.toFixed(2)}/5 ({r.count} avis)
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Livreurs</h3>
                {(lowRatedQuery.data?.drivers ?? []).length === 0 ? (
                  <p className="text-xs text-gray-400">Aucun signalement.</p>
                ) : (
                  <ul className="space-y-2">
                    {lowRatedQuery.data!.drivers.map((d) => (
                      <li
                        key={d.id}
                        className="flex items-center justify-between text-sm"
                        data-testid={`row-low-driver-${d.id}`}
                      >
                        <span className="font-medium dark:text-white">{d.name}</span>
                        <span className="text-orange-600">
                          {d.average.toFixed(2)}/5 ({d.count} avis)
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Bloc liste avis */}
        <section data-testid="section-reviews-list">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Tous les avis</h2>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-500" />
              <select
                value={maxRating}
                onChange={(e) => setMaxRating(e.target.value)}
                data-testid="select-max-rating"
                className="text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1"
              >
                <option value="">Toutes les notes</option>
                <option value="2">≤ 2 (critiques)</option>
                <option value="3">≤ 3 (moyennes)</option>
                <option value="4">≤ 4</option>
              </select>
            </div>
          </div>

          {reviewsQuery.isLoading ? (
            <div className="text-sm text-gray-500">Chargement…</div>
          ) : (reviewsQuery.data ?? []).length === 0 ? (
            <div className="text-sm text-gray-400 bg-white dark:bg-gray-900 rounded-2xl p-6 text-center border border-gray-200 dark:border-gray-700">
              Aucun avis pour ce filtre.
            </div>
          ) : (
            <ul className="space-y-3">
              {reviewsQuery.data!.map((r) => (
                <li
                  key={r.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700"
                  data-testid={`row-review-${r.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-500">
                      Commande #{r.orderId} — {r.createdAt && formatDate(new Date(r.createdAt))}
                    </div>
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-xs text-gray-500 mr-1">Restaurant:</span>
                        <Stars value={r.restaurantRating ?? null} />
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 mr-1">Livreur:</span>
                        <Stars value={r.driverRating ?? null} />
                      </div>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-gray-700 dark:text-gray-300" data-testid={`text-comment-${r.id}`}>
                      {r.comment}
                    </p>
                  )}
                  {r.tags && r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs rounded-full text-gray-700 dark:text-gray-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
