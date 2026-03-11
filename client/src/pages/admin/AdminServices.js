import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useI18n } from "../../lib/i18n";
import { Briefcase, Plus, Search, Eye, Trash2, Edit2, X, Image } from "lucide-react";
export default function AdminServices() {
    const { toast } = useToast();
    const { t } = useI18n();
    const [tab, setTab] = useState("requests");
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNotes, setAdminNotes] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [showCatModal, setShowCatModal] = useState(false);
    const [catName, setCatName] = useState("");
    const [catIcon, setCatIcon] = useState("Briefcase");
    const [catDesc, setCatDesc] = useState("");
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
    const updateRequestMutation = useMutation({
        mutationFn: ({ id, data }) => apiRequest(`/api/service-requests/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
            setSelectedRequest(null);
            toast({ title: t.common.success, description: t.admin.updateButton });
        },
    });
    const createCatMutation = useMutation({
        mutationFn: (data) => apiRequest("/api/service-categories", { method: "POST", body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
            setShowCatModal(false);
            setCatName("");
            setCatIcon("Briefcase");
            setCatDesc("");
            toast({ title: t.common.success, description: t.admin.newCategory });
        },
    });
    const updateCatMutation = useMutation({
        mutationFn: ({ id, data }) => apiRequest(`/api/service-categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
            setEditingCat(null);
            toast({ title: t.common.success, description: t.admin.updateButton });
        },
    });
    const deleteCatMutation = useMutation({
        mutationFn: (id) => apiRequest(`/api/service-categories/${id}`, { method: "DELETE" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
            toast({ title: t.common.success, description: t.common.delete });
        },
    });
    const createItemMutation = useMutation({
        mutationFn: (data) => apiRequest("/api/service-catalog", { method: "POST", body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
            setShowItemModal(false);
            resetItemForm();
            toast({ title: t.common.success, description: t.admin.addCatalogItem });
        },
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
    });
    const deleteItemMutation = useMutation({
        mutationFn: (id) => apiRequest(`/api/service-catalog/${id}`, { method: "DELETE" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
            toast({ title: t.common.success, description: t.common.delete });
        },
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
    return (_jsxs(AdminLayout, { title: t.admin.services, children: [_jsx("div", { className: "mb-6", children: _jsx("p", { className: "text-sm text-gray-500", "data-testid": "text-admin-services-title", children: t.admin.manageServiceRequests }) }), _jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6", children: [
                    { label: t.admin.totalRequests, value: stats.total, color: "bg-blue-50 text-blue-700" },
                    { label: t.admin.pending, value: stats.pending, color: "bg-amber-50 text-amber-700" },
                    { label: t.admin.reviewing, value: stats.reviewing, color: "bg-purple-50 text-purple-700" },
                    { label: t.admin.accepted, value: stats.accepted, color: "bg-green-50 text-green-700" },
                ].map((s, i) => (_jsxs("div", { className: "bg-white rounded-xl border border-gray-100 p-4", "data-testid": `stat-card-${i}`, children: [_jsx("p", { className: "text-xs text-gray-500 font-medium", children: s.label }), _jsx("p", { className: `text-2xl font-black mt-1 ${s.color.split(" ")[1]}`, children: s.value })] }, i))) }), _jsxs("div", { className: "flex gap-2 mb-6 flex-wrap", children: [_jsxs("button", { onClick: () => setTab("requests"), className: `px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "requests" ? "bg-red-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`, "data-testid": "tab-requests", children: [t.admin.requests, " (", requests.length, ")"] }), _jsxs("button", { onClick: () => setTab("categories"), className: `px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "categories" ? "bg-red-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`, "data-testid": "tab-categories", children: [t.admin.categories, " (", categories.length, ")"] }), _jsxs("button", { onClick: () => setTab("catalog"), className: `px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "catalog" ? "bg-red-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`, "data-testid": "tab-catalog", children: [t.admin.catalog, " (", catalogItems.length, ")"] })] }), tab === "requests" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex gap-3 mb-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", value: search, onChange: e => setSearch(e.target.value), placeholder: t.admin.searchPlaceholder, "data-testid": "input-search-requests", className: "w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" })] }), _jsxs("select", { value: statusFilter, onChange: e => setStatusFilter(e.target.value), "data-testid": "select-status-filter", className: "px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none", children: [_jsx("option", { value: "all", children: t.admin.allStatuses }), _jsx("option", { value: "pending", children: t.admin.pending }), _jsx("option", { value: "reviewing", children: t.admin.reviewing }), _jsx("option", { value: "accepted", children: t.admin.accepted }), _jsx("option", { value: "rejected", children: t.admin.rejected }), _jsx("option", { value: "completed", children: t.admin.completed })] })] }), filteredRequests.length === 0 ? (_jsxs("div", { className: "bg-white rounded-xl border border-gray-100 p-12 text-center", children: [_jsx(Briefcase, { size: 32, className: "text-gray-300 mx-auto mb-3" }), _jsx("p", { className: "text-sm text-gray-500", children: t.admin.noRequests })] })) : (_jsx("div", { className: "space-y-3", children: filteredRequests.map(req => {
                            const status = statusConfig[req.status] || statusConfig.pending;
                            return (_jsx("div", { className: "bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow", "data-testid": `admin-request-${req.id}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsxs("h3", { className: "font-bold text-sm text-gray-900", children: ["#", req.id, " - ", req.categoryName] }), _jsx("span", { className: `px-2 py-0.5 rounded-md text-[10px] font-bold border ${status.bg} ${status.color}`, children: status.label })] }), _jsxs("p", { className: "text-xs text-gray-500", children: [req.fullName, " \u2022 ", req.phone] }), _jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: req.address }), _jsxs("div", { className: "flex items-center gap-3 mt-2 text-[11px] text-gray-500", children: [req.serviceType && _jsxs("span", { children: [t.services.type, ": ", req.serviceType] }), req.budget && _jsxs("span", { children: [t.admin.budget, ": ", req.budget] }), _jsx("span", { children: req.scheduledType === "asap" ? t.services.asap : `${req.scheduledDate} ${req.scheduledTime}` })] }), req.additionalInfo && _jsxs("p", { className: "text-xs text-gray-500 mt-1 italic", children: ["\"", req.additionalInfo, "\""] })] }), _jsxs("button", { onClick: () => { setSelectedRequest(req); setNewStatus(req.status); setAdminNotes(req.adminNotes || ""); }, "data-testid": `button-manage-${req.id}`, className: "px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 flex items-center gap-1", children: [_jsx(Eye, { size: 14 }), " ", t.admin.manageRequest] })] }) }, req.id));
                        }) }))] })), tab === "categories" && (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: () => { setShowCatModal(true); setCatName(""); setCatIcon("Briefcase"); setCatDesc(""); }, "data-testid": "button-add-category", className: "mb-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-red-700", children: [_jsx(Plus, { size: 16 }), " ", t.admin.newCategory] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: categories.map(cat => (_jsx("div", { className: "bg-white rounded-xl border border-gray-100 p-4", "data-testid": `admin-cat-${cat.id}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-bold text-sm text-gray-900", children: cat.name }), _jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: cat.description }), _jsx("span", { className: `inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${cat.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`, children: cat.isActive ? t.common.active : t.common.inactive })] }), _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: () => { setEditingCat(cat); setCatName(cat.name); setCatIcon(cat.icon); setCatDesc(cat.description); }, className: "w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center hover:bg-gray-100", "data-testid": `button-edit-cat-${cat.id}`, children: _jsx(Edit2, { size: 14, className: "text-gray-500" }) }), _jsx("button", { onClick: () => { if (confirm(t.common.confirm + "?"))
                                                    deleteCatMutation.mutate(cat.id); }, className: "w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center hover:bg-red-50", "data-testid": `button-delete-cat-${cat.id}`, children: _jsx(Trash2, { size: 14, className: "text-red-500" }) })] })] }) }, cat.id))) })] })), tab === "catalog" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex flex-wrap gap-3 mb-4", children: [_jsxs("button", { onClick: () => {
                                    setShowItemModal(true);
                                    setEditingItem(null);
                                    resetItemForm();
                                    if (categories.length > 0)
                                        setItemCategoryId(categories[0].id);
                                }, "data-testid": "button-add-catalog-item", className: "px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-red-700", children: [_jsx(Plus, { size: 16 }), " ", t.admin.addCatalogItem] }), _jsxs("select", { value: String(catalogCatFilter), onChange: e => setCatalogCatFilter(e.target.value === "all" ? "all" : Number(e.target.value)), "data-testid": "select-catalog-category", className: "px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm", children: [_jsxs("option", { value: "all", children: [t.common.all, " ", t.admin.categories] }), categories.map(cat => _jsx("option", { value: cat.id, children: cat.name }, cat.id))] })] }), filteredCatalog.length === 0 ? (_jsxs("div", { className: "bg-white rounded-xl border border-gray-100 p-12 text-center", children: [_jsx(Image, { size: 32, className: "text-gray-300 mx-auto mb-3" }), _jsx("p", { className: "text-sm text-gray-500", children: t.admin.noCatalogItems })] })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: filteredCatalog.map(item => {
                            const cat = categories.find(c => c.id === item.categoryId);
                            return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow", "data-testid": `catalog-item-${item.id}`, children: [_jsxs("div", { className: "relative h-40", children: [_jsx("img", { src: item.imageUrl, alt: item.name, className: "w-full h-full object-cover" }), _jsx("span", { className: "absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg", children: cat?.name || "—" }), !item.isActive && (_jsx("span", { className: "absolute top-2 right-2 bg-gray-800/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg", children: t.common.inactive }))] }), _jsxs("div", { className: "p-3", children: [_jsx("h4", { className: "font-bold text-sm text-gray-900", children: item.name }), item.description && _jsx("p", { className: "text-xs text-gray-500 mt-0.5 line-clamp-2", children: item.description }), item.price && _jsx("p", { className: "text-xs font-semibold text-red-600 mt-1", children: item.price }), _jsxs("div", { className: "flex gap-1 mt-2", children: [_jsxs("button", { onClick: () => {
                                                            setEditingItem(item);
                                                            setItemName(item.name);
                                                            setItemDesc(item.description);
                                                            setItemImage(item.imageUrl);
                                                            setItemPrice(item.price || "");
                                                            setItemCategoryId(item.categoryId);
                                                            setShowItemModal(true);
                                                        }, className: "flex-1 px-2 py-1.5 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100", "data-testid": `button-edit-item-${item.id}`, children: [_jsx(Edit2, { size: 12, className: "inline mr-1" }), t.common.edit] }), _jsx("button", { onClick: () => { if (confirm(t.common.confirm + "?"))
                                                            deleteItemMutation.mutate(item.id); }, className: "px-2 py-1.5 bg-red-50 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-100", "data-testid": `button-delete-item-${item.id}`, children: _jsx(Trash2, { size: 12 }) })] })] })] }, item.id));
                        }) }))] })), selectedRequest && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto", "data-testid": "modal-manage-request", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "font-bold text-lg", children: [t.services.request, " #", selectedRequest.id] }), _jsx("button", { onClick: () => setSelectedRequest(null), className: "w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center", children: _jsx(X, { size: 16 }) })] }), _jsxs("div", { className: "space-y-3 mb-4 bg-gray-50 rounded-xl p-4 text-sm", children: [_jsxs("p", { children: [_jsxs("strong", { children: [t.services.service, ":"] }), " ", selectedRequest.categoryName] }), _jsxs("p", { children: [_jsxs("strong", { children: [t.common.name, ":"] }), " ", selectedRequest.fullName] }), _jsxs("p", { children: [_jsxs("strong", { children: [t.common.phone, ":"] }), " ", selectedRequest.phone] }), _jsxs("p", { children: [_jsxs("strong", { children: [t.common.address, ":"] }), " ", selectedRequest.address] }), selectedRequest.serviceType && _jsxs("p", { children: [_jsxs("strong", { children: [t.services.type, ":"] }), " ", selectedRequest.serviceType] }), selectedRequest.budget && _jsxs("p", { children: [_jsxs("strong", { children: [t.admin.budget, ":"] }), " ", selectedRequest.budget] }), _jsxs("p", { children: [_jsxs("strong", { children: [t.admin.schedule, ":"] }), " ", selectedRequest.scheduledType === "asap" ? t.services.asap : `${selectedRequest.scheduledDate} ${selectedRequest.scheduledTime}`] }), selectedRequest.additionalInfo && _jsxs("p", { children: [_jsxs("strong", { children: [t.admin.info, ":"] }), " ", selectedRequest.additionalInfo] })] }), _jsxs("div", { className: "mb-3", children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.statusLabel }), _jsxs("select", { value: newStatus, onChange: e => setNewStatus(e.target.value), "data-testid": "select-new-status", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm", children: [_jsx("option", { value: "pending", children: t.status.pending }), _jsx("option", { value: "reviewing", children: t.status.reviewing }), _jsx("option", { value: "accepted", children: t.status.accepted }), _jsx("option", { value: "rejected", children: t.status.rejected }), _jsx("option", { value: "completed", children: t.status.completed })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.adminNotes }), _jsx("textarea", { value: adminNotes, onChange: e => setAdminNotes(e.target.value), placeholder: t.admin.adminNotesPlaceholder, "data-testid": "input-admin-notes", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm h-24 resize-none" })] }), _jsx("button", { onClick: () => updateRequestMutation.mutate({ id: selectedRequest.id, data: { status: newStatus, adminNotes } }), disabled: updateRequestMutation.isPending, "data-testid": "button-save-request", className: "w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50", children: updateRequestMutation.isPending ? t.admin.updating : t.admin.updateButton })] }) })), (showCatModal || editingCat) && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-2xl w-full max-w-md p-6", "data-testid": "modal-category", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "font-bold text-lg", children: editingCat ? t.admin.editCategory : t.admin.newCategory }), _jsx("button", { onClick: () => { setShowCatModal(false); setEditingCat(null); }, className: "w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center", children: _jsx(X, { size: 16 }) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.categoryName }), _jsx("input", { type: "text", value: catName, onChange: e => setCatName(e.target.value), "data-testid": "input-cat-name", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.categoryIcon }), _jsx("select", { value: catIcon, onChange: e => setCatIcon(e.target.value), "data-testid": "select-cat-icon", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm", children: ["Briefcase", "Hotel", "Car", "Sparkles", "Package", "PartyPopper", "Wrench", "Bike", "HelpCircle"].map(i => (_jsx("option", { value: i, children: i }, i))) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.categoryDesc }), _jsx("textarea", { value: catDesc, onChange: e => setCatDesc(e.target.value), "data-testid": "input-cat-desc", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm h-20 resize-none" })] }), _jsx("button", { onClick: () => {
                                        if (!catName.trim())
                                            return;
                                        if (editingCat) {
                                            updateCatMutation.mutate({ id: editingCat.id, data: { name: catName, icon: catIcon, description: catDesc } });
                                        }
                                        else {
                                            createCatMutation.mutate({ name: catName, icon: catIcon, description: catDesc });
                                        }
                                    }, "data-testid": "button-save-category", className: "w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700", children: editingCat ? t.common.edit : t.common.create })] })] }) })), showItemModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-2xl w-full max-w-md p-6", "data-testid": "modal-catalog-item", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "font-bold text-lg", children: editingItem ? t.admin.editCatalogItem : t.admin.addCatalogItem }), _jsx("button", { onClick: () => { setShowItemModal(false); setEditingItem(null); resetItemForm(); }, className: "w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center", children: _jsx(X, { size: 16 }) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.catalogCategory }), _jsx("select", { value: itemCategoryId, onChange: e => setItemCategoryId(Number(e.target.value)), "data-testid": "select-item-category", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm", children: categories.map(cat => _jsx("option", { value: cat.id, children: cat.name }, cat.id)) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.catalogItemName }), _jsx("input", { type: "text", value: itemName, onChange: e => setItemName(e.target.value), "data-testid": "input-item-name", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.catalogItemDesc }), _jsx("textarea", { value: itemDesc, onChange: e => setItemDesc(e.target.value), "data-testid": "input-item-desc", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm h-16 resize-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.catalogItemImage }), _jsx("input", { type: "url", value: itemImage, onChange: e => setItemImage(e.target.value), "data-testid": "input-item-image", placeholder: "https://...", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" }), itemImage && (_jsx("img", { src: itemImage, alt: "preview", className: "mt-2 w-full h-32 object-cover rounded-xl border border-gray-200" }))] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-gray-500 uppercase mb-1 block", children: t.admin.catalogItemPrice }), _jsx("input", { type: "text", value: itemPrice, onChange: e => setItemPrice(e.target.value), "data-testid": "input-item-price", placeholder: "$25 - $50", className: "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" })] }), _jsx("button", { onClick: () => {
                                        if (!itemName.trim() || !itemImage.trim() || !itemCategoryId)
                                            return;
                                        const data = { name: itemName, description: itemDesc, imageUrl: itemImage, price: itemPrice || null, categoryId: itemCategoryId, isActive: true };
                                        if (editingItem) {
                                            updateItemMutation.mutate({ id: editingItem.id, data });
                                        }
                                        else {
                                            createItemMutation.mutate(data);
                                        }
                                    }, "data-testid": "button-save-catalog-item", className: "w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700", children: editingItem ? t.common.edit : t.common.create })] })] }) }))] }));
}
//# sourceMappingURL=AdminServices.js.map