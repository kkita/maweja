import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { Tag, Plus, Trash2, Edit2, X, Check, Loader2, Percent, DollarSign, Truck, Calendar, Hash, ToggleLeft, ToggleRight, Store } from "lucide-react";
import type { Promotion, Restaurant } from "@shared/schema";

export default function AdminPromotions() {
  const { toast } = useToast();
  const { data: promotions = [], isLoading } = useQuery<Promotion[]>({ queryKey: ["/api/promotions"] });
  const { data: restaurants = [] } = useQuery<Restaurant[]>({ queryKey: ["/api/restaurants"] });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("percent");
  const [value, setValue] = useState(10);
  const [minOrder, setMinOrder] = useState(0);
  const [maxUses, setMaxUses] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [restaurantId, setRestaurantId] = useState<number | null>(null);

  const resetForm = () => {
    setCode(""); setDescription(""); setType("percent"); setValue(10);
    setMinOrder(0); setMaxUses(0); setIsActive(true); setExpiresAt("");
    setRestaurantId(null); setEditing(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };
  const openEdit = (p: Promotion) => {
    setEditing(p);
    setCode(p.code);
    setDescription(p.description);
    setType(p.type);
    setValue(p.value);
    setMinOrder(p.minOrder);
    setMaxUses(p.maxUses);
    setIsActive(p.isActive);
    setExpiresAt(p.expiresAt ? new Date(p.expiresAt).toISOString().split("T")[0] : "");
    setRestaurantId((p as any).restaurantId || null);
    setShowModal(true);
  };

  const getRestaurantName = (id: number | null) => {
    if (!id) return null;
    return restaurants.find(r => r.id === id)?.name || null;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { code, description, type, value, minOrder, maxUses, isActive, expiresAt: expiresAt || null, restaurantId: restaurantId || null };
      if (editing) {
        await apiRequest(`/api/promotions/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
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
    mutationFn: async (id: number) => {
      await apiRequest(`/api/promotions/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      toast({ title: "Promotion supprimee" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest(`/api/promotions/${id}`, { method: "PATCH", body: JSON.stringify({ isActive }) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/promotions"] }),
  });

  const typeLabel = (t: string) => {
    if (t === "percent") return "Pourcentage";
    if (t === "fixed") return "Montant fixe";
    if (t === "delivery") return "Livraison gratuite";
    return t;
  };

  const typeIcon = (t: string) => {
    if (t === "percent") return <Percent size={14} className="text-blue-500" />;
    if (t === "fixed") return <DollarSign size={14} className="text-green-500" />;
    if (t === "delivery") return <Truck size={14} className="text-purple-500" />;
    return <Tag size={14} />;
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Tag size={22} className="text-red-600" />
              Promotions & Offres
            </h1>
            <p className="text-sm text-gray-500 mt-1">{promotions.length} code(s) promo</p>
          </div>
          <button
            onClick={openCreate}
            data-testid="button-create-promo"
            className="bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-700 transition-colors"
          >
            <Plus size={16} /> Nouveau code
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-red-600" />
          </div>
        ) : promotions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Tag size={28} className="text-red-300" />
            </div>
            <p className="text-gray-500 font-medium">Aucune promotion</p>
            <p className="text-sm text-gray-400 mt-1">Creez votre premier code promo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {promotions.map((p) => (
              <div key={p.id} data-testid={`promo-card-${p.id}`}
                className={`bg-white dark:bg-gray-900 rounded-2xl border ${p.isActive ? "border-gray-100 dark:border-gray-800" : "border-red-200 dark:border-red-900/40 opacity-60"} p-4`}
                style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {typeIcon(p.type)}
                      <span className="font-black text-gray-900 dark:text-white text-sm tracking-wider">{p.code}</span>
                      {!p.isActive && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">INACTIF</span>}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{p.description}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        {typeLabel(p.type)}: <span className="font-bold text-gray-700 dark:text-gray-300">{p.type === "percent" ? `${p.value}%` : p.type === "delivery" ? "Gratuit" : `$${p.value}`}</span>
                      </span>
                      {(p as any).restaurantId && getRestaurantName((p as any).restaurantId) && (
                        <span className="text-xs text-blue-500 flex items-center gap-1 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-full font-semibold">
                          <Store size={10} /> {getRestaurantName((p as any).restaurantId)}
                        </span>
                      )}
                      {p.minOrder > 0 && <span className="text-xs text-gray-400">Min: ${p.minOrder}</span>}
                      {p.maxUses > 0 && <span className="text-xs text-gray-400 flex items-center gap-1"><Hash size={10} />{p.usedCount}/{p.maxUses} utilisations</span>}
                      {p.expiresAt && <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={10} />Expire: {new Date(p.expiresAt).toLocaleDateString("fr-FR")}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => toggleMutation.mutate({ id: p.id, isActive: !p.isActive })}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      data-testid={`toggle-promo-${p.id}`}
                    >
                      {p.isActive ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} className="text-gray-400" />}
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      data-testid={`edit-promo-${p.id}`}
                    >
                      <Edit2 size={14} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => { if (confirm("Supprimer cette promotion ?")) deleteMutation.mutate(p.id); }}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      data-testid={`delete-promo-${p.id}`}
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center justify-between z-10">
                <h2 className="font-bold text-gray-900 dark:text-white">{editing ? "Modifier la promotion" : "Nouvelle promotion"}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Code promo *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="ex: MAWEJA20"
                    data-testid="input-promo-code"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono font-bold tracking-wider dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Description *</label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="ex: 20% de reduction sur votre commande"
                    data-testid="input-promo-description"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block flex items-center gap-1.5">
                    <Store size={12} className="text-blue-500" /> Restaurant (optionnel)
                  </label>
                  <select
                    value={restaurantId || ""}
                    onChange={e => setRestaurantId(e.target.value ? Number(e.target.value) : null)}
                    data-testid="select-promo-restaurant"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Tous les restaurants (général)</option>
                    {restaurants.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">Laisser vide pour une promo générale, ou choisir un restaurant spécifique</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Type</label>
                    <select
                      value={type}
                      onChange={e => setType(e.target.value)}
                      data-testid="select-promo-type"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="percent">Pourcentage (%)</option>
                      <option value="fixed">Montant fixe ($)</option>
                      <option value="delivery">Livraison gratuite</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Valeur {type === "percent" ? "(%)" : "($)"}</label>
                    <input
                      type="number"
                      value={value}
                      onChange={e => setValue(Number(e.target.value))}
                      min="0"
                      data-testid="input-promo-value"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Commande minimum ($)</label>
                    <input
                      type="number"
                      value={minOrder}
                      onChange={e => setMinOrder(Number(e.target.value))}
                      min="0"
                      data-testid="input-promo-min-order"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">0 = pas de minimum</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Utilisations max</label>
                    <input
                      type="number"
                      value={maxUses}
                      onChange={e => setMaxUses(Number(e.target.value))}
                      min="0"
                      data-testid="input-promo-max-uses"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">0 = illimite</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Date d'expiration (optionnelle)</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={e => setExpiresAt(e.target.value)}
                    data-testid="input-promo-expires"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Actif</span>
                  <div
                    className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
                    onClick={() => setIsActive(!isActive)}
                    data-testid="toggle-promo-active"
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </div>
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !code || !description}
                  data-testid="button-save-promo"
                  className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {editing ? "Sauvegarder" : "Creer la promotion"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
