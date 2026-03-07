import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { Store, Star, Clock, MapPin, Upload, Image, Video, X, Loader2, Pencil } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import { authFetch, apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useState, useRef } from "react";
import type { Restaurant } from "@shared/schema";

function MediaUploadButton({ label, accept, onUploaded, current, icon: Icon, testId, onError }: {
  label: string; accept: string; onUploaded: (url: string) => void; current?: string | null; icon: any; testId: string; onError?: (msg: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isVideo = accept.includes("video");

  const handleFile = async (file: File) => {
    const maxSize = isVideo ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      onError?.(isVideo ? "Video trop volumineuse (max 20MB)" : "Image trop volumineuse (max 5MB)");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const endpoint = isVideo ? "/api/upload-media" : "/api/upload";
      const res = await authFetch(endpoint, { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) onUploaded(data.url);
    } catch { onError?.("Erreur lors de l'upload"); }
    setUploading(false);
  };

  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        {current && !isVideo && (
          <img src={current} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-200" />
        )}
        {current && isVideo && (
          <video src={current} className="w-16 h-12 rounded-xl object-cover border border-gray-200" muted />
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          data-testid={testId}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
          {uploading ? "Upload..." : current ? "Changer" : "Choisir"}
        </button>
        {current && (
          <button type="button" onClick={() => onUploaded("")} className="text-gray-400 hover:text-red-500" data-testid={`${testId}-remove`}>
            <X size={14} />
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
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
      await apiRequest("PATCH", `/api/restaurants/${restaurant.id}`, {
        logoUrl: logoUrl || null,
        coverVideoUrl: coverVideoUrl || null,
        image,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      toast({ title: "Mis a jour", description: `Medias de ${restaurant.name} modifies` });
      onClose();
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900">Medias - {restaurant.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Logo, image de couverture et video</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" data-testid="close-media-modal"><X size={18} /></button>
        </div>

        <div className="space-y-5">
          <MediaUploadButton
            label="Logo du restaurant"
            accept="image/jpeg,image/png,image/webp"
            current={logoUrl}
            onUploaded={setLogoUrl}
            onError={showError}
            icon={Image}
            testId="upload-restaurant-logo"
          />

          <MediaUploadButton
            label="Image de couverture"
            accept="image/jpeg,image/png,image/webp"
            current={image}
            onUploaded={setImage}
            onError={showError}
            icon={Image}
            testId="upload-restaurant-cover"
          />

          <MediaUploadButton
            label="Video de couverture (max 10s, sans son)"
            accept="video/mp4,video/webm,video/quicktime"
            current={coverVideoUrl}
            onUploaded={setCoverVideoUrl}
            onError={showError}
            icon={Video}
            testId="upload-restaurant-video"
          />

          {coverVideoUrl && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <p className="text-xs text-amber-700">La video sera lue en mode muet, maximum 10 secondes. Elle apparaitra sur la page du restaurant cote client.</p>
            </div>
          )}
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          data-testid="save-restaurant-media"
          className="w-full mt-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
          Sauvegarder les medias
        </button>
      </div>
    </div>
  );
}

export default function AdminRestaurants() {
  const { data: restaurants = [] } = useQuery<Restaurant[]>({ queryKey: ["/api/restaurants"] });
  const [editingMedia, setEditingMedia] = useState<Restaurant | null>(null);

  return (
    <AdminLayout title="Gestion des restaurants">
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center mb-3">
            <Store size={20} className="text-red-600" />
          </div>
          <p className="text-3xl font-black text-gray-900">{restaurants.length}</p>
          <p className="text-sm text-gray-500">Total restaurants</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center mb-3">
            <Star size={20} className="text-green-600" />
          </div>
          <p className="text-3xl font-black text-gray-900">
            {restaurants.length > 0 ? (restaurants.reduce((s, r) => s + r.rating, 0) / restaurants.length).toFixed(1) : 0}
          </p>
          <p className="text-sm text-gray-500">Note moyenne</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
            <Clock size={20} className="text-blue-600" />
          </div>
          <p className="text-3xl font-black text-gray-900">{restaurants.filter((r) => r.isActive).length}</p>
          <p className="text-sm text-gray-500">Actifs</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Tous les restaurants</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {restaurants.map((r) => (
            <div key={r.id} className="p-4 flex items-center gap-4" data-testid={`restaurant-row-${r.id}`}>
              <div className="flex items-center gap-3 flex-shrink-0">
                {r.logoUrl ? (
                  <img src={r.logoUrl} alt={`${r.name} logo`} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center border border-red-100">
                    <span className="text-red-600 font-black text-sm">{r.name.charAt(0)}</span>
                  </div>
                )}
                <img src={r.image} alt={r.name} className="w-16 h-16 rounded-xl object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{r.name}</p>
                <p className="text-xs text-gray-500">{r.cuisine} - {r.address}</p>
                <div className="flex items-center gap-2 mt-1">
                  {r.logoUrl && <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">Logo</span>}
                  {r.coverVideoUrl && <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">Video</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                <span className="font-bold">{r.rating}</span>
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Clock size={14} /> {r.deliveryTime}
              </div>
              <span className="font-semibold text-sm text-red-600">{formatPrice(r.deliveryFee)}</span>
              <button
                onClick={() => setEditingMedia(r)}
                data-testid={`edit-media-${r.id}`}
                className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                <Pencil size={14} />
              </button>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {r.isActive ? "Actif" : "Inactif"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {editingMedia && <EditMediaModal restaurant={editingMedia} onClose={() => setEditingMedia(null)} />}
    </AdminLayout>
  );
}
