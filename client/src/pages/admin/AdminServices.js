import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useI18n } from "../../lib/i18n";
import { Briefcase, Plus, Search, Loader2, Eye, Trash2, Edit2, X, Image, Copy, Check, ImageIcon, GalleryHorizontal, GripVertical, ArrowUp, ArrowDown, Save } from "lucide-react";
import GalleryPicker from "../../components/GalleryPicker";
import ImportUrlToGallery from "../../components/ImportUrlToGallery";
/* ── Static media assets ───────────────────────────────────────────────── */
const SERVICE_ICONS = [
    { name: "Carburant", url: "/services/carburant.png" },
    { name: "Coiffure", url: "/services/coiffure.png" },
    { name: "Conciergerie", url: "/services/conciergerie.png" },
    { name: "Domicile", url: "/services/domicile.png" },
    { name: "Esthétique", url: "/services/esthetique.png" },
    { name: "Événementiel", url: "/services/evenementiel.png" },
    { name: "Hôtellerie", url: "/services/hotellerie.png" },
    { name: "Logistique", url: "/services/logistique.png" },
    { name: "Manucure", url: "/services/manucure.png" },
    { name: "Massage", url: "/services/massage.png" },
    { name: "Professionnel", url: "/services/professionnel.png" },
    { name: "Transport", url: "/services/transport.png" },
    { name: "Voyage", url: "/services/voyage.png" },
];
const LOGOS = [
    { name: "Logo MAWEJA Rouge", url: "/maweja-logo-red.png" },
    { name: "Icône MAWEJA", url: "/maweja-icon.png" },
    { name: "Logo MAWEJA", url: "/logo.png" },
];
function MediaCard({ name, url, testKey, copiedUrl, onCopy }) {
    return (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group", "data-testid": `media-card-${testKey}`, children: [_jsxs("div", { className: "relative w-full bg-gray-50", style: { paddingBottom: "100%" }, children: [_jsx("img", { src: url, alt: name, className: "absolute inset-0 w-full h-full object-contain p-3", "data-testid": `media-img-${testKey}` }), _jsx("div", { className: "absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center", children: _jsx("button", { onClick: () => onCopy(url), className: "opacity-0 group-hover:opacity-100 transition-all bg-white shadow-lg rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs font-bold text-gray-700", children: copiedUrl === url ? _jsxs(_Fragment, { children: [_jsx(Check, { size: 12, className: "text-green-600" }), " Copi\u00E9"] }) : _jsxs(_Fragment, { children: [_jsx(Copy, { size: 12 }), " Copier URL"] }) }) })] }), _jsxs("div", { className: "p-2.5", children: [_jsx("p", { className: "font-bold text-[11px] text-gray-800 line-clamp-1 mb-1", children: name }), _jsxs("div", { className: "flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1", children: [_jsx("code", { className: "text-[8px] text-gray-400 flex-1 truncate font-mono", children: url }), _jsx("button", { onClick: () => onCopy(url + "_inline"), className: "flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-all hover:bg-gray-200 active:scale-90", children: copiedUrl === url + "_inline" ? (_jsx(Check, { size: 10, className: "text-green-600" })) : (_jsx(Copy, { size: 10, className: "text-gray-400" })) })] })] })] }));
}
function MediaLibrary({ categories, copiedUrl, setCopiedUrl }) {
    const catImages = categories.filter(c => c.imageUrl);
    const totalImages = SERVICE_ICONS.length + LOGOS.length + catImages.length;
    const copy = (url) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopiedUrl(url);
            setTimeout(() => setCopiedUrl(null), 2000);
        });
    };
    const allItems = [
        ...SERVICE_ICONS,
        ...LOGOS,
        ...catImages.map(c => ({ name: c.name, url: c.imageUrl })),
    ];
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-base font-bold text-gray-900", children: "M\u00E9diath\u00E8que" }), _jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: "Survolez une image et cliquez pour copier son URL. Utilisez-la lors de la cr\u00E9ation de services ou cat\u00E9gories." })] }), _jsxs("span", { className: "text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full", children: [totalImages, " images"] })] }), _jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("div", { className: "w-1 h-5 bg-red-600 rounded-full" }), _jsx("h4", { className: "font-bold text-sm text-gray-800", children: "Ic\u00F4nes de services" }), _jsxs("span", { className: "text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full", children: [SERVICE_ICONS.length, " images"] })] }), _jsx("div", { className: "grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3", children: SERVICE_ICONS.map(item => (_jsx(MediaCard, { name: item.name, url: item.url, testKey: item.name.toLowerCase(), copiedUrl: copiedUrl, onCopy: copy }, item.url))) })] }), _jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("div", { className: "w-1 h-5 bg-blue-600 rounded-full" }), _jsx("h4", { className: "font-bold text-sm text-gray-800", children: "Logos MAWEJA" }), _jsxs("span", { className: "text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full", children: [LOGOS.length, " images"] })] }), _jsx("div", { className: "grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3", children: LOGOS.map(item => (_jsx(MediaCard, { name: item.name, url: item.url, testKey: item.name.replace(/\s+/g, "-").toLowerCase(), copiedUrl: copiedUrl, onCopy: copy }, item.url))) })] }), catImages.length > 0 && (_jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("div", { className: "w-1 h-5 bg-amber-500 rounded-full" }), _jsx("h4", { className: "font-bold text-sm text-gray-800", children: "Images de cat\u00E9gories (personnalis\u00E9es)" }), _jsxs("span", { className: "text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full", children: [catImages.length, " images"] })] }), _jsx("div", { className: "grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3", children: catImages.map(cat => (_jsx(MediaCard, { name: cat.name, url: cat.imageUrl, testKey: String(cat.id), copiedUrl: copiedUrl, onCopy: copy }, cat.id))) })] })), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-50 flex items-center justify-between", children: [_jsx("h4", { className: "font-bold text-sm text-gray-900", children: "R\u00E9f\u00E9rence rapide \u2014 toutes les URLs" }), _jsx("button", { onClick: () => {
                                    const all = allItems.map(i => `${i.name}: ${i.url}`).join("\n");
                                    navigator.clipboard.writeText(all).then(() => {
                                        setCopiedUrl("__all__");
                                        setTimeout(() => setCopiedUrl(null), 2000);
                                    });
                                }, className: "text-[10px] font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1 transition-all", style: {
                                    background: copiedUrl === "__all__" ? "#dcfce7" : "#f9fafb",
                                    color: copiedUrl === "__all__" ? "#16a34a" : "#6b7280",
                                    borderColor: copiedUrl === "__all__" ? "#86efac" : "#e5e7eb",
                                }, "data-testid": "button-copy-all-urls", children: copiedUrl === "__all__" ? _jsxs(_Fragment, { children: [_jsx(Check, { size: 10 }), " Copi\u00E9"] }) : _jsxs(_Fragment, { children: [_jsx(Copy, { size: 10 }), " Tout copier"] }) })] }), _jsx("div", { className: "divide-y divide-gray-50 max-h-96 overflow-y-auto", children: allItems.map((item, idx) => (_jsxs("div", { className: "flex items-center gap-3 px-5 py-3", children: [_jsx("img", { src: item.url, alt: item.name, className: "w-10 h-10 object-contain rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs font-semibold text-gray-800 truncate", children: item.name }), _jsx("p", { className: "text-[10px] text-gray-400 truncate font-mono", children: item.url })] }), _jsx("button", { onClick: () => copy(item.url + "_ref"), "data-testid": `button-copy-ref-${idx}`, className: "flex-shrink-0 px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1", style: {
                                        background: copiedUrl === item.url + "_ref" ? "#dcfce7" : "#f9fafb",
                                        color: copiedUrl === item.url + "_ref" ? "#16a34a" : "#6b7280",
                                        borderColor: copiedUrl === item.url + "_ref" ? "#86efac" : "#e5e7eb",
                                    }, children: copiedUrl === item.url + "_ref" ? _jsxs(_Fragment, { children: [_jsx(Check, { size: 10 }), " Copi\u00E9"] }) : _jsxs(_Fragment, { children: [_jsx(Copy, { size: 10 }), " Copier"] }) })] }, idx))) })] })] }));
}
function CategoriesTab({ categories, t, onAdd, onEdit, onDelete }) {
    const { toast } = useToast();
    const [orderedCats, setOrderedCats] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [dragIdx, setDragIdx] = useState(null);
    const [overIdx, setOverIdx] = useState(null);
    const [saving, setSaving] = useState(false);
    const touchStartY = useRef(0);
    const touchIdx = useRef(null);
    const sorted = [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const displayCats = hasChanges ? orderedCats : sorted;
    const moveCat = useCallback((fromIndex, toIndex) => {
        const list = [...(hasChanges ? orderedCats : sorted)];
        const [moved] = list.splice(fromIndex, 1);
        list.splice(toIndex, 0, moved);
        setOrderedCats(list);
        setHasChanges(true);
    }, [orderedCats, sorted, hasChanges]);
    const handleDragStart = (idx) => (e) => {
        setDragIdx(idx);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(idx));
    };
    const handleDragOver = (idx) => (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOverIdx(idx);
    };
    const handleDrop = (idx) => (e) => {
        e.preventDefault();
        const from = dragIdx ?? parseInt(e.dataTransfer.getData("text/plain"), 10);
        if (from !== idx)
            moveCat(from, idx);
        setDragIdx(null);
        setOverIdx(null);
    };
    const handleTouchStart = (idx) => (e) => {
        touchStartY.current = e.touches[0].clientY;
        touchIdx.current = idx;
    };
    const handleTouchEnd = (e) => {
        if (touchIdx.current === null)
            return;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;
        const threshold = 40;
        const from = touchIdx.current;
        if (deltaY > threshold && from < displayCats.length - 1) {
            moveCat(from, from + 1);
        }
        else if (deltaY < -threshold && from > 0) {
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
        }
        catch {
            toast({ title: "Erreur", description: "Impossible de sauvegarder l'ordre", variant: "destructive" });
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between mb-4 flex-wrap gap-2", children: [_jsxs("button", { onClick: onAdd, "data-testid": "button-add-category", className: "px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-red-700", children: [_jsx(Plus, { size: 16 }), " ", t.admin.newCategory] }), hasChanges && (_jsxs("button", { onClick: saveOrder, disabled: saving, "data-testid": "button-save-order", className: "px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 animate-pulse", children: [saving ? _jsx(Loader2, { size: 16, className: "animate-spin" }) : _jsx(Save, { size: 16 }), "Sauvegarder l'ordre"] }))] }), _jsxs("p", { className: "text-[11px] text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1", children: [_jsx(GripVertical, { size: 12 }), " Glissez-d\u00E9posez pour r\u00E9ordonner les cat\u00E9gories. L'ordre sera appliqu\u00E9 sur l'application client."] }), _jsx("div", { className: "space-y-2", children: displayCats.map((cat, idx) => (_jsxs("div", { draggable: true, onDragStart: handleDragStart(idx), onDragOver: handleDragOver(idx), onDragEnd: () => { setDragIdx(null); setOverIdx(null); }, onDrop: handleDrop(idx), onTouchStart: handleTouchStart(idx), onTouchEnd: handleTouchEnd, "data-testid": `admin-cat-${cat.id}`, className: `bg-white dark:bg-gray-900 rounded-xl border p-3 flex items-center gap-3 transition-all cursor-grab active:cursor-grabbing select-none ${dragIdx === idx ? "opacity-40 scale-95" : ""} ${overIdx === idx && dragIdx !== idx ? "border-red-400 dark:border-red-600 shadow-lg shadow-red-100 dark:shadow-red-900/30" : "border-gray-100 dark:border-gray-800"}`, children: [_jsxs("div", { className: "flex flex-col items-center gap-0.5 text-gray-300 dark:text-gray-600 flex-shrink-0", children: [_jsx(GripVertical, { size: 18 }), _jsx("span", { className: "text-[9px] font-black text-gray-400 dark:text-gray-500 tabular-nums", children: idx + 1 })] }), cat.imageUrl ? (_jsx("img", { src: cat.imageUrl, alt: cat.name, className: "w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0" })) : (_jsx("div", { className: "w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 flex items-center justify-center text-lg flex-shrink-0", children: cat.icon })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "font-bold text-sm text-gray-900 dark:text-white truncate", children: cat.name }), _jsx("p", { className: "text-[11px] text-gray-500 truncate", children: cat.description }), _jsx("span", { className: `inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${cat.isActive ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`, children: cat.isActive ? t.common.active : t.common.inactive })] }), _jsxs("div", { className: "flex items-center gap-1 flex-shrink-0", children: [_jsx("button", { onClick: (e) => { e.stopPropagation(); if (idx > 0)
                                        moveCat(idx, idx - 1); }, disabled: idx === 0, className: "w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 transition-colors", "data-testid": `button-moveup-cat-${cat.id}`, children: _jsx(ArrowUp, { size: 13, className: "text-gray-500" }) }), _jsx("button", { onClick: (e) => { e.stopPropagation(); if (idx < displayCats.length - 1)
                                        moveCat(idx, idx + 1); }, disabled: idx === displayCats.length - 1, className: "w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 transition-colors", "data-testid": `button-movedown-cat-${cat.id}`, children: _jsx(ArrowDown, { size: 13, className: "text-gray-500" }) }), _jsx("button", { onClick: (e) => { e.stopPropagation(); onEdit(cat); }, className: "w-7 h-7 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700", "data-testid": `button-edit-cat-${cat.id}`, children: _jsx(Edit2, { size: 13, className: "text-gray-500 dark:text-gray-400" }) }), _jsx("button", { onClick: (e) => { e.stopPropagation(); onDelete(cat.id); }, className: "w-7 h-7 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950", "data-testid": `button-delete-cat-${cat.id}`, children: _jsx(Trash2, { size: 13, className: "text-red-500" }) })] })] }, cat.id))) })] }));
}
export default function AdminServices() {
    const { toast } = useToast();
    const { t } = useI18n();
    const [tab, setTab] = useState("requests");
    const [copiedUrl, setCopiedUrl] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNotes, setAdminNotes] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [showCatModal, setShowCatModal] = useState(false);
    const [catName, setCatName] = useState("");
    const [catIcon, setCatIcon] = useState("Briefcase");
    const [catImageUrl, setCatImageUrl] = useState("");
    const [catDesc, setCatDesc] = useState("");
    const [catServiceTypes, setCatServiceTypes] = useState([]);
    const [newTypeInput, setNewTypeInput] = useState("");
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [galleryOpenCat, setGalleryOpenCat] = useState(false);
    const [galleryOpenItem, setGalleryOpenItem] = useState(false);
    const [editingCat, setEditingCat] = useState(null);
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemName, setItemName] = useState("");
    const [itemDesc, setItemDesc] = useState("");
    const [itemImage, setItemImage] = useState("");
    const [itemPrice, setItemPrice] = useState("");
    const [itemCategoryId, setItemCategoryId] = useState(0);
    const [catalogCatFilter, setCatalogCatFilter] = useState("all");
    const statusConfig = {
        pending: { label: t.status.pending, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
        reviewing: { label: t.status.reviewing, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
        accepted: { label: t.status.accepted, color: "text-green-700", bg: "bg-green-50 border-green-200" },
        rejected: { label: t.status.rejected, color: "text-red-700", bg: "bg-red-50 border-red-200" },
        completed: { label: t.status.completed, color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
    };
    const { data: categories = [] } = useQuery({ queryKey: ["/api/service-categories"] });
    const { data: requests = [] } = useQuery({
        queryKey: ["/api/service-requests"],
        queryFn: () => apiRequest("/api/service-requests").then(r => r.json()),
    });
    const { data: catalogItems = [] } = useQuery({
        queryKey: ["/api/service-catalog"],
    });
    const errToast = (err, fallback = "Une erreur est survenue") => toast({ title: "Erreur", description: err?.message || fallback, variant: "destructive" });
    const updateRequestMutation = useMutation({
        mutationFn: ({ id, data }) => apiRequest(`/api/service-requests/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
            setSelectedRequest(null);
            toast({ title: t.common.success, description: t.admin.updateButton });
        },
        onError: (err) => errToast(err, "Impossible de mettre à jour la demande"),
    });
    const addServiceType = () => {
        const val = newTypeInput.trim();
        if (val && !catServiceTypes.includes(val)) {
            setCatServiceTypes([...catServiceTypes, val]);
        }
        setNewTypeInput("");
    };
    const removeServiceType = (idx) => {
        setCatServiceTypes(catServiceTypes.filter((_, i) => i !== idx));
    };
    const createCatMutation = useMutation({
        mutationFn: (data) => apiRequest("/api/service-categories", { method: "POST", body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
            setShowCatModal(false);
            setCatName("");
            setCatIcon("Briefcase");
            setCatImageUrl("");
            setCatDesc("");
            setCatServiceTypes([]);
            setNewTypeInput("");
            toast({ title: t.common.success, description: t.admin.newCategory });
        },
        onError: (err) => errToast(err, "Impossible de créer la catégorie"),
    });
    const updateCatMutation = useMutation({
        mutationFn: ({ id, data }) => apiRequest(`/api/service-categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
            setEditingCat(null);
            toast({ title: t.common.success, description: t.admin.updateButton });
        },
        onError: (err) => errToast(err, "Impossible de modifier la catégorie"),
    });
    const deleteCatMutation = useMutation({
        mutationFn: (id) => apiRequest(`/api/service-categories/${id}`, { method: "DELETE" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
            toast({ title: t.common.success, description: t.common.delete });
        },
        onError: (err) => errToast(err, "Impossible de supprimer la catégorie"),
    });
    const createItemMutation = useMutation({
        mutationFn: (data) => apiRequest("/api/service-catalog", { method: "POST", body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
            setShowItemModal(false);
            resetItemForm();
            toast({ title: t.common.success, description: t.admin.addCatalogItem });
        },
        onError: (err) => errToast(err, "Impossible de créer l'article"),
    });
    const updateItemMutation = useMutation({
        mutationFn: ({ id, data }) => apiRequest(`/api/service-catalog/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
            setEditingItem(null);
            setShowItemModal(false);
            resetItemForm();
            toast({ title: t.common.success, description: t.admin.updateButton });
        },
        onError: (err) => errToast(err, "Impossible de modifier l'article"),
    });
    const deleteItemMutation = useMutation({
        mutationFn: (id) => apiRequest(`/api/service-catalog/${id}`, { method: "DELETE" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
            toast({ title: t.common.success, description: t.common.delete });
        },
        onError: (err) => errToast(err, "Impossible de supprimer l'article"),
    });
    const resetItemForm = () => {
        setItemName("");
        setItemDesc("");
        setItemImage("");
        setItemPrice("");
        setItemCategoryId(0);
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
    return (_jsxs(AdminLayout, { title: t.admin.services, children: [_jsx("div", { className: "mb-6", children: _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", "data-testid": "text-admin-services-title", children: t.admin.manageServiceRequests }) }), _jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6", children: [
                    { label: t.admin.totalRequests, value: stats.total, color: "bg-blue-50 text-blue-700" },
                    { label: t.admin.pending, value: stats.pending, color: "bg-amber-50 text-amber-700" },
                    { label: t.admin.reviewing, value: stats.reviewing, color: "bg-purple-50 text-purple-700" },
                    { label: t.admin.accepted, value: stats.accepted, color: "bg-green-50 text-green-700" },
                ].map((s, i) => (_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4", "data-testid": `stat-card-${i}`, children: [_jsx("p", { className: "text-xs text-gray-500 font-medium", children: s.label }), _jsx("p", { className: `text-2xl font-black mt-1 ${s.color.split(" ")[1]}`, children: s.value })] }, i))) }), _jsxs("div", { className: "flex gap-2 mb-6 flex-wrap", children: [_jsxs("button", { onClick: () => setTab("requests"), className: `px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "requests" ? "bg-red-600 text-white" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`, "data-testid": "tab-requests", children: [t.admin.requests, " (", requests.length, ")"] }), _jsxs("button", { onClick: () => setTab("categories"), className: `px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "categories" ? "bg-red-600 text-white" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`, "data-testid": "tab-categories", children: [t.admin.categories, " (", categories.length, ")"] }), _jsxs("button", { onClick: () => setTab("catalog"), className: `px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "catalog" ? "bg-red-600 text-white" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`, "data-testid": "tab-catalog", children: [t.admin.catalog, " (", catalogItems.length, ")"] }), _jsxs("button", { onClick: () => setTab("media"), className: `px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${tab === "media" ? "bg-red-600 text-white" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`, "data-testid": "tab-media", children: [_jsx(ImageIcon, { size: 14 }), " M\u00E9diath\u00E8que"] })] }), tab === "requests" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex gap-3 mb-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", value: search, onChange: e => setSearch(e.target.value), placeholder: t.admin.searchPlaceholder, "data-testid": "input-search-requests", className: "w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" })] }), _jsxs("select", { value: statusFilter, onChange: e => setStatusFilter(e.target.value), "data-testid": "select-status-filter", className: "px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none", children: [_jsx("option", { value: "all", children: t.admin.allStatuses }), _jsx("option", { value: "pending", children: t.admin.pending }), _jsx("option", { value: "reviewing", children: t.admin.reviewing }), _jsx("option", { value: "accepted", children: t.admin.accepted }), _jsx("option", { value: "rejected", children: t.admin.rejected }), _jsx("option", { value: "completed", children: t.admin.completed })] })] }), filteredRequests.length === 0 ? (_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center", children: [_jsx(Briefcase, { size: 32, className: "text-gray-300 mx-auto mb-3" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: t.admin.noRequests })] })) : (_jsx("div", { className: "space-y-3", children: filteredRequests.map(req => {
                            const status = statusConfig[req.status] || statusConfig.pending;
                            return (_jsx("div", { className: "bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-md transition-shadow", "data-testid": `admin-request-${req.id}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsxs("h3", { className: "font-bold text-sm text-gray-900 dark:text-white", children: ["#", req.id, " - ", req.categoryName] }), _jsx("span", { className: `px-2 py-0.5 rounded-md text-[10px] font-bold border ${status.bg} ${status.color}`, children: status.label })] }), _jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: [req.fullName, " \u2022 ", req.phone] }), _jsx("p", { className: "text-xs text-gray-400 dark:text-gray-500 mt-0.5", children: req.address }), _jsxs("div", { className: "flex items-center gap-3 mt-2 text-[11px] text-gray-500 dark:text-gray-400", children: [req.serviceType && _jsxs("span", { children: [t.services.type, ": ", req.serviceType] }), req.budget && _jsxs("span", { children: [t.admin.budget, ": ", req.budget] }), _jsx("span", { children: req.scheduledType === "asap" ? t.services.asap : `${req.scheduledDate} ${req.scheduledTime}` })] }), req.additionalInfo && _jsxs("p", { className: "text-xs text-gray-500 mt-1 italic", children: ["\"", req.additionalInfo, "\""] })] }), _jsxs("button", { onClick: () => { setSelectedRequest(req); setNewStatus(req.status); setAdminNotes(req.adminNotes || ""); }, "data-testid": `button-manage-${req.id}`, className: "px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 flex items-center gap-1", children: [_jsx(Eye, { size: 14 }), " ", t.admin.manageRequest] })] }) }, req.id));
                        }) }))] })), tab === "categories" && (_jsx(CategoriesTab, { categories: categories, t: t, onAdd: () => { setShowCatModal(true); setCatName(""); setCatIcon("Briefcase"); setCatImageUrl(""); setCatDesc(""); setCatServiceTypes([]); setNewTypeInput(""); }, onEdit: (cat) => { setEditingCat(cat); setCatName(cat.name); setCatIcon(cat.icon); setCatImageUrl(cat.imageUrl || ""); setCatDesc(cat.description); setCatServiceTypes(cat.serviceTypes || []); setNewTypeInput(""); }, onDelete: (id) => { if (confirm(t.common.confirm + "?"))
                    deleteCatMutation.mutate(id); } })), tab === "catalog" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex flex-wrap gap-3 mb-4", children: [_jsxs("button", { onClick: () => {
                                    setShowItemModal(true);
                                    setEditingItem(null);
                                    resetItemForm();
                                    if (categories.length > 0)
                                        setItemCategoryId(categories[0].id);
                                }, "data-testid": "button-add-catalog-item", className: "px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-red-700", children: [_jsx(Plus, { size: 16 }), " ", t.admin.addCatalogItem] }), _jsxs("select", { value: String(catalogCatFilter), onChange: e => setCatalogCatFilter(e.target.value === "all" ? "all" : Number(e.target.value)), "data-testid": "select-catalog-category", className: "px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm", children: [_jsxs("option", { value: "all", children: [t.common.all, " ", t.admin.categories] }), categories.map(cat => _jsx("option", { value: cat.id, children: cat.name }, cat.id))] })] }), filteredCatalog.length === 0 ? (_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center", children: [_jsx(Image, { size: 32, className: "text-gray-300 mx-auto mb-3" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: t.admin.noCatalogItems })] })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: filteredCatalog.map(item => {
                            const cat = categories.find(c => c.id === item.categoryId);
                            return (_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow", "data-testid": `catalog-item-${item.id}`, children: [_jsxs("div", { className: "relative h-40", children: [_jsx("img", { src: item.imageUrl, alt: item.name, className: "w-full h-full object-cover" }), _jsx("span", { className: "absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg", children: cat?.name || "—" }), !item.isActive && (_jsx("span", { className: "absolute top-2 right-2 bg-gray-800/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg", children: t.common.inactive }))] }), _jsxs("div", { className: "p-3", children: [_jsx("h4", { className: "font-bold text-sm text-gray-900 dark:text-white", children: item.name }), item.description && _jsx("p", { className: "text-xs text-gray-500 mt-0.5 line-clamp-2", children: item.description }), item.price && _jsx("p", { className: "text-xs font-semibold text-red-600 mt-1", children: item.price }), _jsxs("div", { className: "flex gap-1 mt-2", children: [_jsxs("button", { onClick: () => {
                                                            setEditingItem(item);
                                                            setItemName(item.name);
                                                            setItemDesc(item.description);
                                                            setItemImage(item.imageUrl);
                                                            setItemPrice(item.price || "");
                                                            setItemCategoryId(item.categoryId);
                                                            setShowItemModal(true);
                                                        }, className: "flex-1 px-2 py-1.5 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100", "data-testid": `button-edit-item-${item.id}`, children: [_jsx(Edit2, { size: 12, className: "inline mr-1" }), t.common.edit] }), _jsx("button", { onClick: () => { if (confirm(t.common.confirm + "?"))
                                                            deleteItemMutation.mutate(item.id); }, className: "px-2 py-1.5 bg-red-50 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-100", "data-testid": `button-delete-item-${item.id}`, children: _jsx(Trash2, { size: 12 }) })] })] })] }, item.id));
                        }) }))] })), selectedRequest && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto", "data-testid": "modal-manage-request", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "font-bold text-lg", children: [t.services.request, " #", selectedRequest.id] }), _jsx("button", { onClick: () => setSelectedRequest(null), className: "w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center", children: _jsx(X, { size: 16 }) })] }), _jsxs("div", { className: "space-y-3 mb-4 bg-gray-50 rounded-xl p-4 text-sm", children: [_jsxs("p", { children: [_jsxs("strong", { children: [t.services.service, ":"] }), " ", selectedRequest.categoryName] }), _jsxs("p", { children: [_jsxs("strong", { children: [t.common.name, ":"] }), " ", selectedRequest.fullName] }), _jsxs("p", { children: [_jsxs("strong", { children: [t.common.phone, ":"] }), " ", selectedRequest.phone] }), _jsxs("p", { children: [_jsxs("strong", { children: [t.common.address, ":"] }), " ", selectedRequest.address] }), selectedRequest.serviceType && _jsxs("p", { children: [_jsxs("strong", { children: [t.services.type, ":"] }), " ", selectedRequest.serviceType] }), selectedRequest.budget && _jsxs("p", { children: [_jsxs("strong", { children: [t.admin.budget, ":"] }), " ", selectedRequest.budget] }), _jsxs("p", { children: [_jsxs("strong", { children: [t.admin.schedule, ":"] }), " ", selectedRequest.scheduledType === "asap" ? t.services.asap : `${selectedRequest.scheduledDate} ${selectedRequest.scheduledTime}`] }), selectedRequest.additionalInfo && _jsxs("p", { children: [_jsxs("strong", { children: [t.admin.info, ":"] }), " ", selectedRequest.additionalInfo] })] }), _jsxs("div", { className: "mb-3", children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.statusLabel }), _jsxs("select", { value: newStatus, onChange: e => setNewStatus(e.target.value), "data-testid": "select-new-status", className: "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white", children: [_jsx("option", { value: "pending", children: t.status.pending }), _jsx("option", { value: "reviewing", children: t.status.reviewing }), _jsx("option", { value: "accepted", children: t.status.accepted }), _jsx("option", { value: "rejected", children: t.status.rejected }), _jsx("option", { value: "completed", children: t.status.completed })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.adminNotes }), _jsx("textarea", { value: adminNotes, onChange: e => setAdminNotes(e.target.value), placeholder: t.admin.adminNotesPlaceholder, "data-testid": "input-admin-notes", className: "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white h-24 resize-none" })] }), _jsx("button", { onClick: () => updateRequestMutation.mutate({ id: selectedRequest.id, data: { status: newStatus, adminNotes } }), disabled: updateRequestMutation.isPending, "data-testid": "button-save-request", className: "w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50", children: updateRequestMutation.isPending ? t.admin.updating : t.admin.updateButton })] }) })), (showCatModal || editingCat) && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]", "data-testid": "modal-category", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "font-bold text-lg", children: editingCat ? t.admin.editCategory : t.admin.newCategory }), _jsx("button", { onClick: () => { setShowCatModal(false); setEditingCat(null); setShowImagePicker(false); }, className: "w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center", children: _jsx(X, { size: 16 }) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.categoryName }), _jsx("input", { type: "text", value: catName, onChange: e => setCatName(e.target.value), "data-testid": "input-cat-name", className: "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: "Image de la cat\u00E9gorie" }), _jsxs("button", { type: "button", onClick: () => setShowImagePicker(v => !v), "data-testid": "button-pick-image", className: "w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-left transition-all hover:border-red-300 hover:bg-red-50 dark:hover:bg-gray-700 active:scale-[0.98]", children: [catImageUrl ? (_jsx("img", { src: catImageUrl, alt: "aper\u00E7u", className: "w-10 h-10 object-contain rounded-lg bg-white border border-gray-100 flex-shrink-0" })) : (_jsx("div", { className: "w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0", children: _jsx(ImageIcon, { size: 18, className: "text-gray-400" }) })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: catImageUrl ? "Image sélectionnée" : "Choisir une image" }), catImageUrl && (_jsx("p", { className: "text-[10px] text-gray-400 truncate font-mono", children: catImageUrl }))] }), _jsx("span", { className: "text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0", children: showImagePicker ? "Fermer" : "Changer" })] }), showImagePicker && (_jsxs("div", { className: "mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg", children: [_jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase mb-2", children: "Ic\u00F4nes de services" }), _jsx("div", { className: "grid grid-cols-5 gap-1.5 mb-3", children: SERVICE_ICONS.map(item => (_jsxs("button", { type: "button", onClick: () => { setCatImageUrl(item.url); setShowImagePicker(false); }, "data-testid": `pick-img-${item.name.toLowerCase()}`, title: item.name, className: "relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 flex items-center justify-center bg-gray-50 dark:bg-gray-700", style: {
                                                            borderColor: catImageUrl === item.url ? "#dc2626" : "transparent",
                                                            boxShadow: catImageUrl === item.url ? "0 0 0 1px #dc2626" : "none",
                                                        }, children: [_jsx("img", { src: item.url, alt: item.name, className: "w-8 h-8 object-contain" }), catImageUrl === item.url && (_jsx("div", { className: "absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-600 rounded-full flex items-center justify-center", children: _jsx(Check, { size: 8, className: "text-white" }) }))] }, item.url))) }), _jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase mb-2", children: "Logos MAWEJA" }), _jsx("div", { className: "grid grid-cols-5 gap-1.5 mb-3", children: LOGOS.map(item => (_jsxs("button", { type: "button", onClick: () => { setCatImageUrl(item.url); setShowImagePicker(false); }, "data-testid": `pick-img-${item.name.replace(/\s+/g, "-").toLowerCase()}`, title: item.name, className: "relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 flex items-center justify-center bg-gray-50 dark:bg-gray-700", style: {
                                                            borderColor: catImageUrl === item.url ? "#dc2626" : "transparent",
                                                            boxShadow: catImageUrl === item.url ? "0 0 0 1px #dc2626" : "none",
                                                        }, children: [_jsx("img", { src: item.url, alt: item.name, className: "w-8 h-8 object-contain" }), catImageUrl === item.url && (_jsx("div", { className: "absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-600 rounded-full flex items-center justify-center", children: _jsx(Check, { size: 8, className: "text-white" }) }))] }, item.url))) }), _jsxs("div", { className: "border-t border-gray-100 dark:border-gray-700 pt-2 mt-1 flex items-center gap-2", children: [_jsxs("button", { type: "button", onClick: () => { setShowImagePicker(false); setGalleryOpenCat(true); }, className: "flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors", "data-testid": "button-cat-gallery", children: [_jsx(GalleryHorizontal, { size: 13 }), " Choisir depuis la Galerie"] }), catImageUrl && (_jsx("button", { type: "button", onClick: () => { setCatImageUrl(""); setShowImagePicker(false); }, className: "py-2 px-3 text-[11px] font-bold text-gray-500 hover:text-red-600 transition-colors border border-gray-200 dark:border-gray-700 rounded-xl", children: "Supprimer" }))] })] })), _jsx(GalleryPicker, { open: galleryOpenCat, onClose: () => setGalleryOpenCat(false), onSelect: url => setCatImageUrl(url), filter: "image" }), catImageUrl && (_jsx("div", { className: "mt-1", children: _jsx(ImportUrlToGallery, { url: catImageUrl, onImported: url => setCatImageUrl(url), size: "sm" }) })), _jsxs("p", { className: "text-[10px] text-gray-400 mt-1 flex items-center gap-1", children: [_jsx(ImageIcon, { size: 10 }), " Laissez sans image pour utiliser l'emoji ci-dessous"] })] }), _jsxs("div", { children: [_jsxs("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: [t.admin.categoryIcon, " (emoji si pas d'image)"] }), _jsx("select", { value: catIcon, onChange: e => setCatIcon(e.target.value), "data-testid": "select-cat-icon", className: "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white", children: ["💼", "🏨", "🚗", "✨", "📦", "🎉", "🔧", "🚴", "❓", "✂️", "💅", "💆", "🧹", "🍽️", "🛒", "🏠", "🌟", "💡"].map(i => (_jsx("option", { value: i, children: i }, i))) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.categoryDesc }), _jsx("textarea", { value: catDesc, onChange: e => setCatDesc(e.target.value), "data-testid": "input-cat-desc", className: "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white h-20 resize-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: "Types de service" }), _jsx("p", { className: "text-[10px] text-gray-400 dark:text-gray-500 mb-2", children: "Ces types s'afficheront dans le formulaire client pour cette cat\u00E9gorie (ex: \"Suite VIP\", \"Chambre double\"...)" }), _jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx("input", { type: "text", value: newTypeInput, onChange: e => setNewTypeInput(e.target.value), onKeyDown: e => { if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        addServiceType();
                                                    } }, placeholder: "Ajouter un type...", "data-testid": "input-new-type", className: "flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" }), _jsx("button", { type: "button", onClick: addServiceType, disabled: !newTypeInput.trim(), "data-testid": "button-add-type", className: "px-3 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed", children: _jsx(Plus, { size: 16 }) })] }), catServiceTypes.length > 0 ? (_jsx("div", { className: "flex flex-wrap gap-1.5", children: catServiceTypes.map((st, idx) => (_jsxs("span", { className: "inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-xs font-semibold text-red-700 dark:text-red-300", children: [st, _jsx("button", { type: "button", onClick: () => removeServiceType(idx), className: "w-4 h-4 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center hover:bg-red-300 dark:hover:bg-red-700", "data-testid": `remove-type-${idx}`, children: _jsx(X, { size: 10, className: "text-red-700 dark:text-red-300" }) })] }, idx))) })) : (_jsx("p", { className: "text-[11px] text-gray-400 italic", children: "Aucun type ajout\u00E9 \u2014 le client verra un champ texte libre" }))] }), _jsx("button", { onClick: () => {
                                        if (!catName.trim()) {
                                            toast({ title: "Champ requis", description: "Le nom de la catégorie est obligatoire", variant: "destructive" });
                                            return;
                                        }
                                        if (editingCat) {
                                            updateCatMutation.mutate({ id: editingCat.id, data: { name: catName, icon: catIcon, imageUrl: catImageUrl || null, description: catDesc, serviceTypes: catServiceTypes } });
                                        }
                                        else {
                                            createCatMutation.mutate({ name: catName, icon: catIcon, imageUrl: catImageUrl || null, description: catDesc, serviceTypes: catServiceTypes });
                                        }
                                    }, "data-testid": "button-save-category", className: "w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700", children: editingCat ? t.common.edit : t.common.create })] })] }) })), showItemModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6", "data-testid": "modal-catalog-item", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "font-bold text-lg", children: editingItem ? t.admin.editCatalogItem : t.admin.addCatalogItem }), _jsx("button", { onClick: () => { setShowItemModal(false); setEditingItem(null); resetItemForm(); }, className: "w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center", children: _jsx(X, { size: 16 }) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.catalogCategory }), _jsx("select", { value: itemCategoryId, onChange: e => setItemCategoryId(Number(e.target.value)), "data-testid": "select-item-category", className: "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white", children: categories.map(cat => _jsx("option", { value: cat.id, children: cat.name }, cat.id)) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.catalogItemName }), _jsx("input", { type: "text", value: itemName, onChange: e => setItemName(e.target.value), "data-testid": "input-item-name", className: "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.catalogItemDesc }), _jsx("textarea", { value: itemDesc, onChange: e => setItemDesc(e.target.value), "data-testid": "input-item-desc", className: "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white h-16 resize-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.catalogItemImage }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "url", value: itemImage, onChange: e => setItemImage(e.target.value), "data-testid": "input-item-image", placeholder: "https://...", className: "flex-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" }), _jsxs("button", { type: "button", onClick: () => setGalleryOpenItem(true), "data-testid": "button-item-gallery", className: "flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors whitespace-nowrap", children: [_jsx(GalleryHorizontal, { size: 14 }), " Galerie"] })] }), itemImage && (_jsxs("div", { className: "mt-2 space-y-1.5", children: [_jsx(ImportUrlToGallery, { url: itemImage, onImported: url => setItemImage(url), size: "md" }), _jsx("img", { src: itemImage, alt: "preview", className: "w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-700" })] })), _jsx(GalleryPicker, { open: galleryOpenItem, onClose: () => setGalleryOpenItem(false), onSelect: url => setItemImage(url), filter: "image" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.catalogItemPrice }), _jsx("input", { type: "text", value: itemPrice, onChange: e => setItemPrice(e.target.value), "data-testid": "input-item-price", placeholder: "$25 - $50", className: "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" })] }), _jsx("button", { onClick: () => {
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
                                        }
                                        else {
                                            createItemMutation.mutate(data);
                                        }
                                    }, "data-testid": "button-save-catalog-item", className: "w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700", children: editingItem ? t.common.edit : t.common.create })] })] }) })), tab === "media" && (_jsx(MediaLibrary, { categories: categories, copiedUrl: copiedUrl, setCopiedUrl: setCopiedUrl }))] }));
}
//# sourceMappingURL=AdminServices.js.map