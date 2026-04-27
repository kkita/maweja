import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { useI18n } from "../../lib/i18n";
import {
  Briefcase, Clock, CheckCircle, AlertCircle,
} from "lucide-react";
import type { ServiceCategory, ServiceRequest, ServiceCatalogItem } from "@shared/schema";
import { KPICard, KPIGrid, TabContent, FilterChip } from "../../components/admin/AdminUI";
import { palette, tints, chipSurface } from "../../design-system/tokens";
import MediaLibrary from "../../components/admin/services/MediaLibrary";
import CategoriesTab from "../../components/admin/services/CategoriesTab";
import RequestsTab from "../../components/admin/services/RequestsTab";
import CatalogTab from "../../components/admin/services/CatalogTab";
import RequestDetailModal from "../../components/admin/services/RequestDetailModal";
import CategoryModal from "../../components/admin/services/CategoryModal";
import ItemModal from "../../components/admin/services/ItemModal";

export default function AdminServices() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [tab, setTab] = useState<"requests" | "categories" | "catalog" | "media">("requests");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<ServiceCategory | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceCatalogItem | null>(null);
  const [catalogCatFilter, setCatalogCatFilter] = useState<number | "all">("all");

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: t.status.pending, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    reviewing: { label: t.status.reviewing, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    accepted: { label: t.status.accepted, color: "text-green-700", bg: "bg-green-50 border-green-200" },
    rejected: { label: t.status.rejected, color: "text-red-700", bg: "bg-red-50 border-red-200" },
    completed: { label: t.status.completed, color: "text-zinc-700", bg: "bg-zinc-50 border-zinc-200" },
  };

  const { data: categories = [] } = useQuery<ServiceCategory[]>({ queryKey: ["/api/service-categories"] });
  const { data: requests = [] } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests"],
    queryFn: () => apiRequest("/api/service-requests").then(r => r.json()),
  });
  const { data: catalogItems = [] } = useQuery<ServiceCatalogItem[]>({
    queryKey: ["/api/service-catalog"],
  });

  const errToast = (err: any, fallback = "Une erreur est survenue") =>
    toast({ title: "Erreur", description: err?.message || fallback, variant: "destructive" });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/service-requests/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      setSelectedRequest(null);
      toast({ title: t.common.success, description: t.admin.updateButton });
    },
    onError: (err: any) => errToast(err, "Impossible de mettre à jour la demande"),
  });

  const createCatMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/service-categories", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
      setShowCatModal(false);
      toast({ title: t.common.success, description: t.admin.newCategory });
    },
    onError: (err: any) => errToast(err, "Impossible de créer la catégorie"),
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/service-categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
      setEditingCat(null);
      toast({ title: t.common.success, description: t.admin.updateButton });
    },
    onError: (err: any) => errToast(err, "Impossible de modifier la catégorie"),
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/service-categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
      toast({ title: t.common.success, description: t.common.delete });
    },
    onError: (err: any) => errToast(err, "Impossible de supprimer la catégorie"),
  });

  const createItemMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/service-catalog", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      setShowItemModal(false);
      toast({ title: t.common.success, description: t.admin.addCatalogItem });
    },
    onError: (err: any) => errToast(err, "Impossible de créer l'article"),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/service-catalog/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      setEditingItem(null);
      setShowItemModal(false);
      toast({ title: t.common.success, description: t.admin.updateButton });
    },
    onError: (err: any) => errToast(err, "Impossible de modifier l'article"),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/service-catalog/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-catalog"] });
      toast({ title: t.common.success, description: t.common.delete });
    },
    onError: (err: any) => errToast(err, "Impossible de supprimer l'article"),
  });

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
      <KPIGrid cols={4} className="mb-6">
        <KPICard label={t.admin.totalRequests} value={stats.total} icon={Briefcase} iconColor={palette.semantic.info} iconBg={tints.info(0.08)} testId="stat-card-0" />
        <KPICard label={t.admin.pending} value={stats.pending} icon={Clock} iconColor={palette.semantic.warning} iconBg={tints.amber(0.08)} testId="stat-card-1" />
        <KPICard label={t.admin.reviewing} value={stats.reviewing} icon={AlertCircle} iconColor={chipSurface.reviewing} iconBg={tints.purple(0.08)} testId="stat-card-2" />
        <KPICard label={t.admin.accepted} value={stats.accepted} icon={CheckCircle} iconColor={palette.semantic.success} iconBg={tints.success(0.08)} testId="stat-card-3" />
      </KPIGrid>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none">
        <FilterChip label={`${t.admin.requests} (${requests.length})`} active={tab === "requests"} onClick={() => setTab("requests")} />
        <FilterChip label={`${t.admin.categories} (${categories.length})`} active={tab === "categories"} onClick={() => setTab("categories")} />
        <FilterChip label={`${t.admin.catalog} (${catalogItems.length})`} active={tab === "catalog"} onClick={() => setTab("catalog")} />
        <FilterChip label="Médiathèque" active={tab === "media"} onClick={() => setTab("media")} />
      </div>

      <TabContent tabKey={tab}>
        {tab === "requests" && (
          <RequestsTab
            requests={filteredRequests}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            statusConfig={statusConfig}
            t={t}
            onManage={(r) => setSelectedRequest(r)}
          />
        )}

        {tab === "categories" && (
          <CategoriesTab
            categories={categories}
            t={t}
            onAdd={() => { setEditingCat(null); setShowCatModal(true); }}
            onEdit={(cat) => { setEditingCat(cat); setShowCatModal(false); }}
            onDelete={(id) => { if (confirm(t.common.confirm + "?")) deleteCatMutation.mutate(id); }}
          />
        )}

        {tab === "catalog" && (
          <CatalogTab
            categories={categories}
            items={filteredCatalog}
            catalogCatFilter={catalogCatFilter}
            setCatalogCatFilter={setCatalogCatFilter}
            t={t}
            onAdd={() => { setEditingItem(null); setShowItemModal(true); }}
            onEdit={(item) => { setEditingItem(item); setShowItemModal(true); }}
            onDelete={(id) => { if (confirm(t.common.confirm + "?")) deleteItemMutation.mutate(id); }}
          />
        )}

        {tab === "media" && (
          <MediaLibrary
            categories={categories}
            copiedUrl={copiedUrl}
            setCopiedUrl={setCopiedUrl}
          />
        )}
      </TabContent>

      <RequestDetailModal
        request={selectedRequest}
        t={t}
        onClose={() => setSelectedRequest(null)}
        onSubmit={(data) => updateRequestMutation.mutate({ id: selectedRequest!.id, data })}
        pending={updateRequestMutation.isPending}
      />

      <CategoryModal
        open={showCatModal || !!editingCat}
        editingCat={editingCat}
        t={t}
        onClose={() => { setShowCatModal(false); setEditingCat(null); }}
        onSubmit={(data) => {
          if (editingCat) updateCatMutation.mutate({ id: editingCat.id, data });
          else createCatMutation.mutate(data);
        }}
      />

      <ItemModal
        open={showItemModal}
        editingItem={editingItem}
        categories={categories}
        t={t}
        onClose={() => { setShowItemModal(false); setEditingItem(null); }}
        onSubmit={(data) => {
          if (editingItem) updateItemMutation.mutate({ id: editingItem.id, data });
          else createItemMutation.mutate(data);
        }}
      />
    </AdminLayout>
  );
}
