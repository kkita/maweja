import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../../lib/queryClient";
import AdminLayout from "../../components/AdminLayout";
import { Plus, Pencil, Trash2, GripVertical, X, Tag } from "lucide-react";
import { AppSkeleton } from "../../design-system/primitives";
import { EmptyState } from "../../components/admin/AdminUI";

interface BoutiqueCategory {
  id: number;
  name: string;
  emoji: string;
  isActive: boolean;
  sortOrder: number;
}

const EMOJI_SUGGESTIONS: Record<string, string[]> = {
  supermarché: ["🛒", "🏪", "🛍️"],
  supermarket: ["🛒", "🏪", "🛍️"],
  pharmacie: ["💊", "🏥", "💉"],
  cosmétique: ["💄", "💅", "🧴"],
  beauté: ["💄", "💅", "✨"],
  vêtement: ["👕", "👗", "🧥"],
  mode: ["👠", "👜", "🧢"],
  chaussure: ["👟", "👠", "🥿"],
  électronique: ["📱", "💻", "🔌"],
  téléphone: ["📱", "📞", "🔋"],
  informatique: ["💻", "🖥️", "⌨️"],
  librairie: ["📚", "📖", "✏️"],
  jouet: ["🧸", "🎮", "🎲"],
  bébé: ["🍼", "👶", "🧸"],
  maison: ["🏠", "🛋️", "🪴"],
  décoration: ["🖼️", "🕯️", "🪴"],
  bricolage: ["🔧", "🔨", "🪛"],
  sport: ["⚽", "🏋️", "🎾"],
  bijou: ["💍", "📿", "💎"],
  fleur: ["💐", "🌹", "🌸"],
  cadeau: ["🎁", "🎀", "🎊"],
  alimentation: ["🛒", "🥫", "🍞"],
  épicerie: ["🛒", "🧂", "🥫"],
  boulangerie: ["🥖", "🥐", "🍞"],
  pâtisserie: ["🎂", "🍰", "🧁"],
  boisson: ["🥤", "🍹", "🧃"],
  cave: ["🍷", "🍺", "🥂"],
  animalerie: ["🐶", "🐱", "🐾"],
  quincaillerie: ["🔩", "🔧", "🪛"],
  bureau: ["📎", "📐", "🖊️"],
  papeterie: ["📝", "📒", "✂️"],
};

const ALL_EMOJIS = [
  "🛍️", "🛒", "🏪", "🏬", "🏢", "💊", "💄", "👕", "👗", "👠",
  "👟", "👜", "🧢", "📱", "💻", "🖥️", "📚", "📖", "✏️", "🧸",
  "🎮", "🎲", "🍼", "👶", "🏠", "🛋️", "🪴", "🔧", "🔨", "🪛",
  "⚽", "🏋️", "🎾", "💍", "📿", "💎", "💐", "🌹", "🌸", "🎁",
  "🎀", "🥫", "🍞", "🥖", "🥐", "🧁", "🥤", "🍹", "🍷", "🍺",
  "🐶", "🐱", "🐾", "🔩", "📎", "📐", "🖊️", "📝", "📒", "✂️",
  "🧴", "💅", "✨", "🔋", "🔌", "⌨️", "🖼️", "🕯️", "🎊", "🧂",
  "🧃", "🥂", "🪛", "💉", "🏥", "🧥", "🥿", "📞", "🎯", "❤️",
  "⭐", "🌟", "🔥", "🇨🇩", "🌍", "✦",
];

function getAutoEmojis(name: string): string[] {
  const lower = name.toLowerCase();
  const matches: string[] = [];
  for (const [key, emojis] of Object.entries(EMOJI_SUGGESTIONS)) {
    if (lower.includes(key)) matches.push(...emojis);
  }
  return [...new Set(matches)].slice(0, 6);
}

export default function AdminBoutiqueCategories() {
  const { data: categories = [], isLoading } = useQuery<BoutiqueCategory[]>({
    queryKey: ["/api/boutique-categories"],
  });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BoutiqueCategory | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🛍️");
  const [sortOrder, setSortOrder] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const autoEmojis = getAutoEmojis(name);

  const resetForm = () => {
    setName(""); setEmoji("🛍️"); setSortOrder(0); setEditing(null); setShowForm(false); setShowEmojiPicker(false);
  };

  const openEdit = (cat: BoutiqueCategory) => {
    setEditing(cat); setName(cat.name); setEmoji(cat.emoji); setSortOrder(cat.sortOrder); setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        await apiRequest(`/api/boutique-categories/${editing.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, emoji, sortOrder }),
        });
      } else {
        await apiRequest("/api/boutique-categories", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, emoji, sortOrder }),
        });
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/boutique-categories"] }); resetForm(); },
  });

  const toggleMutation = useMutation({
    mutationFn: async (cat: BoutiqueCategory) => {
      await apiRequest(`/api/boutique-categories/${cat.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/boutique-categories"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/boutique-categories/${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/boutique-categories"] }),
  });

  return (
    <AdminLayout title="Catégories Boutiques" subtitle="Gérez les filtres de catégories affichés pour les boutiques">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {categories.length} catégorie{categories.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
            data-testid="button-add-boutique-category"
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-display-panel rounded-2xl p-6 mb-6 border border-gray-100 dark:border-gray-800/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 dark:text-white">
                {editing ? "Modifier la catégorie" : "Nouvelle catégorie"}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Nom de la catégorie</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ex: Supermarché, Pharmacie, Mode..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none"
                  data-testid="input-boutique-category-name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Ordre</label>
                <input
                  type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none"
                  data-testid="input-boutique-category-sort"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Emoji</label>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-14 h-14 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-red-400 transition-colors"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  data-testid="button-boutique-emoji-picker"
                >
                  <span style={{ fontSize: 28 }}>{emoji}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Suggestions auto :</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {autoEmojis.length > 0 ? autoEmojis.map(e => (
                      <button key={e} onClick={() => setEmoji(e)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${emoji === e ? "bg-red-100 dark:bg-red-950 ring-2 ring-red-400" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                        <span style={{ fontSize: 18 }}>{e}</span>
                      </button>
                    )) : (
                      <span className="text-xs text-gray-400 italic">Tapez un nom pour voir des suggestions</span>
                    )}
                  </div>
                </div>
              </div>
              {showEmojiPicker && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Tous les emojis</p>
                  <div className="flex flex-wrap gap-1">
                    {ALL_EMOJIS.map(e => (
                      <button key={e} onClick={() => { setEmoji(e); setShowEmojiPicker(false); }}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-all ${emoji === e ? "bg-red-100 dark:bg-red-950 ring-2 ring-red-400" : ""}`}>
                        <span style={{ fontSize: 18 }}>{e}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => saveMutation.mutate()} disabled={!name.trim() || saveMutation.isPending}
                className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                data-testid="button-save-boutique-category">
                {saveMutation.isPending ? "Enregistrement..." : editing ? "Modifier" : "Ajouter"}
              </button>
              <button onClick={resetForm}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Annuler
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-display-panel rounded-2xl p-4">
                <div className="flex items-center gap-4">
                  <AppSkeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1"><AppSkeleton className="h-4 w-32 rounded-full" /></div>
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white dark:bg-display-panel rounded-2xl border border-gray-100 dark:border-gray-800/50">
            <EmptyState
              icon={Tag}
              title="Aucune catégorie de boutique"
              description="Ajoutez des catégories comme Supermarché, Pharmacie, Mode..."
            />
          </div>
        ) : (
          <div className="space-y-2">
            {[...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)).map(cat => (
              <div key={cat.id}
                className={`bg-white dark:bg-display-panel rounded-2xl px-5 py-4 flex items-center gap-4 border transition-all ${cat.isActive ? "border-gray-100 dark:border-gray-800/50" : "border-gray-100 dark:border-gray-800/50 opacity-50"}`}
                data-testid={`boutique-category-${cat.id}`}>
                <GripVertical size={16} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <span style={{ fontSize: 22 }}>{cat.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{cat.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Ordre: {cat.sortOrder}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0" data-testid={`toggle-boutique-category-${cat.id}`}>
                  <input type="checkbox" checked={cat.isActive} onChange={() => toggleMutation.mutate(cat)} className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 peer-checked:bg-green-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                </label>
                <button onClick={() => openEdit(cat)} className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0" data-testid={`button-edit-boutique-category-${cat.id}`}>
                  <Pencil size={16} />
                </button>
                <button onClick={() => { if (confirm(`Supprimer "${cat.name}" ?`)) deleteMutation.mutate(cat.id); }}
                  className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0" data-testid={`button-delete-boutique-category-${cat.id}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
