import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient, getUserRole, getAuthToken } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { Image, Plus, Trash2, Edit2, X, Eye, EyeOff, Film, Flame, Megaphone, GalleryHorizontal } from "lucide-react";
import type { Advertisement, PromoBanner } from "@shared/schema";
import GalleryPicker from "../../components/GalleryPicker";
import ImportUrlToGallery from "../../components/ImportUrlToGallery";

function buildFetchHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { "X-User-Role": getUserRole(), ...extra };
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export default function AdminAds() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"ads" | "promo">("ads");

  // ─── ADS STATE ────────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Advertisement | null>(null);
  const [title, setTitle] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  // ─── PROMO BANNER STATE ───────────────────────────────────────────────────
  const [promoTagText, setPromoTagText] = useState("");
  const [promoTitle, setPromoTitle] = useState("");
  const [promoSubtitle, setPromoSubtitle] = useState("");
  const [promoButtonText, setPromoButtonText] = useState("");
  const [promoLinkUrl, setPromoLinkUrl] = useState("");
  const [promoBgFrom, setPromoBgFrom] = useState("#dc2626");
  const [promoBgTo, setPromoBgTo] = useState("#b91c1c");
  const [promoIsActive, setPromoIsActive] = useState(true);
  const [promoInitialized, setPromoInitialized] = useState(false);

  // ─── ADS QUERIES ──────────────────────────────────────────────────────────
  const { data: ads = [] } = useQuery<Advertisement[]>({
    queryKey: ["/api/advertisements"],
  });

  // ─── PROMO BANNER QUERY ────────────────────────────────────────────────────
  const { data: promoBanner } = useQuery<PromoBanner>({
    queryKey: ["/api/promo-banner"],
    select: (data) => {
      if (!promoInitialized && data) {
        setPromoTagText(data.tagText || "Offre Spéciale");
        setPromoTitle(data.title || "Livraison gratuite");
        setPromoSubtitle(data.subtitle || "Sur votre première commande");
        setPromoButtonText(data.buttonText || "Commander maintenant");
        setPromoLinkUrl(data.linkUrl || "");
        setPromoBgFrom(data.bgColorFrom || "#dc2626");
        setPromoBgTo(data.bgColorTo || "#b91c1c");
        setPromoIsActive(data.isActive ?? true);
        setPromoInitialized(true);
      }
      return data;
    },
  });

  // ─── ADS MUTATIONS ────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/advertisements", { method: "POST", body: formData, credentials: "include", headers: buildFetchHeaders() });
      if (!res.ok) throw new Error("Erreur creation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] });
      closeModal();
      toast({ title: "Succès", description: "Publicité créée" });
    },
    onError: () => { toast({ title: "Erreur", description: "Impossible de créer la publicité", variant: "destructive" }); },
  });

  const updateAdMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const res = await fetch(`/api/advertisements/${id}`, { method: "PATCH", body: formData, credentials: "include", headers: buildFetchHeaders() });
      if (!res.ok) throw new Error("Erreur mise a jour");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] });
      closeModal();
      toast({ title: "Succès", description: "Publicité modifiée" });
    },
    onError: () => { toast({ title: "Erreur", description: "Impossible de modifier la publicité", variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/advertisements/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] });
      toast({ title: "Supprimé", description: "Publicité supprimée" });
    },
  });

  const toggleAdMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const fd = new FormData();
      fd.append("isActive", String(isActive));
      const res = await fetch(`/api/advertisements/${id}`, { method: "PATCH", body: fd, credentials: "include", headers: buildFetchHeaders() });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] }),
  });

  // ─── PROMO BANNER MUTATION ─────────────────────────────────────────────────
  const updatePromoBanner = useMutation({
    mutationFn: () => apiRequest("/api/promo-banner", {
      method: "PATCH",
      body: JSON.stringify({
        tagText: promoTagText,
        title: promoTitle,
        subtitle: promoSubtitle,
        buttonText: promoButtonText,
        linkUrl: promoLinkUrl || null,
        bgColorFrom: promoBgFrom,
        bgColorTo: promoBgTo,
        isActive: promoIsActive,
      }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo-banner"] });
      toast({ title: "Succès", description: "Bannière promo mise à jour" });
    },
    onError: () => { toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" }); },
  });

  const closeModal = () => { setShowModal(false); setEditing(null); setTitle(""); setMediaUrl(""); setMediaType("image"); setLinkUrl(""); setFile(null); };

  const handleSaveAd = () => {
    const fd = new FormData();
    fd.append("title", title);
    fd.append("mediaType", mediaType);
    fd.append("linkUrl", linkUrl);
    if (file) fd.append("media", file);
    else if (mediaUrl) fd.append("mediaUrl", mediaUrl);
    if (editing) updateAdMutation.mutate({ id: editing.id, formData: fd });
    else createMutation.mutate(fd);
  };

  return (
    <AdminLayout title="Publicités">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab("ads")}
          data-testid="tab-ads"
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === "ads" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Megaphone size={15} /> Publicités
        </button>
        <button
          onClick={() => setActiveTab("promo")}
          data-testid="tab-promo-banner"
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === "promo" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Flame size={15} /> Bannière Promo
        </button>
      </div>

      {/* ─── TAB PUBLICITÉS ─────────────────────────────────────────────── */}
      {activeTab === "ads" && (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400" data-testid="text-admin-ads-title">Gérez les bannières publicitaires (1ère bannière de l'app)</p>
            <button
              onClick={() => { setShowModal(true); setEditing(null); setTitle(""); setMediaUrl(""); setMediaType("image"); setLinkUrl(""); setFile(null); }}
              data-testid="button-new-ad"
              className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-red-700"
            >
              <Plus size={16} /> Nouvelle publicité
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Image size={20} className="text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Bannière publicitaire (Carousel)</p>
              <p className="text-xs text-amber-600 mt-0.5">Max 5 publicités actives. Format 16:7. Images (JPG, PNG) ou vidéos courtes (MP4).</p>
            </div>
          </div>

          {ads.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
              <Image size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Aucune publicité</p>
              <p className="text-xs text-gray-400 mt-1">Cliquez "Nouvelle publicité" pour commencer</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ads.map(ad => (
                <div key={ad.id} className={`bg-white rounded-xl border overflow-hidden ${ad.isActive ? "border-green-200" : "border-gray-200 opacity-60"}`}
                  data-testid={`admin-ad-${ad.id}`}>
                  <div className="aspect-[16/7] bg-gray-100 relative">
                    {ad.mediaType === "video" ? (
                      <video src={ad.mediaUrl} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={ad.mediaUrl} alt={ad.title} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ad.mediaType === "video" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                        {ad.mediaType === "video" ? "Vidéo" : "Image"}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ad.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500 dark:text-gray-400"}`}>
                        {ad.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{ad.title || "Sans titre"}</h3>
                    <div className="flex items-center gap-1.5 mt-3">
                      <button
                        onClick={() => { setEditing(ad); setShowModal(true); setTitle(ad.title); setMediaUrl(ad.mediaUrl); setMediaType(ad.mediaType); setLinkUrl(ad.linkUrl || ""); }}
                        className="flex-1 py-1.5 bg-gray-50 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-1"
                        data-testid={`button-edit-ad-${ad.id}`}>
                        <Edit2 size={12} /> Modifier
                      </button>
                      <button onClick={() => toggleAdMutation.mutate({ id: ad.id, isActive: !ad.isActive })}
                        className="py-1.5 px-2.5 bg-gray-50 rounded-lg hover:bg-gray-100"
                        data-testid={`button-toggle-ad-${ad.id}`}>
                        {ad.isActive ? <EyeOff size={14} className="text-gray-500 dark:text-gray-400" /> : <Eye size={14} className="text-green-600" />}
                      </button>
                      <button onClick={() => { if (confirm("Supprimer cette publicité ?")) deleteMutation.mutate(ad.id); }}
                        className="py-1.5 px-2.5 bg-gray-50 rounded-lg hover:bg-red-50"
                        data-testid={`button-delete-ad-${ad.id}`}>
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6" data-testid="modal-ad">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">{editing ? "Modifier" : "Nouvelle"} publicité</h3>
                  <button onClick={closeModal} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><X size={16} /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Titre</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre de la publicité"
                      data-testid="input-ad-title"
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Type de média</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setMediaType("image")}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 ${mediaType === "image" ? "bg-red-600 text-white" : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}>
                        <Image size={14} /> Image
                      </button>
                      <button type="button" onClick={() => setMediaType("video")}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 ${mediaType === "video" ? "bg-red-600 text-white" : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}>
                        <Film size={14} /> Vidéo
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Fichier média</label>
                    <input type="file" accept={mediaType === "video" ? "video/*" : "image/*"} onChange={e => setFile(e.target.files?.[0] || null)}
                      data-testid="input-ad-file"
                      className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-600 hover:file:bg-red-100" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Ou URL du média</label>
                    <div className="flex gap-2">
                      <input type="url" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://..."
                        data-testid="input-ad-url"
                        className="flex-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
                      <button type="button" onClick={() => setGalleryOpen(true)} data-testid="button-ad-gallery"
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors whitespace-nowrap">
                        <GalleryHorizontal size={14} /> Galerie
                      </button>
                    </div>
                    {mediaUrl && (
                      <div className="mt-2 space-y-2">
                        <ImportUrlToGallery url={mediaUrl} onImported={url => { setMediaUrl(url); setFile(null); }} size="md" />
                        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 max-h-32">
                          {mediaType === "video"
                            ? <video src={mediaUrl} className="w-full max-h-32 object-contain bg-black" muted />
                            : <img src={mediaUrl} alt="" className="w-full max-h-32 object-contain bg-gray-50" />}
                        </div>
                      </div>
                    )}
                  </div>
                  <GalleryPicker
                    open={galleryOpen}
                    onClose={() => setGalleryOpen(false)}
                    onSelect={url => { setMediaUrl(url); setFile(null); }}
                    filter={mediaType === "video" ? "video" : "image"}
                  />
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Lien (optionnel)</label>
                    <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..."
                      data-testid="input-ad-link"
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
                  </div>
                  <button onClick={handleSaveAd} disabled={createMutation.isPending || updateAdMutation.isPending}
                    data-testid="button-save-ad"
                    className="w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50">
                    {editing ? "Modifier" : "Créer"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── TAB BANNIÈRE PROMO ──────────────────────────────────────────── */}
      {activeTab === "promo" && (
        <div className="max-w-2xl">
          <p className="text-sm text-gray-500 mb-6">Personnalisez la bannière promotionnelle qui apparaît sur l'accueil de l'app cliente.</p>

          {/* Live Preview */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Aperçu en temps réel</p>
            <div
              className="rounded-2xl p-5 text-white relative overflow-hidden"
              style={{ background: `linear-gradient(to right, ${promoBgFrom}, ${promoBgTo})` }}
              data-testid="promo-banner-preview"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-1 mb-2">
                  <Flame size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">{promoTagText || "Offre Spéciale"}</span>
                </div>
                <h3 className="text-xl font-bold">{promoTitle || "Livraison gratuite"}</h3>
                <p className="text-white/80 text-sm mt-1">{promoSubtitle || "Sur votre première commande"}</p>
                {promoButtonText && (
                  <button className="mt-3 bg-white px-4 py-2 rounded-xl text-xs font-bold" style={{ color: promoBgFrom }}>
                    {promoButtonText}
                  </button>
                )}
              </div>
              <div className="absolute right-0 top-0 w-32 h-full rounded-l-full" style={{ background: "rgba(255,255,255,0.1)" }} />
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Tag / Étiquette</label>
                <input
                  type="text"
                  value={promoTagText}
                  onChange={e => setPromoTagText(e.target.value)}
                  placeholder="Offre Spéciale"
                  data-testid="input-promo-tag"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Texte du bouton</label>
                <input
                  type="text"
                  value={promoButtonText}
                  onChange={e => setPromoButtonText(e.target.value)}
                  placeholder="Commander maintenant"
                  data-testid="input-promo-button"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Titre principal</label>
              <input
                type="text"
                value={promoTitle}
                onChange={e => setPromoTitle(e.target.value)}
                placeholder="Livraison gratuite"
                data-testid="input-promo-title"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Sous-titre</label>
              <input
                type="text"
                value={promoSubtitle}
                onChange={e => setPromoSubtitle(e.target.value)}
                placeholder="Sur votre première commande"
                data-testid="input-promo-subtitle"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Lien du bouton (optionnel)</label>
              <input
                type="url"
                value={promoLinkUrl}
                onChange={e => setPromoLinkUrl(e.target.value)}
                placeholder="https://..."
                data-testid="input-promo-link"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Couleur début</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={promoBgFrom}
                    onChange={e => setPromoBgFrom(e.target.value)}
                    data-testid="input-promo-color-from"
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={promoBgFrom}
                    onChange={e => setPromoBgFrom(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Couleur fin</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={promoBgTo}
                    onChange={e => setPromoBgTo(e.target.value)}
                    data-testid="input-promo-color-to"
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={promoBgTo}
                    onChange={e => setPromoBgTo(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-gray-700">Bannière active</p>
                <p className="text-xs text-gray-400">Afficher la bannière promo sur l'accueil</p>
              </div>
              <button
                type="button"
                onClick={() => setPromoIsActive(!promoIsActive)}
                data-testid="toggle-promo-active"
                className={`relative w-12 h-6 rounded-full transition-all ${promoIsActive ? "bg-red-600" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${promoIsActive ? "left-6" : "left-0.5"}`} />
              </button>
            </div>

            <button
              onClick={() => updatePromoBanner.mutate()}
              disabled={updatePromoBanner.isPending}
              data-testid="button-save-promo"
              className="w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50"
            >
              {updatePromoBanner.isPending ? "Sauvegarde..." : "Sauvegarder la bannière"}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
