import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient, authFetch } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { DollarSign, TrendingUp, TrendingDown, Download, Plus, X, ArrowUpRight, PieChart, BarChart3, FileSpreadsheet } from "lucide-react";
import { formatPrice, formatDate } from "../../lib/utils";
export default function AdminFinance() {
    const { toast } = useToast();
    const [filter, setFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [newEntry, setNewEntry] = useState({ type: "revenue", category: "other", amount: 0, description: "" });
    const queryParams = new URLSearchParams();
    if (filter !== "all")
        queryParams.set("type", filter);
    if (dateFrom)
        queryParams.set("dateFrom", dateFrom);
    if (dateTo)
        queryParams.set("dateTo", dateTo);
    const { data: entries = [] } = useQuery({
        queryKey: ["/api/finance", filter, dateFrom, dateTo],
        queryFn: () => authFetch(`/api/finance?${queryParams}`).then(r => r.json()),
    });
    const summaryParams = new URLSearchParams();
    if (dateFrom)
        summaryParams.set("dateFrom", dateFrom);
    if (dateTo)
        summaryParams.set("dateTo", dateTo);
    const { data: summary } = useQuery({
        queryKey: ["/api/finance/summary", dateFrom, dateTo],
        queryFn: () => authFetch(`/api/finance/summary?${summaryParams}`).then(r => r.json()),
    });
    const totalRevenue = Number(summary?.summary?.totalRevenue) || 0;
    const totalExpense = Number(summary?.summary?.totalExpense) || 0;
    const netProfit = totalRevenue - totalExpense;
    const totalCommission = Number(summary?.summary?.totalCommission) || 0;
    const handleAdd = async () => {
        if (!newEntry.amount || !newEntry.description) {
            toast({ title: "Remplissez tous les champs", variant: "destructive" });
            return;
        }
        try {
            await apiRequest("/api/finance", { method: "POST", body: JSON.stringify(newEntry) });
            queryClient.invalidateQueries({ queryKey: ["/api/finance"] });
            setShowAddForm(false);
            setNewEntry({ type: "revenue", category: "other", amount: 0, description: "" });
            toast({ title: "Entree financiere ajoutee" });
        }
        catch (err) {
            toast({ title: "Erreur", description: err.message, variant: "destructive" });
        }
    };
    const exportCSV = () => {
        const exportParams = new URLSearchParams();
        if (filter !== "all")
            exportParams.set("type", filter);
        if (dateFrom)
            exportParams.set("dateFrom", dateFrom);
        if (dateTo)
            exportParams.set("dateTo", dateTo);
        window.open(`/api/finance/export?${exportParams}`, "_blank");
    };
    const exportOrders = () => {
        const exportParams = new URLSearchParams();
        if (dateFrom)
            exportParams.set("dateFrom", dateFrom);
        if (dateTo)
            exportParams.set("dateTo", dateTo);
        window.open(`/api/orders/export?${exportParams}`, "_blank");
    };
    const categoryLabels = {
        order: "Commande", delivery_fee: "Frais livraison", commission: "Commission",
        driver_payment: "Paiement livreur", refund: "Remboursement",
        wallet_topup: "Recharge wallet", salary: "Salaire", marketing: "Marketing",
        equipment: "Equipement", other: "Autre",
    };
    return (_jsxs(AdminLayout, { title: "Finance & Comptabilite", children: [_jsxs("div", { className: "grid grid-cols-4 gap-4 mb-6", children: [_jsxs("div", { className: "bg-white rounded-2xl p-5 border border-gray-100 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("div", { className: "w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center", children: _jsx(TrendingUp, { size: 20, className: "text-green-600" }) }), _jsx("span", { className: "text-xs font-semibold text-green-600 flex items-center gap-0.5", children: _jsx(ArrowUpRight, { size: 12 }) })] }), _jsx("p", { className: "text-2xl font-black text-gray-900", children: formatPrice(totalRevenue) }), _jsx("p", { className: "text-xs text-gray-500 font-medium mt-1", children: "Revenus totaux" })] }), _jsxs("div", { className: "bg-white rounded-2xl p-5 border border-gray-100 shadow-sm", children: [_jsx("div", { className: "flex items-center justify-between mb-3", children: _jsx("div", { className: "w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center", children: _jsx(TrendingDown, { size: 20, className: "text-red-600" }) }) }), _jsx("p", { className: "text-2xl font-black text-gray-900", children: formatPrice(totalExpense) }), _jsx("p", { className: "text-xs text-gray-500 font-medium mt-1", children: "Depenses totales" })] }), _jsxs("div", { className: "bg-white rounded-2xl p-5 border border-gray-100 shadow-sm", children: [_jsx("div", { className: "flex items-center justify-between mb-3", children: _jsx("div", { className: "w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center", children: _jsx(DollarSign, { size: 20, className: "text-blue-600" }) }) }), _jsx("p", { className: `text-2xl font-black ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`, children: formatPrice(netProfit) }), _jsx("p", { className: "text-xs text-gray-500 font-medium mt-1", children: "Benefice net" })] }), _jsxs("div", { className: "bg-white rounded-2xl p-5 border border-gray-100 shadow-sm", children: [_jsx("div", { className: "flex items-center justify-between mb-3", children: _jsx("div", { className: "w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center", children: _jsx(PieChart, { size: 20, className: "text-purple-600" }) }) }), _jsx("p", { className: "text-2xl font-black text-gray-900", children: formatPrice(totalCommission) }), _jsx("p", { className: "text-xs text-gray-500 font-medium mt-1", children: "Commissions" })] })] }), _jsxs("div", { className: "flex items-center gap-3 mb-6 flex-wrap", children: [_jsx("div", { className: "flex gap-2", children: ["all", "revenue", "expense"].map(t => (_jsx("button", { onClick: () => setFilter(t), "data-testid": `filter-finance-${t}`, className: `px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filter === t ? "bg-red-600 text-white shadow-lg" : "bg-white text-gray-600 border border-gray-200"}`, children: t === "all" ? "Tout" : t === "revenue" ? "Revenus" : "Depenses" }, t))) }), _jsxs("div", { className: "flex items-center gap-2 ml-auto", children: [_jsx("input", { type: "date", value: dateFrom, onChange: e => setDateFrom(e.target.value), "data-testid": "input-date-from", className: "px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs", placeholder: "Debut" }), _jsx("span", { className: "text-gray-400 text-xs", children: "a" }), _jsx("input", { type: "date", value: dateTo, onChange: e => setDateTo(e.target.value), "data-testid": "input-date-to", className: "px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs", placeholder: "Fin" })] }), _jsxs("button", { onClick: () => setShowAddForm(true), "data-testid": "button-add-finance", className: "bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-red-700 shadow-lg shadow-red-200", children: [_jsx(Plus, { size: 14 }), " Ajouter"] }), _jsxs("button", { onClick: exportCSV, "data-testid": "button-export-finance", className: "bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-green-700", children: [_jsx(Download, { size: 14 }), " Export CSV"] }), _jsxs("button", { onClick: exportOrders, "data-testid": "button-export-orders", className: "bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-blue-700", children: [_jsx(FileSpreadsheet, { size: 14 }), " Export Commandes"] })] }), showAddForm && (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "font-bold", children: "Nouvelle entree financiere" }), _jsx("button", { onClick: () => setShowAddForm(false), children: _jsx(X, { size: 20, className: "text-gray-400" }) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 mb-1 block", children: "Type" }), _jsxs("select", { value: newEntry.type, onChange: e => setNewEntry({ ...newEntry, type: e.target.value }), "data-testid": "select-finance-type", className: "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm", children: [_jsx("option", { value: "revenue", children: "Revenu" }), _jsx("option", { value: "expense", children: "Depense" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 mb-1 block", children: "Categorie" }), _jsxs("select", { value: newEntry.category, onChange: e => setNewEntry({ ...newEntry, category: e.target.value }), "data-testid": "select-finance-category", className: "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm", children: [_jsx("option", { value: "order", children: "Commande" }), _jsx("option", { value: "commission", children: "Commission" }), _jsx("option", { value: "delivery_fee", children: "Frais livraison" }), _jsx("option", { value: "driver_payment", children: "Paiement livreur" }), _jsx("option", { value: "salary", children: "Salaire" }), _jsx("option", { value: "marketing", children: "Marketing" }), _jsx("option", { value: "equipment", children: "Equipement" }), _jsx("option", { value: "other", children: "Autre" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 mb-1 block", children: "Montant (FC)" }), _jsx("input", { type: "number", value: newEntry.amount, onChange: e => setNewEntry({ ...newEntry, amount: Number(e.target.value) }), "data-testid": "input-finance-amount", className: "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 mb-1 block", children: "Description" }), _jsx("input", { type: "text", value: newEntry.description, onChange: e => setNewEntry({ ...newEntry, description: e.target.value }), "data-testid": "input-finance-desc", className: "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" })] })] }), _jsx("button", { onClick: handleAdd, "data-testid": "button-save-finance", className: "mt-4 bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700", children: "Enregistrer" })] })), summary?.byCategory && summary.byCategory.length > 0 && (_jsxs("div", { className: "grid grid-cols-2 gap-6 mb-6", children: [_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-5", children: [_jsxs("h3", { className: "font-bold text-sm mb-4 flex items-center gap-2", children: [_jsx(BarChart3, { size: 16, className: "text-red-600" }), " Repartition par categorie"] }), _jsx("div", { className: "space-y-3", children: summary.byCategory.map((cat, i) => {
                                    const maxAmount = Math.max(...summary.byCategory.map((c) => Number(c.total)));
                                    const pct = maxAmount ? (Number(cat.total) / maxAmount) * 100 : 0;
                                    return (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { className: "text-gray-600", children: categoryLabels[cat.category] || cat.category }), _jsx("span", { className: `font-bold ${cat.type === "revenue" ? "text-green-600" : "text-red-600"}`, children: formatPrice(Number(cat.total)) })] }), _jsx("div", { className: "w-full bg-gray-100 rounded-full h-2", children: _jsx("div", { className: `h-2 rounded-full ${cat.type === "revenue" ? "bg-green-500" : "bg-red-500"}`, style: { width: `${pct}%` } }) })] }, i));
                                }) })] }), summary.daily && summary.daily.length > 0 && (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-5", children: [_jsxs("h3", { className: "font-bold text-sm mb-4 flex items-center gap-2", children: [_jsx(TrendingUp, { size: 16, className: "text-green-600" }), " Evolution journaliere"] }), _jsx("div", { className: "space-y-2 max-h-64 overflow-y-auto", children: summary.daily.slice(-14).map((day, i) => (_jsxs("div", { className: "flex items-center justify-between py-2 border-b border-gray-50", children: [_jsx("span", { className: "text-xs text-gray-500 font-medium", children: day.date }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("span", { className: "text-xs font-bold text-green-600", children: ["+", formatPrice(Number(day.revenue))] }), _jsxs("span", { className: "text-xs font-bold text-red-600", children: ["-", formatPrice(Number(day.expense))] })] })] }, i))) })] }))] })), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden", children: [_jsx("div", { className: "px-5 py-4 border-b border-gray-100 flex items-center justify-between", children: _jsxs("h3", { className: "font-bold text-gray-900", children: ["Historique (", entries.length, " entrees)"] }) }), _jsxs("div", { className: "overflow-x-auto", children: [_jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 text-xs text-gray-500 uppercase", children: _jsxs("tr", { children: [_jsx("th", { className: "px-5 py-3 text-left", children: "Type" }), _jsx("th", { className: "px-5 py-3 text-left", children: "Categorie" }), _jsx("th", { className: "px-5 py-3 text-left", children: "Description" }), _jsx("th", { className: "px-5 py-3 text-right", children: "Montant" }), _jsx("th", { className: "px-5 py-3 text-left", children: "Reference" }), _jsx("th", { className: "px-5 py-3 text-left", children: "Date" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-50", children: entries.slice(0, 50).map(e => (_jsxs("tr", { className: "hover:bg-gray-50", "data-testid": `finance-row-${e.id}`, children: [_jsx("td", { className: "px-5 py-3", children: _jsx("span", { className: `text-xs font-bold px-2 py-1 rounded-full ${e.type === "revenue" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`, children: e.type === "revenue" ? "Revenu" : "Depense" }) }), _jsx("td", { className: "px-5 py-3 text-sm", children: categoryLabels[e.category] || e.category }), _jsx("td", { className: "px-5 py-3 text-sm text-gray-600 max-w-xs truncate", children: e.description }), _jsxs("td", { className: `px-5 py-3 text-sm text-right font-bold ${e.type === "revenue" ? "text-green-600" : "text-red-600"}`, children: [e.type === "revenue" ? "+" : "-", formatPrice(e.amount)] }), _jsx("td", { className: "px-5 py-3 text-xs text-gray-400", children: e.reference || "-" }), _jsx("td", { className: "px-5 py-3 text-xs text-gray-500", children: formatDate(e.createdAt) })] }, e.id))) })] }), entries.length === 0 && (_jsxs("div", { className: "p-12 text-center text-gray-400", children: [_jsx(DollarSign, { size: 40, className: "mx-auto mb-3 opacity-30" }), _jsx("p", { className: "text-sm", children: "Aucune entree financiere" }), _jsx("p", { className: "text-xs mt-1", children: "Les transactions apparaitront ici automatiquement" })] }))] })] })] }));
}
//# sourceMappingURL=AdminFinance.js.map