import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X, Star, Tag, Loader2, Check } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import { apiRequest, queryClient } from "../../../lib/queryClient";
import type { Restaurant, RestaurantCategory, BoutiqueCategory } from "@shared/schema";

type RestaurantExtras = {
  categoryId?: number | null;
  discountPercent?: number | null;
  discountLabel?: string | null;
  isFeatured?: boolean | null;
};

export default function EditRestaurantModal({
  restaurant,
  onClose,
  storeType = "restaurant",
}: {
  restaurant: Restaurant;
  onClose: () => void;
  storeType?: "restaurant" | "boutique";
}) {
  const { toast } = useToast();
  const isBoutique = storeType === "boutique";
  const { data: restCategories = [] } = useQuery<RestaurantCategory[]>({ queryKey: ["/api/restaurant-categories"], enabled: !isBoutique });
  const { data: boutCategories = [] } = useQuery<BoutiqueCategory[]>({ queryKey: ["/api/boutique-categories"], enabled: isBoutique });
  const categories = isBoutique ? boutCategories : restCategories;
  const [email, setEmail] = useState(restaurant.email || "");
  const [managerName, setManagerName] = useState(restaurant.managerName || "");
  const [brandName, setBrandName] = useState(restaurant.brandName || "");
  const [hqAddress, setHqAddress] = useState(restaurant.hqAddress || "");
  const [prepTime, setPrepTime] = useState(restaurant.prepTime || "20-30 min");
  const [name, setName] = useState(restaurant.name);
  const [cuisine, setCuisine] = useState(restaurant.cuisine);
  const rx = restaurant as Restaurant & RestaurantExtras;
  const [categoryId, setCategoryId] = useState<number>(rx.categoryId ?? 0);
  const [address, setAddress] = useState(restaurant.address);
  const [deliveryFee, setDeliveryFee] = useState(restaurant.deliveryFee);
  const [deliveryTime, setDeliveryTime] = useState(restaurant.deliveryTime);
  const [phone, setPhone] = useState(restaurant.phone || "");
  const [commissionRate, setCommissionRate] = useState<number>(restaurant.restaurantCommissionRate ?? 20);
  const [discountPercent, setDiscountPercent] = useState<number>(rx.discountPercent ?? 0);
  const [discountLabel, setDiscountLabel] = useState<string>(rx.discountLabel ?? "");
  const [isFeatured, setIsFeatured] = useState<boolean>(rx.isFeatured ?? false);

  const handleEditCategoryChange = (catId: number) => {
    const cat = categories.find(c => c.id === catId);
    setCategoryId(catId);
    setCuisine(cat?.name || cuisine);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/restaurants/${restaurant.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, cuisine, categoryId: categoryId || null, address, deliveryFee, deliveryTime, phone, email: email || null, managerName: managerName || null, brandName: brandName || null, hqAddress: hqAddress || null, prepTime, restaurantCommissionRate: commissionRate, discountPercent, discountLabel: discountLabel || null, isFeatured }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"], exact: false });
      toast({ title: "Mis a jour", description: `${name} a ete modifie` });
      onClose();
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" }),
  });

  const inp = (val: string, set: (v: string) => void, label: string, type = "text", ph = "") => (
    <div>
      <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">{label}</label>
      <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
        className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-transparent" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white">Modifier - {restaurant.name}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Informations du restaurant</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center" data-testid="close-edit-modal"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {inp(name, setName, "Nom *", "text", "Nom du restaurant")}
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Catégorie *</label>
              <select
                value={categoryId}
                onChange={e => handleEditCategoryChange(Number(e.target.value))}
                data-testid="select-edit-restaurant-category"
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-transparent"
              >
                <option value={0}>-- Choisir une catégorie --</option>
                {categories.filter(c => c.isActive).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          {inp(address, setAddress, "Adresse *", "text", "Avenue...")}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Frais de livraison ($)</label>
              <input type="number" value={deliveryFee} onChange={e => setDeliveryFee(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30" />
            </div>
            {inp(deliveryTime, setDeliveryTime, "Temps de livraison", "text", "30-45 min")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {inp(phone, setPhone, "Telephone", "text", "+243...")}
            {inp(prepTime, setPrepTime, "Temps de prep", "text", "20-30 min")}
          </div>
          {inp(email, setEmail, "Email", "email", "contact@restaurant.com")}
          {inp(managerName, setManagerName, "Nom du manager", "text", "Jean Dupont")}
          {inp(brandName, setBrandName, "Marque", "text", "Nom de la marque")}
          {inp(hqAddress, setHqAddress, "Adresse du siege", "text", "Adresse complete")}

          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-3">
            <label className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2 block">Commission MAWEJA (%)</label>
            <div className="flex items-center gap-3">
              <input type="number" min="0" max="100" value={commissionRate}
                onChange={e => setCommissionRate(Number(e.target.value))}
                data-testid="input-edit-restaurant-commission"
                className="w-24 px-3 py-2.5 bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-700 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 text-center focus:outline-none focus:ring-2 focus:ring-rose-500/30" />
              <span className="text-sm font-bold text-red-600 dark:text-red-400">%</span>
              <p className="text-[11px] text-red-600/70 dark:text-red-400/70 flex-1">Part MAWEJA sur le CA livré</p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl p-3 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Tag size={14} className="text-green-600" />
              <label className="text-xs font-semibold text-green-700 dark:text-green-400">Remise / Discount affiché sur la carte</label>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-green-200 dark:border-green-700 rounded-xl px-3 py-2">
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={discountPercent}
                  onChange={e => setDiscountPercent(Math.min(90, Math.max(0, Number(e.target.value))))}
                  data-testid="input-edit-restaurant-discount"
                  className="w-16 text-sm font-bold text-green-600 dark:text-green-400 text-center focus:outline-none bg-transparent"
                />
                <span className="text-sm font-bold text-green-600 dark:text-green-400">%</span>
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-green-700 dark:text-green-400">
                  {discountPercent > 0
                    ? `Badge "${discountPercent}% OFF" affiché sur la carte du restaurant`
                    : "Mettre 0 pour désactiver la remise"}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1 block">
                Libellé personnalisé <span className="font-normal text-green-600/60">(optionnel)</span>
              </label>
              <input
                type="text"
                value={discountLabel}
                onChange={e => setDiscountLabel(e.target.value)}
                placeholder={discountPercent > 0 ? `ex: ${discountPercent}% sur les menus` : "ex: Promo weekend"}
                data-testid="input-edit-restaurant-discount-label"
                maxLength={40}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-green-200 dark:border-green-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <p className="text-[10px] text-green-600/60 mt-1">Texte affiché sur la bannière de remise. Laissez vide pour afficher "{discountPercent > 0 ? discountPercent + "% OFF" : "X% OFF"}".</p>
            </div>
            {discountPercent > 0 && (
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-xl px-3 py-2 border border-green-100">
                <span className="text-[10px] font-semibold text-green-700 dark:text-green-400">Aperçu badge :</span>
                <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  -{discountPercent}% {discountLabel ? `· ${discountLabel}` : "OFF"}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/40 mt-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-amber-500" />
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Store Partenaire</p>
                <p className="text-[10px] text-amber-600/70">Epingler ce restaurant en haut de la liste client</p>
              </div>
            </div>
            <div
              className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${isFeatured ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
              onClick={() => setIsFeatured(!isFeatured)}
              data-testid="toggle-featured"
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isFeatured ? "translate-x-5" : "translate-x-0"}`} />
            </div>
          </div>
        </div>

        <button onClick={() => mutation.mutate()} disabled={mutation.isPending} data-testid="save-restaurant-info"
          className="w-full mt-5 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Sauvegarder
        </button>
      </div>
    </div>
  );
}
