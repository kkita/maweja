import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../../lib/queryClient";
import AdminLayout from "../../components/AdminLayout";
import { Plus, Pencil, Trash2, X, Check, Loader2, UtensilsCrossed, ShoppingBag, GripVertical, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import type { MenuItemCategory } from "@shared/schema";

export default function AdminMenuCategories() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"restaurant" | "boutique">("restaurant");
  const [addingFor, setAddingFor] = useState<"restaurant" | "boutique" | null>(null);
  const [editingCat, setEditingCat] = useState<MenuItemCategory | null>(null);
  const [deletingCat, setDeletingCat] = useState<MenuItemCategory | null>(null);
  const [newName, setNewName] = useState("");
  const [editName, setEditName] = useState("");

  const { data: restCats = [], isLoading: loadingRest } = useQuery<MenuItemCategory[]>({
    queryKey: ["/api/menu-item-categories", "restaurant"],
    queryFn: () => fetch("/api/menu-item-categories?storeType=restaurant").then(r => r.json()),
  });

  const { data: boutCats = [], isLoading: loadingBout } = useQuery<MenuItemCategory[]>({
    queryKey: ["/api/menu-item-categories", "boutique"],
    queryFn: () => fetch("/api/menu-item-categories?storeType=boutique").then(r => r.json()),
  });

  const cats = tab === "restaurant" ? restCats : boutCats;
  const isLoading = tab === "restaurant" ? loadingRest : loadingBout;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/menu-item-categories"] });
  };

  const addMutation = useMutation({
    mutationFn: () => apiRequest("/api/menu-item-categories", {
      method: "POST",
      body: JSON.stringify({ name: newName.trim(), storeType: addingFor, isActive: true, sortOrder: cats.length }),
    }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Catégorie ajoutée", description: newName.trim() });
      setNewName("");
      setAddingFor(null);
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: () => apiRequest(`/api/menu-item-categories/${editingCat!.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: editName.trim() }),
    }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Catégorie mise à jour" });
      setEditingCat(null);
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: (cat: MenuItemCategory) => apiRequest(`/api/menu-item-categories/${cat.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !cat.isActive }),
    }),
    onSuccess: () => invalidate(),
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/menu-item-categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Catégorie supprimée" });
      setDeletingCat(null);
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  return (
    <AdminLayout title="Catégories de plats & produits">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setTab("restaurant")}
            data-testid="tab-restaurant-cats"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === "restaurant" ? "bg-white dark:bg-gray-900 text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <UtensilsCrossed size={16} /> Catégories Restaurants
          </button>
          <button
            onClick={() => setTab("boutique")}
            data-testid="tab-boutique-cats"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === "boutique" ? "bg-white dark:bg-gray-900 text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <ShoppingBag size={16} /> Catégories Boutiques
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            {tab === "restaurant"
              ? "Ces catégories apparaissent dans le formulaire d'ajout de plat pour les restaurants (ex : Entrée, Plat, Dessert, Boisson…)."
              : "Ces catégories apparaissent dans le formulaire d'ajout de produit pour les boutiques (ex : Vêtements, Électronique, Beauté…)."}
          </p>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                {tab === "restaurant" ? "Catégories de plats" : "Catégories de produits"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{cats.length} catégorie{cats.length > 1 ? "s" : ""}</p>
            </div>
            <button
              onClick={() => { setAddingFor(tab); setNewName(""); }}
              data-testid="button-add-menu-category"
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-sm"
            >
              <Plus size={16} /> Ajouter
            </button>
          </div>

          {isLoading ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                </div>
              ))}
            </div>
          ) : cats.length === 0 ? (
            <div className="text-center py-12">
              <UtensilsCrossed size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm">Aucune catégorie</p>
              <button onClick={() => { setAddingFor(tab); setNewName(""); }} className="mt-2 text-red-600 font-semibold text-sm hover:underline">
                Ajouter la première catégorie
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {cats.map(cat => (
                <div key={cat.id} className="px-5 py-3.5 flex items-center gap-3" data-testid={`menu-cat-row-${cat.id}`}>
                  <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${cat.isActive ? "text-gray-900 dark:text-white" : "text-gray-400 line-through"}`}>
                      {cat.name}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {tab === "restaurant" ? "Restaurant" : "Boutique"} · Ordre #{cat.sortOrder}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleMutation.mutate(cat)}
                      data-testid={`toggle-menu-cat-${cat.id}`}
                      title={cat.isActive ? "Désactiver" : "Activer"}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${cat.isActive ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700" : "bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700"}`}
                    >
                      {cat.isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                      {cat.isActive ? "Actif" : "Inactif"}
                    </button>
                    <button
                      onClick={() => { setEditingCat(cat); setEditName(cat.name); }}
                      data-testid={`edit-menu-cat-${cat.id}`}
                      className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeletingCat(cat)}
                      data-testid={`delete-menu-cat-${cat.id}`}
                      className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {addingFor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setAddingFor(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {addingFor === "restaurant" ? "Nouvelle catégorie de plat" : "Nouvelle catégorie de produit"}
              </h3>
              <button onClick={() => setAddingFor(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Nom de la catégorie *</label>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && newName.trim() && addMutation.mutate()}
              placeholder={addingFor === "restaurant" ? "ex: Plats de résistance" : "ex: Accessoires"}
              data-testid="input-new-menu-category"
              autoFocus
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setAddingFor(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Annuler</button>
              <button
                onClick={() => addMutation.mutate()}
                disabled={addMutation.isPending || !newName.trim()}
                data-testid="confirm-add-menu-category"
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setEditingCat(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">Modifier la catégorie</h3>
              <button onClick={() => setEditingCat(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Nom de la catégorie *</label>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && editName.trim() && editMutation.mutate()}
              data-testid="input-edit-menu-category"
              autoFocus
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setEditingCat(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Annuler</button>
              <button
                onClick={() => editMutation.mutate()}
                disabled={editMutation.isPending || !editName.trim()}
                data-testid="confirm-edit-menu-category"
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {editMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deletingCat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setDeletingCat(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-xs p-6 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Supprimer "{deletingCat.name}" ?</h3>
            <p className="text-xs text-gray-500 mb-4">Les plats/produits ayant cette catégorie ne seront pas supprimés, mais leur catégorie restera en place jusqu'à modification manuelle.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeletingCat(null)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Annuler</button>
              <button
                onClick={() => deleteMutation.mutate(deletingCat.id)}
                disabled={deleteMutation.isPending}
                data-testid="confirm-delete-menu-category"
                className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {deleteMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
