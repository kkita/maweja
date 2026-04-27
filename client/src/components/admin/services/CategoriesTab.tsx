import { useState, useRef, useCallback } from "react";
import { Plus, Loader2, Save, GripVertical, ArrowUp, ArrowDown, Edit2, Trash2 } from "lucide-react";
import type { ServiceCategory } from "@shared/schema";
import { apiRequest, queryClient } from "../../../lib/queryClient";
import { useToast } from "../../../hooks/use-toast";
import type { Translations } from "../../../lib/i18n";

export default function CategoriesTab({ categories, t, onAdd, onEdit, onDelete }: {
  categories: ServiceCategory[];
  t: Translations;
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
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-1">
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
            className={`bg-white dark:bg-zinc-900 rounded-xl border p-3 flex items-center gap-3 transition-all cursor-grab active:cursor-grabbing select-none ${
              dragIdx === idx ? "opacity-40 scale-95" : ""
            } ${overIdx === idx && dragIdx !== idx ? "border-red-400 dark:border-red-600 shadow-lg shadow-red-100 dark:shadow-red-900/30" : "border-zinc-100 dark:border-zinc-800"}`}
          >
            <div className="flex flex-col items-center gap-0.5 text-zinc-300 dark:text-zinc-600 flex-shrink-0">
              <GripVertical size={18} />
              <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 tabular-nums">{idx + 1}</span>
            </div>

            {cat.imageUrl ? (
              <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 flex items-center justify-center text-lg flex-shrink-0">{cat.icon}</div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate">{cat.name}</h3>
              <p className="text-[11px] text-zinc-500 truncate">{cat.description}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${cat.isActive ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                {cat.isActive ? t.common.active : t.common.inactive}
              </span>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={(e) => { e.stopPropagation(); if (idx > 0) moveCat(idx, idx - 1); }}
                disabled={idx === 0}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20 transition-colors"
                data-testid={`button-moveup-cat-${cat.id}`}>
                <ArrowUp size={13} className="text-zinc-500" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); if (idx < displayCats.length - 1) moveCat(idx, idx + 1); }}
                disabled={idx === displayCats.length - 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20 transition-colors"
                data-testid={`button-movedown-cat-${cat.id}`}>
                <ArrowDown size={13} className="text-zinc-500" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onEdit(cat); }}
                className="w-7 h-7 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700"
                data-testid={`button-edit-cat-${cat.id}`}>
                <Edit2 size={13} className="text-zinc-500 dark:text-zinc-400" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(cat.id); }}
                className="w-7 h-7 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950"
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
