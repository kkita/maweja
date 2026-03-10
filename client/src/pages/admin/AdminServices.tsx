import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminSidebar from "../../components/AdminSidebar";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import {
  Briefcase, Plus, Search, Clock, CheckCircle, AlertCircle, Loader2,
  Eye, MessageSquare, Trash2, Edit2, X, ChevronDown
} from "lucide-react";
import type { ServiceCategory, ServiceRequest } from "@shared/schema";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "En attente", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  reviewing: { label: "En examen", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  accepted: { label: "Acceptee", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  rejected: { label: "Refusee", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  completed: { label: "Terminee", color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
};

export default function AdminServices() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"requests" | "categories">("requests");
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

  const { data: categories = [] } = useQuery<ServiceCategory[]>({ queryKey: ["/api/service-categories"] });
  const { data: requests = [] } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests"],
    queryFn: () => apiRequest("/api/service-requests").then(r => r.json()),
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/service-requests/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      setSelectedRequest(null);
      toast({ title: "Succes", description: "Demande mise a jour" });
    },
  });

  const createCatMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/service-categories", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
      setShowCatModal(false);
      setCatName(""); setCatIcon("Briefcase"); setCatDesc("");
      toast({ title: "Succes", description: "Categorie creee" });
    },
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/service-categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
      setEditingCat(null);
      toast({ title: "Succes", description: "Categorie mise a jour" });
    },
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/service-categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
      toast({ title: "Succes", description: "Categorie supprimee" });
    },
  });

  const filteredRequests = requests
    .filter(r => statusFilter === "all" || r.status === statusFilter)
    .filter(r => !search || r.fullName.toLowerCase().includes(search.toLowerCase()) || r.categoryName.toLowerCase().includes(search.toLowerCase()) || r.phone.includes(search));

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    reviewing: requests.filter(r => r.status === "reviewing").length,
    accepted: requests.filter(r => r.status === "accepted").length,
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-6 ml-64">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900" data-testid="text-admin-services-title">Services</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gerez les demandes de services et les categories</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total demandes", value: stats.total, color: "bg-blue-50 text-blue-700" },
            { label: "En attente", value: stats.pending, color: "bg-amber-50 text-amber-700" },
            { label: "En examen", value: stats.reviewing, color: "bg-purple-50 text-purple-700" },
            { label: "Acceptees", value: stats.accepted, color: "bg-green-50 text-green-700" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4" data-testid={`stat-card-${i}`}>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color.split(" ")[1]}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab("requests")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "requests" ? "bg-red-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
            data-testid="tab-requests">
            Demandes ({requests.length})
          </button>
          <button onClick={() => setTab("categories")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "categories" ? "bg-red-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
            data-testid="tab-categories">
            Categories ({categories.length})
          </button>
        </div>

        {tab === "requests" && (
          <>
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
                  data-testid="input-search-requests"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                data-testid="select-status-filter"
                className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none">
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="reviewing">En examen</option>
                <option value="accepted">Acceptees</option>
                <option value="rejected">Refusees</option>
                <option value="completed">Terminees</option>
              </select>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <Briefcase size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Aucune demande de service</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map(req => {
                  const status = statusConfig[req.status] || statusConfig.pending;
                  return (
                    <div key={req.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
                      data-testid={`admin-request-${req.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-sm text-gray-900">#{req.id} - {req.categoryName}</h3>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${status.bg} ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{req.fullName} • {req.phone}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{req.address}</p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                            {req.serviceType && <span>Type: {req.serviceType}</span>}
                            {req.budget && <span>Budget: {req.budget}</span>}
                            <span>{req.scheduledType === "asap" ? "Des que possible" : `${req.scheduledDate} ${req.scheduledTime}`}</span>
                            <span className="capitalize">Contact: {req.contactMethod}</span>
                          </div>
                          {req.additionalInfo && <p className="text-xs text-gray-500 mt-1 italic">"{req.additionalInfo}"</p>}
                          <p className="text-[10px] text-gray-400 mt-2">
                            {new Date(req.createdAt!).toLocaleDateString("fr-CD", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <button onClick={() => { setSelectedRequest(req); setNewStatus(req.status); setAdminNotes(req.adminNotes || ""); }}
                          data-testid={`button-manage-${req.id}`}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 flex items-center gap-1">
                          <Eye size={14} /> Gerer
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
              <Plus size={16} /> Nouvelle categorie
            </button>
            <div className="grid grid-cols-2 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white rounded-xl border border-gray-100 p-4" data-testid={`admin-cat-${cat.id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{cat.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${cat.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingCat(cat); setCatName(cat.name); setCatIcon(cat.icon); setCatDesc(cat.description); }}
                        className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center hover:bg-gray-100" data-testid={`button-edit-cat-${cat.id}`}>
                        <Edit2 size={14} className="text-gray-500" />
                      </button>
                      <button onClick={() => { if (confirm("Supprimer cette categorie ?")) deleteCatMutation.mutate(cat.id); }}
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

        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" data-testid="modal-manage-request">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Demande #{selectedRequest.id}</h3>
                <button onClick={() => setSelectedRequest(null)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><X size={16} /></button>
              </div>
              <div className="space-y-3 mb-4 bg-gray-50 rounded-xl p-4 text-sm">
                <p><strong>Service:</strong> {selectedRequest.categoryName}</p>
                <p><strong>Client:</strong> {selectedRequest.fullName}</p>
                <p><strong>Tel:</strong> {selectedRequest.phone}</p>
                <p><strong>Adresse:</strong> {selectedRequest.address}</p>
                {selectedRequest.serviceType && <p><strong>Type:</strong> {selectedRequest.serviceType}</p>}
                {selectedRequest.budget && <p><strong>Budget:</strong> {selectedRequest.budget}</p>}
                <p><strong>Horaire:</strong> {selectedRequest.scheduledType === "asap" ? "Des que possible" : `${selectedRequest.scheduledDate} ${selectedRequest.scheduledTime}`}</p>
                <p><strong>Contact:</strong> {selectedRequest.contactMethod}</p>
                {selectedRequest.additionalInfo && <p><strong>Info:</strong> {selectedRequest.additionalInfo}</p>}
              </div>
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Statut</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  data-testid="select-new-status"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                  <option value="pending">En attente</option>
                  <option value="reviewing">En examen</option>
                  <option value="accepted">Acceptee</option>
                  <option value="rejected">Refusee</option>
                  <option value="completed">Terminee</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Notes / Reponse au client</label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Votre reponse sera visible par le client..."
                  data-testid="input-admin-notes"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm h-24 resize-none" />
              </div>
              <button onClick={() => updateRequestMutation.mutate({ id: selectedRequest.id, data: { status: newStatus, adminNotes } })}
                disabled={updateRequestMutation.isPending}
                data-testid="button-save-request"
                className="w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50">
                {updateRequestMutation.isPending ? "Mise a jour..." : "Mettre a jour"}
              </button>
            </div>
          </div>
        )}

        {(showCatModal || editingCat) && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6" data-testid="modal-category">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{editingCat ? "Modifier" : "Nouvelle"} categorie</h3>
                <button onClick={() => { setShowCatModal(false); setEditingCat(null); }} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><X size={16} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Nom</label>
                  <input type="text" value={catName} onChange={e => setCatName(e.target.value)}
                    data-testid="input-cat-name"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Icone</label>
                  <select value={catIcon} onChange={e => setCatIcon(e.target.value)}
                    data-testid="select-cat-icon"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                    {["Briefcase","Hotel","Car","Sparkles","Package","PartyPopper","Wrench","Bike","HelpCircle"].map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Description</label>
                  <textarea value={catDesc} onChange={e => setCatDesc(e.target.value)}
                    data-testid="input-cat-desc"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm h-20 resize-none" />
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
                  {editingCat ? "Modifier" : "Creer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
