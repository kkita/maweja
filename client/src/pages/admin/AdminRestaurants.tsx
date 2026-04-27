import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { Store, Star, Clock, Image, Pencil, Plus, Trash2, ChevronDown, ChevronUp, GripVertical, ArrowUp, ArrowDown, Save, Loader2, Upload, Video } from "lucide-react";
import { KPICard, KPIGrid, AdminSearchInput, EmptyState, AdminBtn } from "../../components/admin/AdminUI";
import { tints, palette, brand } from "../../design-system/tokens";
import { formatPrice } from "../../lib/utils";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useState, useRef, useCallback } from "react";
import type { Restaurant } from "@shared/schema";
import AddRestaurantModal from "../../components/admin/restaurants/AddRestaurantModal";
import EditRestaurantModal from "../../components/admin/restaurants/EditRestaurantModal";
import DeleteRestaurantModal from "../../components/admin/restaurants/DeleteRestaurantModal";
import EditMediaModal from "../../components/admin/restaurants/EditMediaModal";
import MenuSection from "../../components/admin/restaurants/MenuSection";

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
      toast({ title: storeType === "boutique" ? "Ordre des boutiques sauvegardé !" : "Ordre des restaurants sauvegardé !" });
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
      <KPIGrid cols={3} className="mb-6">
        <KPICard
          label={storeType === "boutique" ? "Total boutiques" : "Total restaurants"}
          value={restaurants.length}
          icon={Store}
          iconColor={brand[500]}
          iconBg={tints.brand(0.08)}
        />
        <KPICard
          label="Note moyenne"
          value={restaurants.length > 0 ? parseFloat((restaurants.reduce((s, r) => s + r.rating, 0) / restaurants.length).toFixed(1)) : 0}
          icon={Star}
          iconColor={palette.semantic.warning}
          iconBg={tints.gold(0.08)}
        />
        <KPICard
          label="Actifs"
          value={restaurants.filter(r => r.isActive).length}
          icon={Clock}
          iconColor={palette.semantic.success}
          iconBg={tints.success(0.08)}
        />
      </KPIGrid>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <h3 className="font-bold text-zinc-900 dark:text-white whitespace-nowrap">{storeType === "boutique" ? "Toutes les boutiques" : "Tous les restaurants"}</h3>
              <AdminSearchInput
                value={search}
                onChange={setSearch}
                placeholder="Rechercher..."
                className="flex-1 max-w-xs"
              />
            </div>
            <AdminBtn
              variant="primary"
              icon={Plus}
              onClick={() => setAddingRestaurant(true)}
              testId="button-add-restaurant"
            >
              {storeType === "boutique" ? "Ajouter une boutique" : "Ajouter un restaurant"}
            </AdminBtn>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
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
          <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
                <div className="w-16 h-16 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-40" />
                  <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Store}
            title={search ? (storeType === "boutique" ? "Aucune boutique correspondante" : "Aucun restaurant correspondant") : (storeType === "boutique" ? "Aucune boutique" : "Aucun restaurant")}
            description={search ? "Modifiez votre recherche pour trouver un résultat." : undefined}
            action={!search ? <button onClick={() => setAddingRestaurant(true)} className="px-4 py-2 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors">{storeType === "boutique" ? "Ajouter la première boutique" : "Ajouter le premier restaurant"}</button> : undefined}
          />
        ) : (
          <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
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
                <div className="p-4 flex items-center gap-3 flex-wrap min-w-0">
                  {canDrag && (
                    <div className="flex flex-col items-center gap-0.5 text-zinc-300 dark:text-zinc-600 flex-shrink-0 select-none">
                      <GripVertical size={16} />
                      <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 tabular-nums">{idx + 1}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                    {r.logoUrl ? (
                      <img src={r.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-zinc-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center border border-red-100">
                        <span className="text-red-600 font-black text-sm">{r.name.charAt(0)}</span>
                      </div>
                    )}
                    <img src={r.image} alt={r.name} className="w-14 h-14 rounded-xl object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                    <p className="font-semibold text-zinc-900 dark:text-white truncate">{r.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{r.cuisine} · {r.address}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-xs text-red-600 font-bold">{formatPrice(r.deliveryFee)}</span>
                      <span className="text-zinc-300">·</span>
                      <span className="text-xs text-zinc-500 flex items-center gap-0.5"><Star size={10} className="text-yellow-500 fill-yellow-500" /> {r.rating}</span>
                      <span className="text-zinc-300">·</span>
                      <span className="text-xs text-zinc-500 flex items-center gap-0.5"><Clock size={10} /> {r.deliveryTime}</span>
                      {r.prepTime && <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">{r.prepTime}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {canDrag && (
                      <>
                        <button onClick={e => { e.stopPropagation(); if (idx > 0) moveRestaurant(idx, idx - 1); }}
                          disabled={idx === 0}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20 transition-colors"
                          data-testid={`button-moveup-${r.id}`}>
                          <ArrowUp size={13} className="text-zinc-500" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); if (idx < filtered.length - 1) moveRestaurant(idx, idx + 1); }}
                          disabled={idx === filtered.length - 1}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20 transition-colors"
                          data-testid={`button-movedown-${r.id}`}>
                          <ArrowDown size={13} className="text-zinc-500" />
                        </button>
                      </>
                    )}
                    <button onClick={e => { e.stopPropagation(); toggleActive.mutate(r); }}
                      data-testid={`toggle-active-${r.id}`}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${r.isActive ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700" : "bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700"}`}>
                      {r.isActive ? "Actif" : "Inactif"}
                    </button>
                    <button onClick={e => { e.stopPropagation(); setEditingInfo(r); }} data-testid={`edit-info-${r.id}`}
                      className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors text-xs font-medium" title="Modifier les infos">
                      <Pencil size={12} /> <span className="hidden sm:inline">Infos</span>
                    </button>
                    <button onClick={e => { e.stopPropagation(); setEditingMedia(r); }} data-testid={`edit-media-${r.id}`}
                      className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition-colors text-xs font-semibold" title="Modifier logo, image et vidéo">
                      <Image size={12} /> <span className="hidden sm:inline">Médias</span>
                      {(r.logoUrl || r.coverVideoUrl) && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); setDeletingRestaurant(r); }} data-testid={`delete-restaurant-${r.id}`}
                      className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors" title="Supprimer">
                      <Trash2 size={13} />
                    </button>
                    <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} data-testid={`expand-${r.id}`}
                      className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors">
                      {expandedId === r.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>

                {expandedId === r.id && (
                  <div className="px-4 pb-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800" data-testid={`restaurant-details-${r.id}`}>
                    <div className="flex items-start gap-4 py-3 border-b border-zinc-100 dark:border-zinc-700 mb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Logo</p>
                          {r.logoUrl ? (
                            <img src={r.logoUrl} alt="logo" className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow" data-testid={`preview-logo-${r.id}`} />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center" data-testid={`no-logo-${r.id}`}>
                              <span className="text-[10px] text-zinc-400 text-center leading-tight">Pas de<br/>logo</span>
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Couverture</p>
                          <img src={r.image} alt="cover" className="w-24 h-14 rounded-xl object-cover border-2 border-white shadow" data-testid={`preview-cover-${r.id}`} />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Vidéo</p>
                          {r.coverVideoUrl ? (
                            <div className="w-24 h-14 rounded-xl overflow-hidden border-2 border-white shadow relative" data-testid={`preview-video-${r.id}`}>
                              <video src={r.coverVideoUrl} className="w-full h-full object-cover" muted playsInline />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <Video size={16} className="text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-24 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1" data-testid={`no-video-${r.id}`}>
                              <Video size={14} className="text-zinc-400" />
                              <span className="text-[9px] text-zinc-400">Pas de vidéo</span>
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
                      <div><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Email</p><p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{r.email || "—"}</p></div>
                      <div><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Manager</p><p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{r.managerName || "—"}</p></div>
                      <div><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Telephone</p><p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{r.phone || "—"}</p></div>
                      <div><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Horaires</p><p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{r.openingHours || "—"}</p></div>
                    </div>
                    <MenuSection restaurant={r} storeType={storeType} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {addingRestaurant && <AddRestaurantModal onClose={() => setAddingRestaurant(false)} storeType={storeType} />}
      {editingMedia && <EditMediaModal restaurant={editingMedia} onClose={() => setEditingMedia(null)} />}
      {editingInfo && <EditRestaurantModal restaurant={editingInfo} onClose={() => setEditingInfo(null)} storeType={storeType} />}
      {deletingRestaurant && <DeleteRestaurantModal restaurant={deletingRestaurant} onClose={() => setDeletingRestaurant(null)} storeType={storeType} />}
    </AdminLayout>
  );
}
