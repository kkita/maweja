import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, X, Image, Video, Loader2, Check } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import { apiRequest, queryClient } from "../../../lib/queryClient";
import type { RestaurantCategory, BoutiqueCategory } from "@shared/schema";
import MediaUploadButton from "./MediaUploadButton";

export default function AddRestaurantModal({
  onClose,
  storeType = "restaurant",
}: {
  onClose: () => void;
  storeType?: "restaurant" | "boutique";
}) {
  const { toast } = useToast();
  const isBoutique = storeType === "boutique";
  const { data: restCategories = [] } = useQuery<RestaurantCategory[]>({ queryKey: ["/api/restaurant-categories"], enabled: !isBoutique });
  const { data: boutCategories = [] } = useQuery<BoutiqueCategory[]>({ queryKey: ["/api/boutique-categories"], enabled: isBoutique });
  const categories = isBoutique ? boutCategories : restCategories;
  const [form, setForm] = useState({
    name: "", description: "", cuisine: "", address: "",
    deliveryFee: 2500, deliveryTime: "30-45 min", minOrder: 5000,
    rating: 4.5, phone: "", openingHours: "08:00 - 22:00",
    email: "", managerName: "", brandName: "", prepTime: "20-30 min",
    restaurantCommissionRate: 20, categoryId: 0,
  });
  const [coverImage, setCoverImage] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverVideoUrl, setCoverVideoUrl] = useState("");
  const showError = (msg: string) => toast({ title: "Erreur", description: msg, variant: "destructive" });

  const handleCategoryChange = (catId: number) => {
    const cat = categories.find(c => c.id === catId);
    setForm(f => ({ ...f, categoryId: catId, cuisine: cat?.name || "" }));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.cuisine || !form.address) throw new Error("Champs requis manquants");
      await apiRequest("/api/restaurants", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          type: storeType,
          image: coverImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
          logoUrl: logoUrl || null,
          coverVideoUrl: coverVideoUrl || null,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"], exact: false });
      toast({ title: storeType === "boutique" ? "Boutique ajoutée" : "Restaurant ajouté", description: `${form.name} a été créé avec succès` });
      onClose();
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message || (isBoutique ? "Impossible de créer la boutique" : "Impossible de créer le restaurant"), variant: "destructive" }),
  });

  const field = (key: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div>
      <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">{label}</label>
      <input type={type} value={String(form[key])} onChange={e => setForm(f => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-transparent" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2"><Plus size={18} className="text-red-600" /> {isBoutique ? "Ajouter une boutique" : "Ajouter un restaurant"}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{isBoutique ? "Remplissez les informations de la nouvelle boutique" : "Remplissez les informations du nouveau restaurant"}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center" data-testid="close-add-restaurant"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {field("name", isBoutique ? "Nom de la boutique *" : "Nom du restaurant *", "text", isBoutique ? "ex: Ma Boutique" : "ex: La Belle Cuisine")}
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">Catégorie *</label>
              <select
                value={form.categoryId}
                onChange={e => handleCategoryChange(Number(e.target.value))}
                data-testid="select-restaurant-category"
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-transparent"
              >
                <option value={0}>-- Choisir une catégorie --</option>
                {categories.filter(c => c.isActive).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          {field("description", "Description", "text", "Courte description du restaurant")}
          {field("address", "Adresse *", "text", "ex: Avenue du Commerce, Kinshasa")}
          <div className="grid grid-cols-2 gap-3">
            {field("deliveryFee", "Frais de livraison ($)", "number", "2")}
            {field("minOrder", "Commande minimum ($)", "number", "5")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("deliveryTime", "Temps de livraison", "text", "30-45 min")}
            {field("prepTime", "Temps de preparation", "text", "20-30 min")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("phone", "Telephone", "text", "+243 8XX XXX XXX")}
            {field("openingHours", "Horaires", "text", "08:00 - 22:00")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("email", "Email", "email", "contact@restaurant.com")}
            {field("managerName", "Nom du manager", "text", "Jean Dupont")}
          </div>

          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-3">
            <label className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2 block flex items-center gap-1">
              <span>💰</span> Commission MAWEJA (% déduit du chiffre d'affaires)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number" min="0" max="100"
                value={form.restaurantCommissionRate}
                onChange={e => setForm(f => ({ ...f, restaurantCommissionRate: Number(e.target.value) }))}
                data-testid="input-restaurant-commission"
                className="w-24 px-3 py-2.5 bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-700 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 text-center focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
              <span className="text-sm font-bold text-red-600 dark:text-red-400">%</span>
              <p className="text-[11px] text-red-600/70 dark:text-red-400/70 flex-1">
                Par ex: 20% → MAWEJA garde 20% du CA, {isBoutique ? "la boutique" : "le restaurant"} reçoit 80%
              </p>
            </div>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 space-y-4">
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Image size={12} /> {isBoutique ? "Médias de la boutique" : "Médias du restaurant"}
            </p>
            <MediaUploadButton
              label={isBoutique ? "Logo de la boutique" : "Logo du restaurant"}
              accept="image/jpeg,image/png,image/webp"
              current={logoUrl}
              onUploaded={setLogoUrl}
              onError={showError}
              icon={Image}
              testId="create-upload-logo"
              aspectRatio={1}
            />
            <MediaUploadButton
              label="Image de couverture"
              accept="image/jpeg,image/png,image/webp"
              current={coverImage}
              onUploaded={setCoverImage}
              onError={showError}
              icon={Image}
              testId="create-upload-cover"
              aspectRatio={16 / 9}
            />
            <MediaUploadButton
              label="Vidéo de couverture (max 10MB, sans audio)"
              accept="video/mp4,video/webm,video/quicktime"
              current={coverVideoUrl}
              onUploaded={setCoverVideoUrl}
              onError={showError}
              icon={Video}
              testId="create-upload-video"
            />
            {coverVideoUrl && (
              <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                La vidéo sera lue en mode muet sur la page {isBoutique ? "boutique" : "restaurant"} côté client.
              </p>
            )}
            {!coverImage && (
              <p className="text-[11px] text-zinc-400">Sans image de couverture, une image par défaut sera utilisée.</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors">Annuler</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.cuisine || !form.address}
            data-testid="confirm-add-restaurant"
            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {isBoutique ? "Ajouter la boutique" : "Ajouter le restaurant"}
          </button>
        </div>
      </div>
    </div>
  );
}
