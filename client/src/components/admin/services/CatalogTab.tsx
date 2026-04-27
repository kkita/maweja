import { Plus, Image as ImageIcon, Edit2, Trash2 } from "lucide-react";
import type { ServiceCategory, ServiceCatalogItem } from "@shared/schema";
import { AdminBtn, EmptyState } from "../AdminUI";
import type { Translations } from "../../../lib/i18n";

export default function CatalogTab({
  categories, items, catalogCatFilter, setCatalogCatFilter, t, onAdd, onEdit, onDelete,
}: {
  categories: ServiceCategory[];
  items: ServiceCatalogItem[];
  catalogCatFilter: number | "all";
  setCatalogCatFilter: (v: number | "all") => void;
  t: Translations;
  onAdd: () => void;
  onEdit: (item: ServiceCatalogItem) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <>
      <div className="flex flex-wrap gap-3 mb-4">
        <AdminBtn
          variant="primary"
          icon={Plus}
          onClick={onAdd}
          testId="button-add-catalog-item"
        >
          {t.admin.addCatalogItem}
        </AdminBtn>
        <select value={String(catalogCatFilter)} onChange={e => setCatalogCatFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
          data-testid="select-catalog-category"
          className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30">
          <option value="all">{t.common.all} {t.admin.categories}</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <EmptyState icon={ImageIcon} title={t.admin.noCatalogItems} description="Ajoutez votre premier article au catalogue." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => {
            const cat = categories.find(c => c.id === item.categoryId);
            return (
              <div key={item.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden hover:shadow-md transition-shadow" data-testid={`catalog-item-${item.id}`}>
                <div className="relative h-40">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                    {cat?.name || "—"}
                  </span>
                  {!item.isActive && (
                    <span className="absolute top-2 right-2 bg-zinc-800/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg">{t.common.inactive}</span>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{item.name}</h4>
                  {item.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{item.description}</p>}
                  {item.price && <p className="text-xs font-semibold text-red-600 mt-1">{item.price}</p>}
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => onEdit(item)}
                      className="flex-1 px-2 py-1.5 bg-zinc-50 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100" data-testid={`button-edit-item-${item.id}`}>
                      <Edit2 size={12} className="inline mr-1" />{t.common.edit}
                    </button>
                    <button onClick={() => onDelete(item.id)}
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
  );
}
