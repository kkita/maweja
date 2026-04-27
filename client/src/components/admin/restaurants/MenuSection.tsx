import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, X, Check, Image, GalleryHorizontal, Package, UtensilsCrossed } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import { authFetch, apiRequest, queryClient } from "../../../lib/queryClient";
import { formatPrice } from "../../../lib/utils";
import GalleryPicker from "../../GalleryPicker";
import type { Restaurant, MenuItem, MenuItemCategory } from "@shared/schema";

function MenuItemForm({
  restaurantId, item, onClose, storeType = "restaurant",
}: { restaurantId: number; item?: MenuItem; onClose: () => void; storeType?: "restaurant" | "boutique" }) {
  const isBoutique = storeType === "boutique";
  const { toast } = useToast();
  const isEdit = !!item;
  const { data: menuCats = [] } = useQuery<MenuItemCategory[]>({
    queryKey: ["/api/menu-item-categories", storeType],
    queryFn: () => fetch(`/api/menu-item-categories?storeType=${storeType}`).then(r => r.json()),
  });
  const defaultCategory = menuCats.find(c => c.isActive)?.name || (isBoutique ? "Produit phare" : "Principal");
  const [form, setForm] = useState({
    name: item?.name || "",
    description: item?.description || "",
    price: item?.price || 0,
    category: item?.category || "",
    image: item?.image || "",
    isAvailable: item?.isAvailable ?? true,
    popular: item?.popular ?? false,
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [menuGalleryOpen, setMenuGalleryOpen] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);

  const handleImageFile = async (file: File) => {
    setImageUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await authFetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setForm(f => ({ ...f, image: data.url }));
    } catch { toast({ title: "Erreur upload", variant: "destructive" }); }
    setImageUploading(false);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.name || form.price <= 0) throw new Error("Nom et prix requis");
      if (isEdit) {
        await apiRequest(`/api/menu-items/${item!.id}`, { method: "PATCH", body: JSON.stringify(form) });
      } else {
        await apiRequest("/api/menu-items", { method: "POST", body: JSON.stringify({ ...form, restaurantId, image: form.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400" }) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId, "menu"] });
      toast({ title: isEdit ? "Plat modifie" : "Plat ajoute", description: form.name });
      onClose();
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-zinc-900 dark:text-white">{isEdit ? (isBoutique ? "Modifier le produit" : "Modifier le plat") : (isBoutique ? "Ajouter un produit" : "Ajouter un plat")}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">{isBoutique ? "Nom du produit *" : "Nom du plat *"}</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={isBoutique ? "ex: T-shirt wax" : "ex: Poulet braisé"} data-testid="input-menu-item-name"
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Courte description"
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Prix ($) *</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} data-testid="input-menu-item-price"
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Categorie</label>
              <select value={form.category || defaultCategory} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30">
                {menuCats.filter(c => c.isActive).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                {menuCats.length === 0 && <option value={defaultCategory}>{defaultCategory}</option>}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Image du plat</label>
            <div className="flex items-center gap-2 flex-wrap">
              {form.image && <img src={form.image} alt="" className="w-12 h-12 rounded-lg object-cover border" />}
              <button type="button" onClick={() => imageRef.current?.click()} disabled={imageUploading}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-dashed border-gray-300 rounded-xl text-xs font-medium text-zinc-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors">
                {imageUploading ? <Loader2 size={12} className="animate-spin" /> : <Image size={12} />}
                {form.image ? "Changer" : "Choisir"}
              </button>
              <button type="button" onClick={() => setMenuGalleryOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
                data-testid="button-menu-image-gallery">
                <GalleryHorizontal size={12} /> Galerie
              </button>
            </div>
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])} />
            <GalleryPicker
              open={menuGalleryOpen}
              onClose={() => setMenuGalleryOpen(false)}
              onSelect={url => setForm(f => ({ ...f, image: url }))}
              filter="image"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input type="checkbox" checked={form.isAvailable} onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))} className="w-4 h-4 rounded accent-red-600" />
              Disponible
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input type="checkbox" checked={form.popular} onChange={e => setForm(f => ({ ...f, popular: e.target.checked }))} className="w-4 h-4 rounded accent-red-600" />
              Populaire ⭐
            </label>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-600 hover:bg-zinc-50">Annuler</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || form.price <= 0} data-testid="save-menu-item"
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {isEdit ? "Modifier" : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MenuSection({ restaurant, storeType = "restaurant" }: { restaurant: Restaurant; storeType?: "restaurant" | "boutique" }) {
  const isBoutique = storeType === "boutique";
  const { toast } = useToast();
  const [addingItem, setAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);

  const { data: items = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/restaurants", restaurant.id, "menu"],
    queryFn: () => fetch(`/api/restaurants/${restaurant.id}/menu?adminView=true`).then(r => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/menu-items/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurant.id, "menu"] });
      toast({ title: "Plat supprime" });
      setDeletingItem(null);
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  if (isLoading) return <div className="py-4 text-center"><Loader2 size={16} className="animate-spin mx-auto text-zinc-400" /></div>;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5"><UtensilsCrossed size={13} /> {isBoutique ? `Catalogue (${items.length} produits)` : `Menu (${items.length} plats)`}</p>
        <button onClick={() => setAddingItem(true)} data-testid={`add-menu-item-${restaurant.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors">
          <Plus size={12} /> {isBoutique ? "Ajouter un produit" : "Ajouter un plat"}
        </button>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-zinc-200 rounded-xl">
          <Package size={24} className="mx-auto mb-2 text-zinc-300" />
          <p className="text-xs text-zinc-400">{isBoutique ? "Aucun produit dans le catalogue" : "Aucun plat dans le menu"}</p>
          <button onClick={() => setAddingItem(true)} className="text-xs text-red-600 font-semibold mt-1 hover:underline">{isBoutique ? "Ajouter le premier produit" : "Ajouter le premier plat"}</button>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800" data-testid={`menu-item-${item.id}`}>
              <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{item.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 font-bold">{formatPrice(item.price)}</span>
                  <span className="text-[10px] text-zinc-400">{item.category}</span>
                  {item.popular && <span className="text-[10px] bg-yellow-50 text-yellow-700 px-1 rounded font-medium">⭐ Populaire</span>}
                  {!item.isAvailable && <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1 rounded font-medium">Indispo</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditingItem(item)} data-testid={`edit-menu-item-${item.id}`}
                  className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors">
                  <Pencil size={11} />
                </button>
                <button onClick={() => setDeletingItem(item)} data-testid={`delete-menu-item-${item.id}`}
                  className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {addingItem && <MenuItemForm restaurantId={restaurant.id} onClose={() => setAddingItem(false)} storeType={storeType} />}
      {editingItem && <MenuItemForm restaurantId={restaurant.id} item={editingItem} onClose={() => setEditingItem(null)} storeType={storeType} />}
      {deletingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setDeletingItem(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-xs p-6 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><Trash2 size={20} className="text-red-600" /></div>
            <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Supprimer "{deletingItem.name}" ?</h3>
            <p className="text-xs text-zinc-500 mb-4">Cette action est irreversible.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeletingItem(null)} className="flex-1 py-2 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-600 hover:bg-zinc-50">Annuler</button>
              <button onClick={() => deleteMutation.mutate(deletingItem.id)} disabled={deleteMutation.isPending}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1">
                {deleteMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
