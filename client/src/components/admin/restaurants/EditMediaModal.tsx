import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Image, Video, Loader2, Check } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import { apiRequest, queryClient } from "../../../lib/queryClient";
import type { Restaurant } from "@shared/schema";
import MediaUploadButton from "./MediaUploadButton";

export default function EditMediaModal({ restaurant, onClose }: { restaurant: Restaurant; onClose: () => void }) {
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
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white">Medias - {restaurant.name}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Logo, image de couverture et video</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center" data-testid="close-media-modal"><X size={18} /></button>
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
