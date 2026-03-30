import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { Store, Star, Clock, MapPin, Upload, Image, Video, X, Loader2, Pencil, ChefHat, Mail, User, Building, MapPinned, Plus, Trash2, Check, UtensilsCrossed, DollarSign, AlertTriangle, ChevronDown, ChevronUp, Package, Tag, GalleryHorizontal, GripVertical, ArrowUp, ArrowDown, Save } from "lucide-react";
import GalleryPicker from "../../components/GalleryPicker";
import ImportUrlToGallery from "../../components/ImportUrlToGallery";
import { formatPrice } from "../../lib/utils";
import { authFetch, apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useState, useRef, useCallback } from "react";
import type { Restaurant, MenuItem, RestaurantCategory } from "@shared/schema";
import ImageCropper, { validateImageFile } from "../../components/ImageCropper";

/* ── Allowed image types & restrictions ─────────────────────────── */
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_MB = 5;
const MAX_VIDEO_SIZE_MB = 10;

function MediaUploadButton({
  label, accept, onUploaded, current, icon: Icon, testId, onError,
  aspectRatio = 1,
}: {
  label: string; accept: string; onUploaded: (url: string) => void; current?: string | null;
  icon: any; testId: string; onError?: (msg: string) => void; aspectRatio?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isVideo = accept.includes("video");

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const endpoint = isVideo ? "/api/upload-media" : "/api/upload";
      const res = await authFetch(endpoint, { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) onUploaded(data.url);
      else onError?.("Erreur lors de l'upload");
    } catch { onError?.("Erreur lors de l'upload"); }
    setUploading(false);
  };

  const handleRawFile = (file: File) => {
    if (isVideo) {
      if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        onError?.(`Vidéo trop volumineuse (max ${MAX_VIDEO_SIZE_MB}MB)`);
        return;
      }
      uploadFile(file);
      return;
    }
    /* Image validation */
    const validationError = validateImageFile(file);
    if (validationError) { onError?.(validationError); return; }
    /* Show cropper */
    setCropFile(file);
  };

  const handleCropped = (croppedFile: File) => {
    setCropFile(null);
    uploadFile(croppedFile);
  };

  return (
    <>
      {cropFile && (
        <ImageCropper
          file={cropFile}
          aspectRatio={aspectRatio}
          onCrop={handleCropped}
          onCancel={() => setCropFile(null)}
        />
      )}
      <div>
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{label}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {current && !isVideo && (
            <img
              src={current}
              alt=""
              className="w-12 h-12 rounded-xl object-cover border border-gray-200"
              onError={(e) => { (e.target as HTMLImageElement).src = "/maweja-logo-red.png"; }}
            />
          )}
          {current && isVideo && <video src={current} className="w-16 h-12 rounded-xl object-cover border border-gray-200" muted />}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            data-testid={testId}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
            {uploading ? "Upload..." : current ? "Changer" : "Choisir"}
          </button>
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            data-testid={`${testId}-gallery`}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
          >
            <GalleryHorizontal size={14} /> Galerie
          </button>
          {current && (
            <ImportUrlToGallery url={current} onImported={onUploaded} />
          )}
          {current && (
            <button
              type="button"
              onClick={() => onUploaded("")}
              className="text-gray-400 hover:text-red-500"
              data-testid={`${testId}-remove`}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={isVideo ? accept : ALLOWED_IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleRawFile(e.target.files[0])}
        />
      </div>
      <GalleryPicker
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onSelect={url => { onUploaded(url); }}
        filter={isVideo ? "video" : "image"}
      />
    </>
  );
}

function AddRestaurantModal({ onClose, storeType = "restaurant" }: { onClose: () => void; storeType?: "restaurant" | "boutique" }) {
  const { toast } = useToast();
  const { data: restCategories = [] } = useQuery<RestaurantCategory[]>({ queryKey: ["/api/restaurant-categories"] });
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
    const cat = restCategories.find(c => c.id === catId);
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
    onError: (e: any) => toast({ title: "Erreur", description: e.message || "Impossible de creer le restaurant", variant: "destructive" }),
  });

  const field = (key: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div>
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">{label}</label>
      <input type={type} value={String(form[key])} onChange={e => setForm(f => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2"><Plus size={18} className="text-red-600" /> Ajouter un restaurant</h3>
            <p className="text-xs text-gray-500 mt-0.5">Remplissez les informations du nouveau restaurant</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center" data-testid="close-add-restaurant"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {field("name", "Nom du restaurant *", "text", "ex: La Belle Cuisine")}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Catégorie *</label>
              <select
                value={form.categoryId}
                onChange={e => handleCategoryChange(Number(e.target.value))}
                data-testid="select-restaurant-category"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value={0}>-- Choisir une catégorie --</option>
                {restCategories.filter(c => c.isActive).map(cat => (
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
                className="w-24 px-3 py-2.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 text-center focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <span className="text-sm font-bold text-red-600 dark:text-red-400">%</span>
              <p className="text-[11px] text-red-600/70 dark:text-red-400/70 flex-1">
                Par ex: 20% → MAWEJA garde 20% du CA, le restaurant reçoit 80%
              </p>
            </div>
          </div>

          {/* ── Médias du restaurant ─────────────────────── */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Image size={12} /> Médias du restaurant
            </p>
            <MediaUploadButton
              label="Logo du restaurant"
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
                La vidéo sera lue en mode muet sur la page restaurant côté client.
              </p>
            )}
            {!coverImage && (
              <p className="text-[11px] text-gray-400">Sans image de couverture, une image par défaut sera utilisée.</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.cuisine || !form.address}
            data-testid="confirm-add-restaurant"
            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Ajouter le restaurant
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteRestaurantModal({ restaurant, onClose }: { restaurant: Restaurant; onClose: () => void }) {
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: () => apiRequest(`/api/restaurants/${restaurant.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"], exact: false });
      toast({ title: "Restaurant supprime", description: `${restaurant.name} a ete supprime` });
      onClose();
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" }),
  });
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={24} className="text-red-600" />
        </div>
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Supprimer ce restaurant ?</h3>
        <p className="text-sm text-gray-500 mb-1"><span className="font-semibold text-gray-900 dark:text-white">{restaurant.name}</span> sera definitivement supprime.</p>
        <p className="text-xs text-gray-400 mb-6">Tous les plats du menu seront egalement supprimes. Cette action est irreversible.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50" data-testid="cancel-delete-restaurant">Annuler</button>
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

function EditRestaurantModal({ restaurant, onClose }: { restaurant: Restaurant; onClose: () => void }) {
  const { toast } = useToast();
  const { data: restCategories = [] } = useQuery<RestaurantCategory[]>({ queryKey: ["/api/restaurant-categories"] });
  const [email, setEmail] = useState(restaurant.email || "");
  const [managerName, setManagerName] = useState(restaurant.managerName || "");
  const [brandName, setBrandName] = useState(restaurant.brandName || "");
  const [hqAddress, setHqAddress] = useState(restaurant.hqAddress || "");
  const [prepTime, setPrepTime] = useState(restaurant.prepTime || "20-30 min");
  const [name, setName] = useState(restaurant.name);
  const [cuisine, setCuisine] = useState(restaurant.cuisine);
  const [categoryId, setCategoryId] = useState<number>((restaurant as any).categoryId ?? 0);
  const [address, setAddress] = useState(restaurant.address);
  const [deliveryFee, setDeliveryFee] = useState(restaurant.deliveryFee);
  const [deliveryTime, setDeliveryTime] = useState(restaurant.deliveryTime);
  const [phone, setPhone] = useState(restaurant.phone || "");
  const [commissionRate, setCommissionRate] = useState<number>(restaurant.restaurantCommissionRate ?? 20);
  const [discountPercent, setDiscountPercent] = useState<number>((restaurant as any).discountPercent ?? 0);
  const [discountLabel, setDiscountLabel] = useState<string>((restaurant as any).discountLabel ?? "");
  const [isFeatured, setIsFeatured] = useState<boolean>((restaurant as any).isFeatured ?? false);

  const handleEditCategoryChange = (catId: number) => {
    const cat = restCategories.find(c => c.id === catId);
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
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">{label}</label>
      <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Modifier - {restaurant.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Informations du restaurant</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center" data-testid="close-edit-modal"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {inp(name, setName, "Nom *", "text", "Nom du restaurant")}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Catégorie *</label>
              <select
                value={categoryId}
                onChange={e => handleEditCategoryChange(Number(e.target.value))}
                data-testid="select-edit-restaurant-category"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value={0}>-- Choisir une catégorie --</option>
                {restCategories.filter(c => c.isActive).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          {inp(address, setAddress, "Adresse *", "text", "Avenue...")}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Frais de livraison ($)</label>
              <input type="number" value={deliveryFee} onChange={e => setDeliveryFee(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
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
                className="w-24 px-3 py-2.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 text-center focus:outline-none focus:ring-2 focus:ring-red-500" />
              <span className="text-sm font-bold text-red-600 dark:text-red-400">%</span>
              <p className="text-[11px] text-red-600/70 dark:text-red-400/70 flex-1">Part MAWEJA sur le CA livré</p>
            </div>
          </div>

          {/* ── Remise / Discount ─────────────────────── */}
          <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl p-3 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Tag size={14} className="text-green-600" />
              <label className="text-xs font-semibold text-green-700 dark:text-green-400">Remise / Discount affiché sur la carte</label>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-xl px-3 py-2">
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
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <p className="text-[10px] text-green-600/60 mt-1">Texte affiché sur la bannière de remise. Laissez vide pour afficher "{discountPercent > 0 ? discountPercent + "% OFF" : "X% OFF"}".</p>
            </div>
            {discountPercent > 0 && (
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 border border-green-100">
                <span className="text-[10px] font-semibold text-green-700 dark:text-green-400">Aperçu badge :</span>
                <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  -{discountPercent}% {discountLabel ? `· ${discountLabel}` : "OFF"}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-amber-500" />
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Store Partenaire</p>
                <p className="text-[10px] text-amber-600/70">Epingler ce restaurant en haut de la liste client</p>
              </div>
            </div>
            <div
              className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${isFeatured ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-600"}`}
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

function EditMediaModal({ restaurant, onClose }: { restaurant: Restaurant; onClose: () => void }) {
  const { toast } = useToast();
  const [logoUrl, setLogoUrl] = useState(restaurant.logoUrl || "");
  const [coverVideoUrl, setCoverVideoUrl] = useState(restaurant.coverVideoUrl || "");
  const [image, setImage] = useState(restaurant.image);
  const showError = (msg: string) => toast({ title: "Erreur", description: msg, variant: "destructive" });

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/restaurants/${restaurant.id}`, { method: "PATCH", body: JSON.stringify({ logoUrl: logoUrl || null, coverVideoUrl: coverVideoUrl || null, image }) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"], exact: false });
      toast({ title: "Medias mis a jour", description: `Medias de ${restaurant.name} modifies` });
      onClose();
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Medias - {restaurant.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Logo, image de couverture et video</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center" data-testid="close-media-modal"><X size={18} /></button>
        </div>
        <div className="space-y-5">
          <MediaUploadButton label="Logo du restaurant" accept="image/jpeg,image/png,image/webp" current={logoUrl} onUploaded={setLogoUrl} onError={showError} icon={Image} testId="upload-restaurant-logo" aspectRatio={1} />
          <MediaUploadButton label="Image de couverture" accept="image/jpeg,image/png,image/webp" current={image} onUploaded={setImage} onError={showError} icon={Image} testId="upload-restaurant-cover" aspectRatio={16 / 9} />
          <MediaUploadButton label="Vidéo de couverture (max 10MB, sans audio)" accept="video/mp4,video/webm,video/quicktime" current={coverVideoUrl} onUploaded={setCoverVideoUrl} onError={showError} icon={Video} testId="upload-restaurant-video" />
          {coverVideoUrl && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <p className="text-xs text-amber-700">La video sera lue en mode muet. Elle apparaitra sur la page du restaurant cote client.</p>
            </div>
          )}
        </div>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending} data-testid="save-restaurant-media"
          className="w-full mt-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Sauvegarder les medias
        </button>
      </div>
    </div>
  );
}

function MenuItemForm({ restaurantId, item, onClose }: { restaurantId: number; item?: MenuItem; onClose: () => void }) {
  const { toast } = useToast();
  const isEdit = !!item;
  const [form, setForm] = useState({
    name: item?.name || "",
    description: item?.description || "",
    price: item?.price || 0,
    category: item?.category || "Principal",
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
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">{isEdit ? "Modifier le plat" : "Ajouter un plat"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Nom du plat *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Poulet braise" data-testid="input-menu-item-name"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Courte description"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Prix ($) *</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} data-testid="input-menu-item-price"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Categorie</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500">
                {["Principal", "Entree", "Dessert", "Boisson", "Snack", "Accompagnement"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Image du plat</label>
            <div className="flex items-center gap-2 flex-wrap">
              {form.image && <img src={form.image} alt="" className="w-12 h-12 rounded-lg object-cover border" />}
              <button type="button" onClick={() => imageRef.current?.click()} disabled={imageUploading}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 rounded-xl text-xs font-medium text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors">
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
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.isAvailable} onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))} className="w-4 h-4 rounded accent-red-600" />
              Disponible
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.popular} onChange={e => setForm(f => ({ ...f, popular: e.target.checked }))} className="w-4 h-4 rounded accent-red-600" />
              Populaire ⭐
            </label>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Annuler</button>
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

function MenuSection({ restaurant }: { restaurant: Restaurant }) {
  const { toast } = useToast();
  const [addingItem, setAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);

  const { data: items = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/restaurants", restaurant.id, "menu"],
    queryFn: () => fetch(`/api/restaurants/${restaurant.id}/menu`).then(r => r.json()),
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

  if (isLoading) return <div className="py-4 text-center"><Loader2 size={16} className="animate-spin mx-auto text-gray-400" /></div>;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><UtensilsCrossed size={13} /> Menu ({items.length} plats)</p>
        <button onClick={() => setAddingItem(true)} data-testid={`add-menu-item-${restaurant.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors">
          <Plus size={12} /> Ajouter un plat
        </button>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
          <Package size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-xs text-gray-400">Aucun plat dans le menu</p>
          <button onClick={() => setAddingItem(true)} className="text-xs text-red-600 font-semibold mt-1 hover:underline">Ajouter le premier plat</button>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800" data-testid={`menu-item-${item.id}`}>
              <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 font-bold">{formatPrice(item.price)}</span>
                  <span className="text-[10px] text-gray-400">{item.category}</span>
                  {item.popular && <span className="text-[10px] bg-yellow-50 text-yellow-700 px-1 rounded font-medium">⭐ Populaire</span>}
                  {!item.isAvailable && <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded font-medium">Indispo</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditingItem(item)} data-testid={`edit-menu-item-${item.id}`}
                  className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors">
                  <Pencil size={11} />
                </button>
                <button onClick={() => setDeletingItem(item)} data-testid={`delete-menu-item-${item.id}`}
                  className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {addingItem && <MenuItemForm restaurantId={restaurant.id} onClose={() => setAddingItem(false)} />}
      {editingItem && <MenuItemForm restaurantId={restaurant.id} item={editingItem} onClose={() => setEditingItem(null)} />}
      {deletingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setDeletingItem(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-xs p-6 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><Trash2 size={20} className="text-red-600" /></div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Supprimer "{deletingItem.name}" ?</h3>
            <p className="text-xs text-gray-500 mb-4">Cette action est irreversible.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeletingItem(null)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Annuler</button>
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

export default function AdminRestaurants({ storeType = "restaurant" }: { storeType?: "restaurant" | "boutique" } = {}) {
  const apiUrl = storeType === "boutique" ? "/api/restaurants?type=boutique" : "/api/restaurants?type=restaurant";
  const { data: restaurants = [], isLoading } = useQuery<Restaurant[]>({ queryKey: [apiUrl] });
  const { toast } = useToast();
  const [editingMedia, setEditingMedia] = useState<Restaurant | null>(null);
  const [editingInfo, setEditingInfo] = useState<Restaurant | null>(null);
  const [deletingRestaurant, setDeletingRestaurant] = useState<Restaurant | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [addingRestaurant, setAddingRestaurant] = useState(false);
  const [search, setSearch] = useState("");

  const [orderedList, setOrderedList] = useState<Restaurant[]>([]);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const touchStartY = useRef(0);
  const touchIdx = useRef<number | null>(null);

  const sorted = [...restaurants].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const baseList = hasOrderChanges ? orderedList : sorted;

  const filtered = baseList.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine.toLowerCase().includes(search.toLowerCase()) ||
    r.address.toLowerCase().includes(search.toLowerCase())
  );

  const canDrag = !search;

  const moveRestaurant = useCallback((from: number, to: number) => {
    const list = [...(hasOrderChanges ? orderedList : sorted)];
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setOrderedList(list);
    setHasOrderChanges(true);
  }, [orderedList, sorted, hasOrderChanges]);

  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      const order = orderedList.map((r, idx) => ({ id: r.id, sortOrder: idx }));
      await apiRequest("/api/restaurants/reorder", {
        method: "PATCH",
        body: JSON.stringify({ order }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"], exact: false });
      setHasOrderChanges(false);
      toast({ title: "Ordre des restaurants sauvegardé !" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de sauvegarder l'ordre", variant: "destructive" });
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDragStart = (idx: number) => (e: React.DragEvent) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  };
  const handleDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIdx(idx);
  };
  const handleDrop = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIdx ?? parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (from !== idx) moveRestaurant(from, idx);
    setDragIdx(null);
    setOverIdx(null);
  };
  const handleTouchStart = (idx: number) => (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchIdx.current = idx;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchIdx.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const threshold = 40;
    const from = touchIdx.current;
    if (deltaY > threshold && from < filtered.length - 1) moveRestaurant(from, from + 1);
    else if (deltaY < -threshold && from > 0) moveRestaurant(from, from - 1);
    touchIdx.current = null;
  };

  const toggleActive = useMutation({
    mutationFn: (r: Restaurant) => apiRequest(`/api/restaurants/${r.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !r.isActive }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/restaurants"], exact: false }),
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  return (
    <AdminLayout title={storeType === "boutique" ? "Gestion des boutiques" : "Gestion des restaurants"}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: Store, color: "bg-red-50 text-red-600", value: restaurants.length, label: "Total restaurants" },
          { icon: Star, color: "bg-yellow-50 text-yellow-600", value: restaurants.length > 0 ? (restaurants.reduce((s, r) => s + r.rating, 0) / restaurants.length).toFixed(1) : "—", label: "Note moyenne" },
          { icon: Clock, color: "bg-green-50 text-green-600", value: restaurants.filter(r => r.isActive).length, label: "Actifs" },
        ].map(({ icon: Icon, color, value, label }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-11 h-11 ${color.split(" ")[0]} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color.split(" ")[1]} />
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white whitespace-nowrap">Tous les restaurants</h3>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." data-testid="search-restaurants"
                className="flex-1 max-w-xs px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <button onClick={() => setAddingRestaurant(true)} data-testid="button-add-restaurant"
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-sm hover:shadow-red-200 hover:shadow-md whitespace-nowrap">
              <Plus size={16} /> Ajouter un restaurant
            </button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <GripVertical size={12} /> Glissez-déposez pour réordonner. L'ordre sera reflété sur l'app client.
            </p>
            {hasOrderChanges && (
              <button
                onClick={saveOrder}
                disabled={savingOrder}
                data-testid="button-save-restaurant-order"
                className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 animate-pulse"
              >
                {savingOrder ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Sauvegarder l'ordre
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Store size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400">{search ? "Aucun restaurant correspondant" : "Aucun restaurant"}</p>
            {!search && <button onClick={() => setAddingRestaurant(true)} className="mt-3 text-red-600 font-semibold text-sm hover:underline">Ajouter le premier restaurant</button>}
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {filtered.map((r, idx) => (
              <div
                key={r.id}
                data-testid={`restaurant-row-${r.id}`}
                draggable={canDrag}
                onDragStart={canDrag ? handleDragStart(idx) : undefined}
                onDragOver={canDrag ? handleDragOver(idx) : undefined}
                onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                onDrop={canDrag ? handleDrop(idx) : undefined}
                onTouchStart={canDrag ? handleTouchStart(idx) : undefined}
                onTouchEnd={canDrag ? handleTouchEnd : undefined}
                className={`transition-all ${canDrag ? "cursor-grab active:cursor-grabbing" : ""} ${
                  dragIdx === idx ? "opacity-40 scale-[0.98]" : ""
                } ${overIdx === idx && dragIdx !== idx ? "bg-red-50/50 dark:bg-red-950/30" : ""}`}
              >
                <div className="p-4 flex items-center gap-3">
                  {canDrag && (
                    <div className="flex flex-col items-center gap-0.5 text-gray-300 dark:text-gray-600 flex-shrink-0 select-none">
                      <GripVertical size={16} />
                      <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 tabular-nums">{idx + 1}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                    {r.logoUrl ? (
                      <img src={r.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center border border-red-100">
                        <span className="text-red-600 font-black text-sm">{r.name.charAt(0)}</span>
                      </div>
                    )}
                    <img src={r.image} alt={r.name} className="w-14 h-14 rounded-xl object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{r.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.cuisine} · {r.address}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-xs text-red-600 font-bold">{formatPrice(r.deliveryFee)}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-500 flex items-center gap-0.5"><Star size={10} className="text-yellow-500 fill-yellow-500" /> {r.rating}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-500 flex items-center gap-0.5"><Clock size={10} /> {r.deliveryTime}</span>
                      {r.prepTime && <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">{r.prepTime}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {canDrag && (
                      <>
                        <button onClick={e => { e.stopPropagation(); if (idx > 0) moveRestaurant(idx, idx - 1); }}
                          disabled={idx === 0}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 transition-colors"
                          data-testid={`button-moveup-${r.id}`}>
                          <ArrowUp size={13} className="text-gray-500" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); if (idx < filtered.length - 1) moveRestaurant(idx, idx + 1); }}
                          disabled={idx === filtered.length - 1}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 transition-colors"
                          data-testid={`button-movedown-${r.id}`}>
                          <ArrowDown size={13} className="text-gray-500" />
                        </button>
                      </>
                    )}
                    <button onClick={e => { e.stopPropagation(); toggleActive.mutate(r); }}
                      data-testid={`toggle-active-${r.id}`}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${r.isActive ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700" : "bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700"}`}>
                      {r.isActive ? "Actif" : "Inactif"}
                    </button>
                    <button onClick={e => { e.stopPropagation(); setEditingInfo(r); }} data-testid={`edit-info-${r.id}`}
                      className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors text-xs font-medium" title="Modifier les infos">
                      <Pencil size={12} /> <span className="hidden sm:inline">Infos</span>
                    </button>
                    <button onClick={e => { e.stopPropagation(); setEditingMedia(r); }} data-testid={`edit-media-${r.id}`}
                      className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition-colors text-xs font-semibold" title="Modifier logo, image et vidéo">
                      <Image size={12} /> <span className="hidden sm:inline">Médias</span>
                      {(r.logoUrl || r.coverVideoUrl) && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); setDeletingRestaurant(r); }} data-testid={`delete-restaurant-${r.id}`}
                      className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors" title="Supprimer">
                      <Trash2 size={13} />
                    </button>
                    <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} data-testid={`expand-${r.id}`}
                      className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                      {expandedId === r.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>

                {expandedId === r.id && (
                  <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800" data-testid={`restaurant-details-${r.id}`}>
                    {/* ── Aperçu Médias ── */}
                    <div className="flex items-start gap-4 py-3 border-b border-gray-100 dark:border-gray-700 mb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Logo */}
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Logo</p>
                          {r.logoUrl ? (
                            <img src={r.logoUrl} alt="logo" className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow" data-testid={`preview-logo-${r.id}`} />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center" data-testid={`no-logo-${r.id}`}>
                              <span className="text-[10px] text-gray-400 text-center leading-tight">Pas de<br/>logo</span>
                            </div>
                          )}
                        </div>
                        {/* Image couverture */}
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Couverture</p>
                          <img src={r.image} alt="cover" className="w-24 h-14 rounded-xl object-cover border-2 border-white shadow" data-testid={`preview-cover-${r.id}`} />
                        </div>
                        {/* Vidéo */}
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Vidéo</p>
                          {r.coverVideoUrl ? (
                            <div className="w-24 h-14 rounded-xl overflow-hidden border-2 border-white shadow relative" data-testid={`preview-video-${r.id}`}>
                              <video src={r.coverVideoUrl} className="w-full h-full object-cover" muted playsInline />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <Video size={16} className="text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-24 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1" data-testid={`no-video-${r.id}`}>
                              <Video size={14} className="text-gray-400" />
                              <span className="text-[9px] text-gray-400">Pas de vidéo</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button onClick={() => setEditingMedia(r)} data-testid={`quick-edit-media-${r.id}`}
                        className="ml-auto flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm">
                        <Upload size={12} /> Modifier les médias
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 mb-3">
                      <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</p><p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{r.email || "—"}</p></div>
                      <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Manager</p><p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{r.managerName || "—"}</p></div>
                      <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Telephone</p><p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{r.phone || "—"}</p></div>
                      <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Horaires</p><p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{r.openingHours || "—"}</p></div>
                    </div>
                    <MenuSection restaurant={r} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {addingRestaurant && <AddRestaurantModal onClose={() => setAddingRestaurant(false)} storeType={storeType} />}
      {editingMedia && <EditMediaModal restaurant={editingMedia} onClose={() => setEditingMedia(null)} />}
      {editingInfo && <EditRestaurantModal restaurant={editingInfo} onClose={() => setEditingInfo(null)} />}
      {deletingRestaurant && <DeleteRestaurantModal restaurant={deletingRestaurant} onClose={() => setDeletingRestaurant(null)} />}
    </AdminLayout>
  );
}
