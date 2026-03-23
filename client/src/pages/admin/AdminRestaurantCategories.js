import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../../lib/queryClient";
import AdminSidebar from "../../components/AdminSidebar";
import { Plus, Pencil, Trash2, GripVertical, X } from "lucide-react";
const EMOJI_SUGGESTIONS = {
    pizza: ["🍕", "🧀", "🍽️"],
    burger: ["🍔", "🍟", "🥤"],
    sushi: ["🍣", "🍱", "🥢"],
    japonais: ["🍣", "🍱", "🇯🇵"],
    congolais: ["🇨🇩", "🍲", "🫕"],
    fast: ["🍔", "🌭", "🍟"],
    sandwich: ["🥪", "🥖", "🥙"],
    café: ["☕", "🧁", "🥐"],
    brunch: ["☕", "🥞", "🍳"],
    grillade: ["🔥", "🥩", "🍖"],
    libanais: ["🧆", "🥙", "🇱🇧"],
    chinois: ["🥡", "🥟", "🇨🇳"],
    indien: ["🍛", "🫓", "🇮🇳"],
    mexicain: ["🌮", "🌯", "🇲🇽"],
    italien: ["🍝", "🍕", "🇮🇹"],
    fruit: ["🍎", "🍉", "🥝"],
    dessert: ["🍰", "🧁", "🍩"],
    glace: ["🍦", "🍨", "🧊"],
    boulangerie: ["🥖", "🥐", "🍞"],
    pâtisserie: ["🎂", "🍰", "🧁"],
    poulet: ["🍗", "🐔", "🍖"],
    poisson: ["🐟", "🍣", "🦐"],
    viande: ["🥩", "🍖", "🥓"],
    boisson: ["🥤", "🍹", "🧃"],
    gastronomique: ["🍷", "🥂", "🍽️"],
    hôtel: ["🏨", "🛏️", "🌟"],
    transport: ["🚗", "🚕", "🚙"],
    livraison: ["🛵", "📦", "🚚"],
    salade: ["🥗", "🥬", "🥒"],
    végétarien: ["🥗", "🌿", "🥬"],
    africain: ["🌍", "🍲", "🫕"],
    bio: ["🌿", "🍃", "🥦"],
    bar: ["🍻", "🍺", "🥂"],
};
const ALL_EMOJIS = [
    "🍕", "🍔", "🍟", "🌭", "🍿", "🧂", "🥓", "🥚", "🍳", "🧇",
    "🥞", "🧈", "🍞", "🥐", "🥖", "🧀", "🥗", "🥙", "🥪", "🌮",
    "🌯", "🫔", "🥘", "🍲", "🫕", "🥣", "🍜", "🍝", "🍣", "🍱",
    "🥟", "🍤", "🍗", "🍖", "🥩", "🧆", "🍛", "🍚", "🍙", "🍘",
    "🍰", "🎂", "🧁", "🍩", "🍪", "🍫", "🍬", "🍭", "🍮", "🍦",
    "🍨", "☕", "🍵", "🥤", "🧃", "🧋", "🍹", "🍺", "🍻", "🥂",
    "🍷", "🍽️", "🥄", "🔥", "⭐", "🌟", "💎", "🏆", "🎯", "❤️",
    "🇨🇩", "🇫🇷", "🇮🇹", "🇯🇵", "🇨🇳", "🇮🇳", "🇱🇧", "🇲🇽", "🌍", "✦",
    "🛵", "📦", "🚚", "🚗", "🏨", "🐟", "🦐", "🌿", "🥬", "🥦",
];
function getAutoEmojis(name) {
    const lower = name.toLowerCase();
    const matches = [];
    for (const [key, emojis] of Object.entries(EMOJI_SUGGESTIONS)) {
        if (lower.includes(key))
            matches.push(...emojis);
    }
    return [...new Set(matches)].slice(0, 6);
}
export default function AdminRestaurantCategories() {
    const { data: categories = [], isLoading } = useQuery({
        queryKey: ["/api/restaurant-categories"],
    });
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [name, setName] = useState("");
    const [emoji, setEmoji] = useState("🍽️");
    const [sortOrder, setSortOrder] = useState(0);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const autoEmojis = getAutoEmojis(name);
    const resetForm = () => {
        setName("");
        setEmoji("🍽️");
        setSortOrder(0);
        setEditing(null);
        setShowForm(false);
        setShowEmojiPicker(false);
    };
    const openEdit = (cat) => {
        setEditing(cat);
        setName(cat.name);
        setEmoji(cat.emoji);
        setSortOrder(cat.sortOrder);
        setShowForm(true);
    };
    const saveMutation = useMutation({
        mutationFn: async () => {
            if (editing) {
                await apiRequest(`/api/restaurant-categories/${editing.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, emoji, sortOrder }),
                });
            }
            else {
                await apiRequest("/api/restaurant-categories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, emoji, sortOrder }),
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/restaurant-categories"] });
            resetForm();
        },
    });
    const toggleMutation = useMutation({
        mutationFn: async (cat) => {
            await apiRequest(`/api/restaurant-categories/${cat.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !cat.isActive }),
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/restaurant-categories"] }),
    });
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await apiRequest(`/api/restaurant-categories/${id}`, { method: "DELETE" });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/restaurant-categories"] }),
    });
    return (_jsxs("div", { className: "flex min-h-screen bg-gray-50 dark:bg-[#0d0d0d]", children: [_jsx(AdminSidebar, {}), _jsx("main", { className: "flex-1 ml-64 p-8", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-black text-gray-900 dark:text-white", children: "Cat\u00E9gories de restaurants" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: "G\u00E9rez les filtres de cat\u00E9gories affich\u00E9s sur l'application client" })] }), _jsxs("button", { onClick: () => { resetForm(); setShowForm(true); }, className: "flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors", "data-testid": "button-add-restaurant-category", children: [_jsx(Plus, { size: 16 }), " Ajouter"] })] }), showForm && (_jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-gray-800", style: { boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "font-bold text-gray-900 dark:text-white", children: editing ? "Modifier la catégorie" : "Nouvelle catégorie" }), _jsx("button", { onClick: resetForm, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { size: 18 }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-4", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5", children: "Nom de la cat\u00E9gorie" }), _jsx("input", { type: "text", value: name, onChange: e => setName(e.target.value), placeholder: "Ex: Pizza, Burgers, Congolais...", className: "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none", "data-testid": "input-category-name" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5", children: "Ordre" }), _jsx("input", { type: "number", value: sortOrder, onChange: e => setSortOrder(Number(e.target.value)), className: "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none", "data-testid": "input-category-sort" })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5", children: "Emoji" }), _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "w-14 h-14 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-red-400 transition-colors", onClick: () => setShowEmojiPicker(!showEmojiPicker), "data-testid": "button-emoji-picker", children: _jsx("span", { style: { fontSize: 28 }, children: emoji }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1.5", children: "Suggestions auto :" }), _jsx("div", { className: "flex gap-1.5 flex-wrap", children: autoEmojis.length > 0 ? autoEmojis.map(e => (_jsx("button", { onClick: () => setEmoji(e), className: `w-9 h-9 rounded-xl flex items-center justify-center transition-all ${emoji === e ? "bg-red-100 dark:bg-red-950 ring-2 ring-red-400" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"}`, "data-testid": `emoji-suggestion-${e}`, children: _jsx("span", { style: { fontSize: 18 }, children: e }) }, e))) : (_jsx("span", { className: "text-xs text-gray-400 italic", children: "Tapez un nom pour voir des suggestions" })) })] })] }), showEmojiPicker && (_jsxs("div", { className: "bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 border border-gray-200 dark:border-gray-700", children: [_jsx("p", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2", children: "Tous les emojis" }), _jsx("div", { className: "flex flex-wrap gap-1", children: ALL_EMOJIS.map(e => (_jsx("button", { onClick: () => { setEmoji(e); setShowEmojiPicker(false); }, className: `w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-all ${emoji === e ? "bg-red-100 dark:bg-red-950 ring-2 ring-red-400" : ""}`, "data-testid": `emoji-pick-${e}`, children: _jsx("span", { style: { fontSize: 18 }, children: e }) }, e))) })] }))] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => saveMutation.mutate(), disabled: !name.trim() || saveMutation.isPending, className: "bg-red-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50 transition-colors", "data-testid": "button-save-category", children: saveMutation.isPending ? "Enregistrement..." : editing ? "Modifier" : "Ajouter" }), _jsx("button", { onClick: resetForm, className: "px-6 py-2.5 rounded-xl font-semibold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors", children: "Annuler" })] })] })), isLoading ? (_jsx("div", { className: "space-y-3", children: [1, 2, 3].map(i => (_jsx("div", { className: "bg-white dark:bg-gray-900 rounded-2xl p-4 animate-pulse", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-xl" }), _jsx("div", { className: "flex-1", children: _jsx("div", { className: "h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded-full" }) })] }) }, i))) })) : categories.length === 0 ? (_jsx("div", { className: "bg-white dark:bg-gray-900 rounded-2xl p-10 text-center", style: { boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }, children: _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm", children: "Aucune cat\u00E9gorie de restaurant" }) })) : (_jsx("div", { className: "space-y-2", children: [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)).map(cat => (_jsxs("div", { className: `bg-white dark:bg-gray-900 rounded-2xl px-5 py-4 flex items-center gap-4 border transition-all ${cat.isActive ? "border-gray-100 dark:border-gray-800" : "border-gray-100 dark:border-gray-800 opacity-50"}`, style: { boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }, "data-testid": `restaurant-category-${cat.id}`, children: [_jsx(GripVertical, { size: 16, className: "text-gray-300 dark:text-gray-600 flex-shrink-0" }), _jsx("div", { className: "w-11 h-11 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0", children: _jsx("span", { style: { fontSize: 22 }, children: cat.emoji }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-bold text-gray-900 dark:text-white text-sm", children: cat.name }), _jsxs("p", { className: "text-xs text-gray-400 dark:text-gray-500", children: ["Ordre: ", cat.sortOrder] })] }), _jsxs("label", { className: "relative inline-flex items-center cursor-pointer flex-shrink-0", "data-testid": `toggle-category-${cat.id}`, children: [_jsx("input", { type: "checkbox", checked: cat.isActive, onChange: () => toggleMutation.mutate(cat), className: "sr-only peer" }), _jsx("div", { className: "w-10 h-5 bg-gray-200 dark:bg-gray-700 peer-checked:bg-green-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" })] }), _jsx("button", { onClick: () => openEdit(cat), className: "text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0", "data-testid": `button-edit-category-${cat.id}`, children: _jsx(Pencil, { size: 16 }) }), _jsx("button", { onClick: () => { if (confirm(`Supprimer "${cat.name}" ?`))
                                            deleteMutation.mutate(cat.id); }, className: "text-gray-400 hover:text-red-600 transition-colors flex-shrink-0", "data-testid": `button-delete-category-${cat.id}`, children: _jsx(Trash2, { size: 16 }) })] }, cat.id))) }))] }) })] }));
}
//# sourceMappingURL=AdminRestaurantCategories.js.map