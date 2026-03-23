import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { Tag, Plus, Trash2, Edit2, X, Check, Loader2, Percent, DollarSign, Truck, Calendar, Hash, ToggleLeft, ToggleRight } from "lucide-react";
export default function AdminPromotions() {
    const { toast } = useToast();
    const { data: promotions = [], isLoading } = useQuery({ queryKey: ["/api/promotions"] });
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("percent");
    const [value, setValue] = useState(10);
    const [minOrder, setMinOrder] = useState(0);
    const [maxUses, setMaxUses] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [expiresAt, setExpiresAt] = useState("");
    const resetForm = () => {
        setCode("");
        setDescription("");
        setType("percent");
        setValue(10);
        setMinOrder(0);
        setMaxUses(0);
        setIsActive(true);
        setExpiresAt("");
        setEditing(null);
    };
    const openCreate = () => { resetForm(); setShowModal(true); };
    const openEdit = (p) => {
        setEditing(p);
        setCode(p.code);
        setDescription(p.description);
        setType(p.type);
        setValue(p.value);
        setMinOrder(p.minOrder);
        setMaxUses(p.maxUses);
        setIsActive(p.isActive);
        setExpiresAt(p.expiresAt ? new Date(p.expiresAt).toISOString().split("T")[0] : "");
        setShowModal(true);
    };
    const saveMutation = useMutation({
        mutationFn: async () => {
            const body = { code, description, type, value, minOrder, maxUses, isActive, expiresAt: expiresAt || null };
            if (editing) {
                await apiRequest(`/api/promotions/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
            }
            else {
                await apiRequest("/api/promotions", { method: "POST", body: JSON.stringify(body) });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
            toast({ title: editing ? "Promotion modifiee" : "Promotion creee" });
            setShowModal(false);
            resetForm();
        },
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
    });
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await apiRequest(`/api/promotions/${id}`, { method: "DELETE" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
            toast({ title: "Promotion supprimee" });
        },
    });
    const toggleMutation = useMutation({
        mutationFn: async ({ id, isActive }) => {
            await apiRequest(`/api/promotions/${id}`, { method: "PATCH", body: JSON.stringify({ isActive }) });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/promotions"] }),
    });
    const typeLabel = (t) => {
        if (t === "percent")
            return "Pourcentage";
        if (t === "fixed")
            return "Montant fixe";
        if (t === "delivery")
            return "Livraison gratuite";
        return t;
    };
    const typeIcon = (t) => {
        if (t === "percent")
            return _jsx(Percent, { size: 14, className: "text-blue-500" });
        if (t === "fixed")
            return _jsx(DollarSign, { size: 14, className: "text-green-500" });
        if (t === "delivery")
            return _jsx(Truck, { size: 14, className: "text-purple-500" });
        return _jsx(Tag, { size: 14 });
    };
    return (_jsx(AdminLayout, { children: _jsxs("div", { className: "p-4 md:p-6 max-w-4xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between gap-3 mb-6", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-xl font-black text-gray-900 dark:text-white flex items-center gap-2", children: [_jsx(Tag, { size: 22, className: "text-red-600" }), "Promotions & Offres"] }), _jsxs("p", { className: "text-sm text-gray-500 mt-1", children: [promotions.length, " code(s) promo"] })] }), _jsxs("button", { onClick: openCreate, "data-testid": "button-create-promo", className: "bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-700 transition-colors", children: [_jsx(Plus, { size: 16 }), " Nouveau code"] })] }), isLoading ? (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx(Loader2, { size: 24, className: "animate-spin text-red-600" }) })) : promotions.length === 0 ? (_jsxs("div", { className: "text-center py-20", children: [_jsx("div", { className: "w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-2xl flex items-center justify-center mx-auto mb-4", children: _jsx(Tag, { size: 28, className: "text-red-300" }) }), _jsx("p", { className: "text-gray-500 font-medium", children: "Aucune promotion" }), _jsx("p", { className: "text-sm text-gray-400 mt-1", children: "Creez votre premier code promo" })] })) : (_jsx("div", { className: "space-y-3", children: promotions.map((p) => (_jsx("div", { "data-testid": `promo-card-${p.id}`, className: `bg-white dark:bg-gray-900 rounded-2xl border ${p.isActive ? "border-gray-100 dark:border-gray-800" : "border-red-200 dark:border-red-900/40 opacity-60"} p-4`, style: { boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }, children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [typeIcon(p.type), _jsx("span", { className: "font-black text-gray-900 dark:text-white text-sm tracking-wider", children: p.code }), !p.isActive && _jsx("span", { className: "text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold", children: "INACTIF" })] }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: p.description }), _jsxs("div", { className: "flex items-center gap-3 mt-2 flex-wrap", children: [_jsxs("span", { className: "text-xs text-gray-400 flex items-center gap-1", children: [typeLabel(p.type), ": ", _jsx("span", { className: "font-bold text-gray-700 dark:text-gray-300", children: p.type === "percent" ? `${p.value}%` : p.type === "delivery" ? "Gratuit" : `$${p.value}` })] }), p.minOrder > 0 && _jsxs("span", { className: "text-xs text-gray-400", children: ["Min: $", p.minOrder] }), p.maxUses > 0 && _jsxs("span", { className: "text-xs text-gray-400 flex items-center gap-1", children: [_jsx(Hash, { size: 10 }), p.usedCount, "/", p.maxUses, " utilisations"] }), p.expiresAt && _jsxs("span", { className: "text-xs text-gray-400 flex items-center gap-1", children: [_jsx(Calendar, { size: 10 }), "Expire: ", new Date(p.expiresAt).toLocaleDateString("fr-FR")] })] })] }), _jsxs("div", { className: "flex items-center gap-1.5 flex-shrink-0", children: [_jsx("button", { onClick: () => toggleMutation.mutate({ id: p.id, isActive: !p.isActive }), className: "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors", "data-testid": `toggle-promo-${p.id}`, children: p.isActive ? _jsx(ToggleRight, { size: 18, className: "text-green-500" }) : _jsx(ToggleLeft, { size: 18, className: "text-gray-400" }) }), _jsx("button", { onClick: () => openEdit(p), className: "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors", "data-testid": `edit-promo-${p.id}`, children: _jsx(Edit2, { size: 14, className: "text-gray-500" }) }), _jsx("button", { onClick: () => { if (confirm("Supprimer cette promotion ?"))
                                                deleteMutation.mutate(p.id); }, className: "p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors", "data-testid": `delete-promo-${p.id}`, children: _jsx(Trash2, { size: 14, className: "text-red-400" }) })] })] }) }, p.id))) })), showModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4", onClick: () => setShowModal(false), children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center justify-between z-10", children: [_jsx("h2", { className: "font-bold text-gray-900 dark:text-white", children: editing ? "Modifier la promotion" : "Nouvelle promotion" }), _jsx("button", { onClick: () => setShowModal(false), className: "p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg", children: _jsx(X, { size: 18 }) })] }), _jsxs("div", { className: "p-5 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-bold text-gray-500 mb-1 block", children: "Code promo *" }), _jsx("input", { type: "text", value: code, onChange: e => setCode(e.target.value.toUpperCase()), placeholder: "ex: MAWEJA20", "data-testid": "input-promo-code", className: "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono font-bold tracking-wider dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-bold text-gray-500 mb-1 block", children: "Description *" }), _jsx("input", { type: "text", value: description, onChange: e => setDescription(e.target.value), placeholder: "ex: 20% de reduction sur votre commande", "data-testid": "input-promo-description", className: "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-bold text-gray-500 mb-1 block", children: "Type" }), _jsxs("select", { value: type, onChange: e => setType(e.target.value), "data-testid": "select-promo-type", className: "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500", children: [_jsx("option", { value: "percent", children: "Pourcentage (%)" }), _jsx("option", { value: "fixed", children: "Montant fixe ($)" }), _jsx("option", { value: "delivery", children: "Livraison gratuite" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "text-xs font-bold text-gray-500 mb-1 block", children: ["Valeur ", type === "percent" ? "(%)" : "($)"] }), _jsx("input", { type: "number", value: value, onChange: e => setValue(Number(e.target.value)), min: "0", "data-testid": "input-promo-value", className: "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-bold text-gray-500 mb-1 block", children: "Commande minimum ($)" }), _jsx("input", { type: "number", value: minOrder, onChange: e => setMinOrder(Number(e.target.value)), min: "0", "data-testid": "input-promo-min-order", className: "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" }), _jsx("p", { className: "text-[10px] text-gray-400 mt-1", children: "0 = pas de minimum" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-bold text-gray-500 mb-1 block", children: "Utilisations max" }), _jsx("input", { type: "number", value: maxUses, onChange: e => setMaxUses(Number(e.target.value)), min: "0", "data-testid": "input-promo-max-uses", className: "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" }), _jsx("p", { className: "text-[10px] text-gray-400 mt-1", children: "0 = illimite" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-bold text-gray-500 mb-1 block", children: "Date d'expiration (optionnelle)" }), _jsx("input", { type: "date", value: expiresAt, onChange: e => setExpiresAt(e.target.value), "data-testid": "input-promo-expires", className: "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" })] }), _jsxs("div", { className: "flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3", children: [_jsx("span", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: "Actif" }), _jsx("div", { className: `relative w-11 h-6 rounded-full cursor-pointer transition-colors ${isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`, onClick: () => setIsActive(!isActive), "data-testid": "toggle-promo-active", children: _jsx("div", { className: `absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}` }) })] }), _jsxs("button", { onClick: () => saveMutation.mutate(), disabled: saveMutation.isPending || !code || !description, "data-testid": "button-save-promo", className: "w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2", children: [saveMutation.isPending ? _jsx(Loader2, { size: 16, className: "animate-spin" }) : _jsx(Check, { size: 16 }), editing ? "Sauvegarder" : "Creer la promotion"] })] })] }) }))] }) }));
}
//# sourceMappingURL=AdminPromotions.js.map