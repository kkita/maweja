import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import { apiRequest, queryClient } from "../../../lib/queryClient";
import type { Restaurant } from "@shared/schema";

export default function DeleteRestaurantModal({
  restaurant,
  onClose,
  storeType = "restaurant",
}: {
  restaurant: Restaurant;
  onClose: () => void;
  storeType?: "restaurant" | "boutique";
}) {
  const isBoutique = storeType === "boutique";
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: () => apiRequest(`/api/restaurants/${restaurant.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"], exact: false });
      toast({ title: isBoutique ? "Boutique supprimée" : "Restaurant supprimé", description: `${restaurant.name} a été supprimé` });
      onClose();
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" }),
  });
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={24} className="text-red-600" />
        </div>
        <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-2">{isBoutique ? "Supprimer cette boutique ?" : "Supprimer ce restaurant ?"}</h3>
        <p className="text-sm text-zinc-500 mb-1"><span className="font-semibold text-zinc-900 dark:text-white">{restaurant.name}</span> sera définitivement supprimé(e).</p>
        <p className="text-xs text-zinc-400 mb-6">{isBoutique ? "Tous les produits du catalogue seront également supprimés." : "Tous les plats du menu seront également supprimés."} Cette action est irréversible.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-600 hover:bg-zinc-50" data-testid="cancel-delete-restaurant">Annuler</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
            data-testid="confirm-delete-restaurant"
            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
