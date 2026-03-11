import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useI18n } from "../../lib/i18n";
import {
  Briefcase, Plus, Search, Clock, CheckCircle, AlertCircle, Loader2,
  Eye, MessageSquare, Trash2, Edit2, X, ChevronDown, Image
} from "lucide-react";
import type { ServiceCategory, ServiceRequest, ServiceCatalogItem } from "@shared/schema";

export default function AdminServices() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [tab, setTab] = useState<"requests" | "categories" | "catalog">("requests");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("Briefcase");
  const [catDesc, setCatDesc] = useState("");
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

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/service-requests/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      setSelectedRequest(null);
      toast({ title: t.common.success, description: t.admin.updateButton });
    },
  });

  const createCatMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/service-categories", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
      setShowCatModal(false);
      setCatName(""); setCatIcon("Briefcase"); setCatDesc("");
      toast({ title: t.common.success, description: t.admin.newCategory });
    },
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/service-categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
      setEditingCat(null);
      toast({ title: t.common.success, description: t.admin.updateButton });
    },
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/service-categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
      toast({ title: t.common.success, description: t.common.delete });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/service-catalog", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      setShowItemModal(false);
      resetItemForm();
      toast({ title: t.common.success, description: t.admin.addCatalogItem });
    },
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
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/service-catalog/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      toast({ title: t.common.success, description: t.common.delete });
    },
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
        <>
          <button onClick={() => { setShowCatModal(true); setCatName(""); setCatIcon("Briefcase"); setCatDesc(""); }}
            data-testid="button-add-category"
            className="mb-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-red-700">
            <Plus size={16} /> {t.admin.newCategory}
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4" data-testid={`admin-cat-${cat.id}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{cat.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${cat.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500 dark:text-gray-400"}`}>
                      {cat.isActive ? t.common.active : t.common.inactive}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingCat(cat); setCatName(cat.name); setCatIcon(cat.icon); setCatDesc(cat.description); }}
                      className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center hover:bg-gray-100" data-testid={`button-edit-cat-${cat.id}`}>
                      <Edit2 size={14} className="text-gray-500 dark:text-gray-400" />
                    </button>
                    <button onClick={() => { if (confirm(t.common.confirm + "?")) deleteCatMutation.mutate(cat.id); }}
                      className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center hover:bg-red-50" data-testid={`button-delete-cat-${cat.id}`}>
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6" data-testid="modal-category">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{editingCat ? t.admin.editCategory : t.admin.newCategory}</h3>
              <button onClick={() => { setShowCatModal(false); setEditingCat(null); }} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{t.admin.categoryName}</label>
                <input type="text" value={catName} onChange={e => setCatName(e.target.value)}
                  data-testid="input-cat-name"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{t.admin.categoryIcon}</label>
                <select value={catIcon} onChange={e => setCatIcon(e.target.value)}
                  data-testid="select-cat-icon"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white">
                  {["Briefcase","Hotel","Car","Sparkles","Package","PartyPopper","Wrench","Bike","HelpCircle"].map(i => (
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
              <button onClick={() => {
                if (!catName.trim()) return;
                if (editingCat) {
                  updateCatMutation.mutate({ id: editingCat.id, data: { name: catName, icon: catIcon, description: catDesc } });
                } else {
                  createCatMutation.mutate({ name: catName, icon: catIcon, description: catDesc });
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
                <input type="url" value={itemImage} onChange={e => setItemImage(e.target.value)}
                  data-testid="input-item-image" placeholder="https://..."
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
                {itemImage && (
                  <img src={itemImage} alt="preview" className="mt-2 w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{t.admin.catalogItemPrice}</label>
                <input type="text" value={itemPrice} onChange={e => setItemPrice(e.target.value)}
                  data-testid="input-item-price" placeholder="$25 - $50"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
              </div>
              <button onClick={() => {
                if (!itemName.trim() || !itemImage.trim() || !itemCategoryId) return;
                const data = { name: itemName, description: itemDesc, imageUrl: itemImage, price: itemPrice || null, categoryId: itemCategoryId, isActive: true };
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
    </AdminLayout>
  );
}
