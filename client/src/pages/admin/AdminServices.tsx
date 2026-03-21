import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useI18n } from "../../lib/i18n";
import {
  Briefcase, Plus, Search, Clock, CheckCircle, AlertCircle, Loader2,
  Eye, MessageSquare, Trash2, Edit2, X, ChevronDown, Image, Copy, Check, ImageIcon, GalleryHorizontal, GripVertical, ArrowUp, ArrowDown, Save
} from "lucide-react";
import type { ServiceCategory, ServiceRequest, ServiceCatalogItem } from "@shared/schema";
import GalleryPicker from "../../components/GalleryPicker";
import ImportUrlToGallery from "../../components/ImportUrlToGallery";

/* ── Static media assets ───────────────────────────────────────────────── */
const SERVICE_ICONS: { name: string; url: string }[] = [
  { name: "Carburant",     url: "/services/carburant.png" },
  { name: "Coiffure",      url: "/services/coiffure.png" },
  { name: "Conciergerie",  url: "/services/conciergerie.png" },
  { name: "Domicile",      url: "/services/domicile.png" },
  { name: "Esthétique",    url: "/services/esthetique.png" },
  { name: "Événementiel",  url: "/services/evenementiel.png" },
  { name: "Hôtellerie",    url: "/services/hotellerie.png" },
  { name: "Logistique",    url: "/services/logistique.png" },
  { name: "Manucure",      url: "/services/manucure.png" },
  { name: "Massage",       url: "/services/massage.png" },
  { name: "Professionnel", url: "/services/professionnel.png" },
  { name: "Transport",     url: "/services/transport.png" },
  { name: "Voyage",        url: "/services/voyage.png" },
];

const LOGOS: { name: string; url: string }[] = [
  { name: "Logo MAWEJA Rouge", url: "/maweja-logo-red.png" },
  { name: "Icône MAWEJA",      url: "/maweja-icon.png" },
  { name: "Logo MAWEJA",       url: "/logo.png" },
];

function MediaCard({ name, url, testKey, copiedUrl, onCopy }: {
  name: string; url: string; testKey: string;
  copiedUrl: string | null; onCopy: (url: string) => void;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group"
      data-testid={`media-card-${testKey}`}
    >
      <div className="relative w-full bg-gray-50" style={{ paddingBottom: "100%" }}>
        <img
          src={url}
          alt={name}
          className="absolute inset-0 w-full h-full object-contain p-3"
          data-testid={`media-img-${testKey}`}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
          <button
            onClick={() => onCopy(url)}
            className="opacity-0 group-hover:opacity-100 transition-all bg-white shadow-lg rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs font-bold text-gray-700"
          >
            {copiedUrl === url ? <><Check size={12} className="text-green-600" /> Copié</> : <><Copy size={12} /> Copier URL</>}
          </button>
        </div>
      </div>
      <div className="p-2.5">
        <p className="font-bold text-[11px] text-gray-800 line-clamp-1 mb-1">{name}</p>
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
          <code className="text-[8px] text-gray-400 flex-1 truncate font-mono">{url}</code>
          <button
            onClick={() => onCopy(url + "_inline")}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-all hover:bg-gray-200 active:scale-90"
          >
            {copiedUrl === url + "_inline" ? (
              <Check size={10} className="text-green-600" />
            ) : (
              <Copy size={10} className="text-gray-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function MediaLibrary({ categories, copiedUrl, setCopiedUrl }: {
  categories: ServiceCategory[];
  copiedUrl: string | null;
  setCopiedUrl: (url: string | null) => void;
}) {
  const catImages = categories.filter(c => c.imageUrl);
  const totalImages = SERVICE_ICONS.length + LOGOS.length + catImages.length;

  const copy = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  };

  const allItems = [
    ...SERVICE_ICONS,
    ...LOGOS,
    ...catImages.map(c => ({ name: c.name, url: c.imageUrl! })),
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-gray-900">Médiathèque</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Survolez une image et cliquez pour copier son URL. Utilisez-la lors de la création de services ou catégories.
          </p>
        </div>
        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {totalImages} images
        </span>
      </div>

      {/* Section 1: Service icons */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-red-600 rounded-full" />
          <h4 className="font-bold text-sm text-gray-800">Icônes de services</h4>
          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{SERVICE_ICONS.length} images</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {SERVICE_ICONS.map(item => (
            <MediaCard
              key={item.url}
              name={item.name}
              url={item.url}
              testKey={item.name.toLowerCase()}
              copiedUrl={copiedUrl}
              onCopy={copy}
            />
          ))}
        </div>
      </div>

      {/* Section 2: MAWEJA logos */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-blue-600 rounded-full" />
          <h4 className="font-bold text-sm text-gray-800">Logos MAWEJA</h4>
          <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{LOGOS.length} images</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {LOGOS.map(item => (
            <MediaCard
              key={item.url}
              name={item.name}
              url={item.url}
              testKey={item.name.replace(/\s+/g, "-").toLowerCase()}
              copiedUrl={copiedUrl}
              onCopy={copy}
            />
          ))}
        </div>
      </div>

      {/* Section 3: DB category images */}
      {catImages.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-amber-500 rounded-full" />
            <h4 className="font-bold text-sm text-gray-800">Images de catégories (personnalisées)</h4>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{catImages.length} images</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {catImages.map(cat => (
              <MediaCard
                key={cat.id}
                name={cat.name}
                url={cat.imageUrl!}
                testKey={String(cat.id)}
                copiedUrl={copiedUrl}
                onCopy={copy}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick URL reference */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h4 className="font-bold text-sm text-gray-900">Référence rapide — toutes les URLs</h4>
          <button
            onClick={() => {
              const all = allItems.map(i => `${i.name}: ${i.url}`).join("\n");
              navigator.clipboard.writeText(all).then(() => {
                setCopiedUrl("__all__");
                setTimeout(() => setCopiedUrl(null), 2000);
              });
            }}
            className="text-[10px] font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1 transition-all"
            style={{
              background: copiedUrl === "__all__" ? "#dcfce7" : "#f9fafb",
              color: copiedUrl === "__all__" ? "#16a34a" : "#6b7280",
              borderColor: copiedUrl === "__all__" ? "#86efac" : "#e5e7eb",
            }}
            data-testid="button-copy-all-urls"
          >
            {copiedUrl === "__all__" ? <><Check size={10} /> Copié</> : <><Copy size={10} /> Tout copier</>}
          </button>
        </div>
        <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
          {allItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 px-5 py-3">
              <img src={item.url} alt={item.name} className="w-10 h-10 object-contain rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
                <p className="text-[10px] text-gray-400 truncate font-mono">{item.url}</p>
              </div>
              <button
                onClick={() => copy(item.url + "_ref")}
                data-testid={`button-copy-ref-${idx}`}
                className="flex-shrink-0 px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1"
                style={{
                  background: copiedUrl === item.url + "_ref" ? "#dcfce7" : "#f9fafb",
                  color: copiedUrl === item.url + "_ref" ? "#16a34a" : "#6b7280",
                  borderColor: copiedUrl === item.url + "_ref" ? "#86efac" : "#e5e7eb",
                }}
              >
                {copiedUrl === item.url + "_ref" ? <><Check size={10} /> Copié</> : <><Copy size={10} /> Copier</>}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CategoriesTab({ categories, t, onAdd, onEdit, onDelete }: {
  categories: ServiceCategory[];
  t: any;
  onAdd: () => void;
  onEdit: (cat: ServiceCategory) => void;
  onDelete: (id: number) => void;
}) {
  const { toast } = useToast();
  const [orderedCats, setOrderedCats] = useState<ServiceCategory[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const touchStartY = useRef(0);
  const touchIdx = useRef<number | null>(null);

  const sorted = [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const displayCats = hasChanges ? orderedCats : sorted;

  const moveCat = useCallback((fromIndex: number, toIndex: number) => {
    const list = [...(hasChanges ? orderedCats : sorted)];
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    setOrderedCats(list);
    setHasChanges(true);
  }, [orderedCats, sorted, hasChanges]);

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
    if (from !== idx) moveCat(from, idx);
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
    if (deltaY > threshold && from < displayCats.length - 1) {
      moveCat(from, from + 1);
    } else if (deltaY < -threshold && from > 0) {
      moveCat(from, from - 1);
    }
    touchIdx.current = null;
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      const order = orderedCats.map((cat, idx) => ({ id: cat.id, sortOrder: idx }));
      await apiRequest("/api/service-categories/reorder", {
        method: "PATCH",
        body: JSON.stringify({ order }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
      setHasChanges(false);
      toast({ title: "Ordre sauvegardé !" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de sauvegarder l'ordre", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <button onClick={onAdd}
          data-testid="button-add-category"
          className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-red-700">
          <Plus size={16} /> {t.admin.newCategory}
        </button>
        {hasChanges && (
          <button
            onClick={saveOrder}
            disabled={saving}
            data-testid="button-save-order"
            className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 animate-pulse"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Sauvegarder l'ordre
          </button>
        )}
      </div>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1">
        <GripVertical size={12} /> Glissez-déposez pour réordonner les catégories. L'ordre sera appliqué sur l'application client.
      </p>
      <div className="space-y-2">
        {displayCats.map((cat, idx) => (
          <div
            key={cat.id}
            draggable
            onDragStart={handleDragStart(idx)}
            onDragOver={handleDragOver(idx)}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
            onDrop={handleDrop(idx)}
            onTouchStart={handleTouchStart(idx)}
            onTouchEnd={handleTouchEnd}
            data-testid={`admin-cat-${cat.id}`}
            className={`bg-white dark:bg-gray-900 rounded-xl border p-3 flex items-center gap-3 transition-all cursor-grab active:cursor-grabbing select-none ${
              dragIdx === idx ? "opacity-40 scale-95" : ""
            } ${overIdx === idx && dragIdx !== idx ? "border-red-400 dark:border-red-600 shadow-lg shadow-red-100 dark:shadow-red-900/30" : "border-gray-100 dark:border-gray-800"}`}
          >
            <div className="flex flex-col items-center gap-0.5 text-gray-300 dark:text-gray-600 flex-shrink-0">
              <GripVertical size={18} />
              <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 tabular-nums">{idx + 1}</span>
            </div>

            {cat.imageUrl ? (
              <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 flex items-center justify-center text-lg flex-shrink-0">{cat.icon}</div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">{cat.name}</h3>
              <p className="text-[11px] text-gray-500 truncate">{cat.description}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${cat.isActive ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                {cat.isActive ? t.common.active : t.common.inactive}
              </span>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={(e) => { e.stopPropagation(); if (idx > 0) moveCat(idx, idx - 1); }}
                disabled={idx === 0}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 transition-colors"
                data-testid={`button-moveup-cat-${cat.id}`}>
                <ArrowUp size={13} className="text-gray-500" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); if (idx < displayCats.length - 1) moveCat(idx, idx + 1); }}
                disabled={idx === displayCats.length - 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 transition-colors"
                data-testid={`button-movedown-cat-${cat.id}`}>
                <ArrowDown size={13} className="text-gray-500" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onEdit(cat); }}
                className="w-7 h-7 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                data-testid={`button-edit-cat-${cat.id}`}>
                <Edit2 size={13} className="text-gray-500 dark:text-gray-400" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(cat.id); }}
                className="w-7 h-7 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950"
                data-testid={`button-delete-cat-${cat.id}`}>
                <Trash2 size={13} className="text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function AdminServices() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [tab, setTab] = useState<"requests" | "categories" | "catalog" | "media">("requests");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("Briefcase");
  const [catImageUrl, setCatImageUrl] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catServiceTypes, setCatServiceTypes] = useState<string[]>([]);
  const [newTypeInput, setNewTypeInput] = useState("");
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [galleryOpenCat, setGalleryOpenCat] = useState(false);
  const [galleryOpenItem, setGalleryOpenItem] = useState(false);
  const [editingCat, setEditingCat] = useState<ServiceCategory | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceCatalogItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemImage, setItemImage] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategoryId, setItemCategoryId] = useState<number>(0);
  const [catalogCatFilter, setCatalogCatFilter] = useState<number | "all">("all");

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: t.status.pending, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    reviewing: { label: t.status.reviewing, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    accepted: { label: t.status.accepted, color: "text-green-700", bg: "bg-green-50 border-green-200" },
    rejected: { label: t.status.rejected, color: "text-red-700", bg: "bg-red-50 border-red-200" },
    completed: { label: t.status.completed, color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
  };

  const { data: categories = [] } = useQuery<ServiceCategory[]>({ queryKey: ["/api/service-categories"] });
  const { data: requests = [] } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests"],
    queryFn: () => apiRequest("/api/service-requests").then(r => r.json()),
  });
  const { data: catalogItems = [] } = useQuery<ServiceCatalogItem[]>({
    queryKey: ["/api/service-catalog"],
  });

  const errToast = (err: any, fallback = "Une erreur est survenue") =>
    toast({ title: "Erreur", description: err?.message || fallback, variant: "destructive" });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/service-requests/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      setSelectedRequest(null);
      toast({ title: t.common.success, description: t.admin.updateButton });
    },
    onError: (err: any) => errToast(err, "Impossible de mettre à jour la demande"),
  });

  const addServiceType = () => {
    const val = newTypeInput.trim();
    if (val && !catServiceTypes.includes(val)) {
      setCatServiceTypes([...catServiceTypes, val]);
    }
    setNewTypeInput("");
  };

  const removeServiceType = (idx: number) => {
    setCatServiceTypes(catServiceTypes.filter((_, i) => i !== idx));
  };

  const createCatMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/service-categories", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
      setShowCatModal(false);
      setCatName(""); setCatIcon("Briefcase"); setCatImageUrl(""); setCatDesc(""); setCatServiceTypes([]); setNewTypeInput("");
      toast({ title: t.common.success, description: t.admin.newCategory });
    },
    onError: (err: any) => errToast(err, "Impossible de créer la catégorie"),
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/service-categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
      setEditingCat(null);
      toast({ title: t.common.success, description: t.admin.updateButton });
    },
    onError: (err: any) => errToast(err, "Impossible de modifier la catégorie"),
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/service-categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
      toast({ title: t.common.success, description: t.common.delete });
    },
    onError: (err: any) => errToast(err, "Impossible de supprimer la catégorie"),
  });

  const createItemMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/service-catalog", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      setShowItemModal(false);
      resetItemForm();
      toast({ title: t.common.success, description: t.admin.addCatalogItem });
    },
    onError: (err: any) => errToast(err, "Impossible de créer l'article"),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/service-catalog/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      setEditingItem(null);
      setShowItemModal(false);
      resetItemForm();
      toast({ title: t.common.success, description: t.admin.updateButton });
    },
    onError: (err: any) => errToast(err, "Impossible de modifier l'article"),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/service-catalog/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      toast({ title: t.common.success, description: t.common.delete });
    },
    onError: (err: any) => errToast(err, "Impossible de supprimer l'article"),
  });

  const resetItemForm = () => {
    setItemName(""); setItemDesc(""); setItemImage(""); setItemPrice(""); setItemCategoryId(0);
  };

  const filteredRequests = requests
    .filter(r => statusFilter === "all" || r.status === statusFilter)
    .filter(r => !search || r.fullName.toLowerCase().includes(search.toLowerCase()) || r.categoryName.toLowerCase().includes(search.toLowerCase()) || r.phone.includes(search));

  const filteredCatalog = catalogCatFilter === "all"
    ? catalogItems
    : catalogItems.filter(item => item.categoryId === catalogCatFilter);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    reviewing: requests.filter(r => r.status === "reviewing").length,
    accepted: requests.filter(r => r.status === "accepted").length,
  };

  return (
    <AdminLayout title={t.admin.services}>
      <div className="mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400" data-testid="text-admin-services-title">{t.admin.manageServiceRequests}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: t.admin.totalRequests, value: stats.total, color: "bg-blue-50 text-blue-700" },
          { label: t.admin.pending, value: stats.pending, color: "bg-amber-50 text-amber-700" },
          { label: t.admin.reviewing, value: stats.reviewing, color: "bg-purple-50 text-purple-700" },
          { label: t.admin.accepted, value: stats.accepted, color: "bg-green-50 text-green-700" },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4" data-testid={`stat-card-${i}`}>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color.split(" ")[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setTab("requests")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "requests" ? "bg-red-600 text-white" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}
          data-testid="tab-requests">
          {t.admin.requests} ({requests.length})
        </button>
        <button onClick={() => setTab("categories")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "categories" ? "bg-red-600 text-white" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}
          data-testid="tab-categories">
          {t.admin.categories} ({categories.length})
        </button>
        <button onClick={() => setTab("catalog")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "catalog" ? "bg-red-600 text-white" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}
          data-testid="tab-catalog">
          {t.admin.catalog} ({catalogItems.length})
        </button>
        <button onClick={() => setTab("media")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${tab === "media" ? "bg-red-600 text-white" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}
          data-testid="tab-media">
          <ImageIcon size={14} /> Médiathèque
        </button>
      </div>

      {tab === "requests" && (
        <>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t.admin.searchPlaceholder}
                data-testid="input-search-requests"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              data-testid="select-status-filter"
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none">
              <option value="all">{t.admin.allStatuses}</option>
              <option value="pending">{t.admin.pending}</option>
              <option value="reviewing">{t.admin.reviewing}</option>
              <option value="accepted">{t.admin.accepted}</option>
              <option value="rejected">{t.admin.rejected}</option>
              <option value="completed">{t.admin.completed}</option>
            </select>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
              <Briefcase size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.admin.noRequests}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map(req => {
                const status = statusConfig[req.status] || statusConfig.pending;
                return (
                  <div key={req.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-md transition-shadow"
                    data-testid={`admin-request-${req.id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-sm text-gray-900 dark:text-white">#{req.id} - {req.categoryName}</h3>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${status.bg} ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{req.fullName} • {req.phone}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{req.address}</p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                          {req.serviceType && <span>{t.services.type}: {req.serviceType}</span>}
                          {req.budget && <span>{t.admin.budget}: {req.budget}</span>}
                          <span>{req.scheduledType === "asap" ? t.services.asap : `${req.scheduledDate} ${req.scheduledTime}`}</span>
                        </div>
                        {req.additionalInfo && <p className="text-xs text-gray-500 mt-1 italic">"{req.additionalInfo}"</p>}
                      </div>
                      <button onClick={() => { setSelectedRequest(req); setNewStatus(req.status); setAdminNotes(req.adminNotes || ""); }}
                        data-testid={`button-manage-${req.id}`}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 flex items-center gap-1">
                        <Eye size={14} /> {t.admin.manageRequest}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "categories" && (
        <CategoriesTab
          categories={categories}
          t={t}
          onAdd={() => { setShowCatModal(true); setCatName(""); setCatIcon("Briefcase"); setCatImageUrl(""); setCatDesc(""); setCatServiceTypes([]); setNewTypeInput(""); }}
          onEdit={(cat) => { setEditingCat(cat); setCatName(cat.name); setCatIcon(cat.icon); setCatImageUrl(cat.imageUrl || ""); setCatDesc(cat.description); setCatServiceTypes(cat.serviceTypes || []); setNewTypeInput(""); }}
          onDelete={(id) => { if (confirm(t.common.confirm + "?")) deleteCatMutation.mutate(id); }}
        />
      )}

      {tab === "catalog" && (
        <>
          <div className="flex flex-wrap gap-3 mb-4">
            <button onClick={() => {
              setShowItemModal(true); setEditingItem(null); resetItemForm();
              if (categories.length > 0) setItemCategoryId(categories[0].id);
            }}
              data-testid="button-add-catalog-item"
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-red-700">
              <Plus size={16} /> {t.admin.addCatalogItem}
            </button>
            <select value={String(catalogCatFilter)} onChange={e => setCatalogCatFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              data-testid="select-catalog-category"
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm">
              <option value="all">{t.common.all} {t.admin.categories}</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          {filteredCatalog.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
              <Image size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.admin.noCatalogItems}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCatalog.map(item => {
                const cat = categories.find(c => c.id === item.categoryId);
                return (
                  <div key={item.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow" data-testid={`catalog-item-${item.id}`}>
                    <div className="relative h-40">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                        {cat?.name || "—"}
                      </span>
                      {!item.isActive && (
                        <span className="absolute top-2 right-2 bg-gray-800/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg">{t.common.inactive}</span>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{item.name}</h4>
                      {item.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>}
                      {item.price && <p className="text-xs font-semibold text-red-600 mt-1">{item.price}</p>}
                      <div className="flex gap-1 mt-2">
                        <button onClick={() => {
                          setEditingItem(item);
                          setItemName(item.name);
                          setItemDesc(item.description);
                          setItemImage(item.imageUrl);
                          setItemPrice(item.price || "");
                          setItemCategoryId(item.categoryId);
                          setShowItemModal(true);
                        }} className="flex-1 px-2 py-1.5 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100" data-testid={`button-edit-item-${item.id}`}>
                          <Edit2 size={12} className="inline mr-1" />{t.common.edit}
                        </button>
                        <button onClick={() => { if (confirm(t.common.confirm + "?")) deleteItemMutation.mutate(item.id); }}
                          className="px-2 py-1.5 bg-red-50 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-100" data-testid={`button-delete-item-${item.id}`}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" data-testid="modal-manage-request">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{t.services.request} #{selectedRequest.id}</h3>
              <button onClick={() => setSelectedRequest(null)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="space-y-3 mb-4 bg-gray-50 rounded-xl p-4 text-sm">
              <p><strong>{t.services.service}:</strong> {selectedRequest.categoryName}</p>
              <p><strong>{t.common.name}:</strong> {selectedRequest.fullName}</p>
              <p><strong>{t.common.phone}:</strong> {selectedRequest.phone}</p>
              <p><strong>{t.common.address}:</strong> {selectedRequest.address}</p>
              {selectedRequest.serviceType && <p><strong>{t.services.type}:</strong> {selectedRequest.serviceType}</p>}
              {selectedRequest.budget && <p><strong>{t.admin.budget}:</strong> {selectedRequest.budget}</p>}
              <p><strong>{t.admin.schedule}:</strong> {selectedRequest.scheduledType === "asap" ? t.services.asap : `${selectedRequest.scheduledDate} ${selectedRequest.scheduledTime}`}</p>
              {selectedRequest.additionalInfo && <p><strong>{t.admin.info}:</strong> {selectedRequest.additionalInfo}</p>}
            </div>
            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{t.admin.statusLabel}</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                data-testid="select-new-status"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white">
                <option value="pending">{t.status.pending}</option>
                <option value="reviewing">{t.status.reviewing}</option>
                <option value="accepted">{t.status.accepted}</option>
                <option value="rejected">{t.status.rejected}</option>
                <option value="completed">{t.status.completed}</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{t.admin.adminNotes}</label>
              <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder={t.admin.adminNotesPlaceholder}
                data-testid="input-admin-notes"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white h-24 resize-none" />
            </div>
            <button onClick={() => updateRequestMutation.mutate({ id: selectedRequest.id, data: { status: newStatus, adminNotes } })}
              disabled={updateRequestMutation.isPending}
              data-testid="button-save-request"
              className="w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50">
              {updateRequestMutation.isPending ? t.admin.updating : t.admin.updateButton}
            </button>
          </div>
        </div>
      )}

      {(showCatModal || editingCat) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]" data-testid="modal-category">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{editingCat ? t.admin.editCategory : t.admin.newCategory}</h3>
              <button onClick={() => { setShowCatModal(false); setEditingCat(null); setShowImagePicker(false); }} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{t.admin.categoryName}</label>
                <input type="text" value={catName} onChange={e => setCatName(e.target.value)}
                  data-testid="input-cat-name"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Image de la catégorie</label>

                {/* Selected image preview + picker trigger */}
                <button
                  type="button"
                  onClick={() => setShowImagePicker(v => !v)}
                  data-testid="button-pick-image"
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-left transition-all hover:border-red-300 hover:bg-red-50 dark:hover:bg-gray-700 active:scale-[0.98]"
                >
                  {catImageUrl ? (
                    <img
                      src={catImageUrl}
                      alt="aperçu"
                      className="w-10 h-10 object-contain rounded-lg bg-white border border-gray-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                      <ImageIcon size={18} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {catImageUrl ? "Image sélectionnée" : "Choisir une image"}
                    </p>
                    {catImageUrl && (
                      <p className="text-[10px] text-gray-400 truncate font-mono">{catImageUrl}</p>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0">
                    {showImagePicker ? "Fermer" : "Changer"}
                  </span>
                </button>

                {/* Image picker grid */}
                {showImagePicker && (
                  <div className="mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg">
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Icônes de services</p>
                    <div className="grid grid-cols-5 gap-1.5 mb-3">
                      {SERVICE_ICONS.map(item => (
                        <button
                          key={item.url}
                          type="button"
                          onClick={() => { setCatImageUrl(item.url); setShowImagePicker(false); }}
                          data-testid={`pick-img-${item.name.toLowerCase()}`}
                          title={item.name}
                          className="relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 flex items-center justify-center bg-gray-50 dark:bg-gray-700"
                          style={{
                            borderColor: catImageUrl === item.url ? "#dc2626" : "transparent",
                            boxShadow: catImageUrl === item.url ? "0 0 0 1px #dc2626" : "none",
                          }}
                        >
                          <img src={item.url} alt={item.name} className="w-8 h-8 object-contain" />
                          {catImageUrl === item.url && (
                            <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-600 rounded-full flex items-center justify-center">
                              <Check size={8} className="text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Logos MAWEJA</p>
                    <div className="grid grid-cols-5 gap-1.5 mb-3">
                      {LOGOS.map(item => (
                        <button
                          key={item.url}
                          type="button"
                          onClick={() => { setCatImageUrl(item.url); setShowImagePicker(false); }}
                          data-testid={`pick-img-${item.name.replace(/\s+/g, "-").toLowerCase()}`}
                          title={item.name}
                          className="relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 flex items-center justify-center bg-gray-50 dark:bg-gray-700"
                          style={{
                            borderColor: catImageUrl === item.url ? "#dc2626" : "transparent",
                            boxShadow: catImageUrl === item.url ? "0 0 0 1px #dc2626" : "none",
                          }}
                        >
                          <img src={item.url} alt={item.name} className="w-8 h-8 object-contain" />
                          {catImageUrl === item.url && (
                            <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-600 rounded-full flex items-center justify-center">
                              <Check size={8} className="text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-2 mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowImagePicker(false); setGalleryOpenCat(true); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
                        data-testid="button-cat-gallery"
                      >
                        <GalleryHorizontal size={13} /> Choisir depuis la Galerie
                      </button>
                      {catImageUrl && (
                        <button
                          type="button"
                          onClick={() => { setCatImageUrl(""); setShowImagePicker(false); }}
                          className="py-2 px-3 text-[11px] font-bold text-gray-500 hover:text-red-600 transition-colors border border-gray-200 dark:border-gray-700 rounded-xl"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <GalleryPicker
                  open={galleryOpenCat}
                  onClose={() => setGalleryOpenCat(false)}
                  onSelect={url => setCatImageUrl(url)}
                  filter="image"
                />

                {catImageUrl && (
                  <div className="mt-1">
                    <ImportUrlToGallery url={catImageUrl} onImported={url => setCatImageUrl(url)} size="sm" />
                  </div>
                )}

                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <ImageIcon size={10} /> Laissez sans image pour utiliser l'emoji ci-dessous
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{t.admin.categoryIcon} (emoji si pas d'image)</label>
                <select value={catIcon} onChange={e => setCatIcon(e.target.value)}
                  data-testid="select-cat-icon"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white">
                  {["💼","🏨","🚗","✨","📦","🎉","🔧","🚴","❓","✂️","💅","💆","🧹","🍽️","🛒","🏠","🌟","💡"].map(i => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{t.admin.categoryDesc}</label>
                <textarea value={catDesc} onChange={e => setCatDesc(e.target.value)}
                  data-testid="input-cat-desc"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white h-20 resize-none" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Types de service</label>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-2">
                  Ces types s'afficheront dans le formulaire client pour cette catégorie (ex: "Suite VIP", "Chambre double"...)
                </p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTypeInput}
                    onChange={e => setNewTypeInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addServiceType(); } }}
                    placeholder="Ajouter un type..."
                    data-testid="input-new-type"
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={addServiceType}
                    disabled={!newTypeInput.trim()}
                    data-testid="button-add-type"
                    className="px-3 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {catServiceTypes.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {catServiceTypes.map((st, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-xs font-semibold text-red-700 dark:text-red-300"
                      >
                        {st}
                        <button
                          type="button"
                          onClick={() => removeServiceType(idx)}
                          className="w-4 h-4 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center hover:bg-red-300 dark:hover:bg-red-700"
                          data-testid={`remove-type-${idx}`}
                        >
                          <X size={10} className="text-red-700 dark:text-red-300" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 italic">Aucun type ajouté — le client verra un champ texte libre</p>
                )}
              </div>

              <button onClick={() => {
                if (!catName.trim()) {
                  toast({ title: "Champ requis", description: "Le nom de la catégorie est obligatoire", variant: "destructive" });
                  return;
                }
                if (editingCat) {
                  updateCatMutation.mutate({ id: editingCat.id, data: { name: catName, icon: catIcon, imageUrl: catImageUrl || null, description: catDesc, serviceTypes: catServiceTypes } });
                } else {
                  createCatMutation.mutate({ name: catName, icon: catIcon, imageUrl: catImageUrl || null, description: catDesc, serviceTypes: catServiceTypes });
                }
              }} data-testid="button-save-category"
                className="w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700">
                {editingCat ? t.common.edit : t.common.create}
              </button>
            </div>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6" data-testid="modal-catalog-item">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{editingItem ? t.admin.editCatalogItem : t.admin.addCatalogItem}</h3>
              <button onClick={() => { setShowItemModal(false); setEditingItem(null); resetItemForm(); }} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{t.admin.catalogCategory}</label>
                <select value={itemCategoryId} onChange={e => setItemCategoryId(Number(e.target.value))}
                  data-testid="select-item-category"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white">
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{t.admin.catalogItemName}</label>
                <input type="text" value={itemName} onChange={e => setItemName(e.target.value)}
                  data-testid="input-item-name"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{t.admin.catalogItemDesc}</label>
                <textarea value={itemDesc} onChange={e => setItemDesc(e.target.value)}
                  data-testid="input-item-desc"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white h-16 resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{t.admin.catalogItemImage}</label>
                <div className="flex gap-2">
                  <input type="url" value={itemImage} onChange={e => setItemImage(e.target.value)}
                    data-testid="input-item-image" placeholder="https://..."
                    className="flex-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
                  <button
                    type="button"
                    onClick={() => setGalleryOpenItem(true)}
                    data-testid="button-item-gallery"
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors whitespace-nowrap"
                  >
                    <GalleryHorizontal size={14} /> Galerie
                  </button>
                </div>
                {itemImage && (
                  <div className="mt-2 space-y-1.5">
                    <ImportUrlToGallery url={itemImage} onImported={url => setItemImage(url)} size="md" />
                    <img src={itemImage} alt="preview" className="w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                  </div>
                )}
                <GalleryPicker
                  open={galleryOpenItem}
                  onClose={() => setGalleryOpenItem(false)}
                  onSelect={url => setItemImage(url)}
                  filter="image"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{t.admin.catalogItemPrice}</label>
                <input type="text" value={itemPrice} onChange={e => setItemPrice(e.target.value)}
                  data-testid="input-item-price" placeholder="$25 - $50"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
              </div>
              <button onClick={() => {
                if (!itemName.trim()) {
                  toast({ title: "Champ requis", description: "Le nom de l'article est obligatoire", variant: "destructive" });
                  return;
                }
                if (!itemCategoryId) {
                  toast({ title: "Champ requis", description: "Sélectionnez une catégorie", variant: "destructive" });
                  return;
                }
                const data = { name: itemName, description: itemDesc, imageUrl: itemImage || null, price: itemPrice || null, categoryId: itemCategoryId, isActive: true };
                if (editingItem) {
                  updateItemMutation.mutate({ id: editingItem.id, data });
                } else {
                  createItemMutation.mutate(data);
                }
              }} data-testid="button-save-catalog-item"
                className="w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700">
                {editingItem ? t.common.edit : t.common.create}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Médiathèque ─────────────────────────────────────────────── */}
      {tab === "media" && (
        <MediaLibrary
          categories={categories}
          copiedUrl={copiedUrl}
          setCopiedUrl={setCopiedUrl}
        />
      )}
    </AdminLayout>
  );
}
