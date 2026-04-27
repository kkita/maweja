import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import {
  MapPin, Plus, Trash2, Save, Loader2, X, DollarSign,
  Palette, GripVertical, ToggleLeft, ToggleRight, Edit2, Search
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AppSkeleton } from "../../design-system/primitives";

interface DeliveryZone {
  id: number;
  name: string;
  fee: number;
  color: string;
  neighborhoods: string[];
  isActive: boolean;
  sortOrder: number;
}

const ZONE_COLORS = [
  { label: "Vert", value: "#22c55e" },
  { label: "Orange", value: "#f59e0b" },
  { label: "Rouge", value: "#ef4444" },
  { label: "Bleu", value: "#3b82f6" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Rose", value: "#ec4899" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Indigo", value: "#6366f1" },
];

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function NeighborhoodPicker({
  neighborhoods,
  onChange,
}: {
  neighborhoods: string[];
  onChange: (hoods: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const [mapCenter] = useState<[number, number]>([-4.3250, 15.3150]);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [resolvedName, setResolvedName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleMapClick = async (lat: number, lng: number) => {
    setPickedLocation({ lat, lng });
    setResolving(true);
    setResolvedName("");
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16&addressdetails=1&accept-language=fr`,
      );
      const data = await resp.json();
      const addr = data.address || {};
      const name =
        addr.suburb ||
        addr.neighbourhood ||
        addr.quarter ||
        addr.city_district ||
        addr.village ||
        addr.town ||
        "";
      if (name) {
        setResolvedName(name.toLowerCase());
      } else {
        setResolvedName(data.display_name?.split(",")[0]?.toLowerCase() || "");
      }
    } catch {
      setResolvedName("");
    } finally {
      setResolving(false);
    }
  };

  const addNeighborhood = (name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (trimmed && !neighborhoods.includes(trimmed)) {
      onChange([...neighborhoods, trimmed]);
    }
    setInput("");
    setResolvedName("");
    setPickedLocation(null);
  };

  const removeNeighborhood = (hood: string) => {
    onChange(neighborhoods.filter(h => h !== hood));
  };

  const filteredHoods = searchQuery
    ? neighborhoods.filter(h => h.includes(searchQuery.toLowerCase()))
    : neighborhoods;

  const markerIcon = L.divIcon({
    html: `<div style="width:24px;height:24px;background:#ef4444;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    className: "",
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700" style={{ height: 280 }}>
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onLocationSelect={handleMapClick} />
          {pickedLocation && <Marker position={[pickedLocation.lat, pickedLocation.lng]} icon={markerIcon} />}
        </MapContainer>
      </div>

      {pickedLocation && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">
            📍 Point sélectionné: {pickedLocation.lat.toFixed(4)}, {pickedLocation.lng.toFixed(4)}
          </p>
          {resolving ? (
            <div className="flex items-center gap-2 text-xs text-blue-500">
              <Loader2 size={12} className="animate-spin" /> Résolution de l'adresse...
            </div>
          ) : resolvedName ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-blue-800 dark:text-blue-300 flex-1">
                {resolvedName}
              </span>
              {!neighborhoods.includes(resolvedName) ? (
                <button
                  onClick={() => addNeighborhood(resolvedName)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                  data-testid="button-add-resolved"
                >
                  <Plus size={12} className="inline mr-1" /> Ajouter
                </button>
              ) : (
                <span className="text-xs text-blue-400">Déjà ajouté</span>
              )}
            </div>
          ) : (
            <p className="text-xs text-blue-400">Nom de quartier non trouvé pour ce point</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && input.trim()) { e.preventDefault(); addNeighborhood(input); } }}
          placeholder="Ajouter un quartier manuellement..."
          className="flex-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          data-testid="input-add-neighborhood"
        />
        <button
          onClick={() => addNeighborhood(input)}
          disabled={!input.trim()}
          className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          data-testid="button-add-neighborhood"
        >
          <Plus size={14} />
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
            {neighborhoods.length} quartier{neighborhoods.length !== 1 ? "s" : ""}
          </p>
          {neighborhoods.length > 5 && (
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filtrer..."
                className="pl-7 pr-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:text-white focus:outline-none"
              />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          {filteredHoods.map(h => (
            <span
              key={h}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs"
            >
              {h}
              <button onClick={() => removeNeighborhood(h)} className="text-red-400 hover:text-red-600">
                <X size={10} />
              </button>
            </span>
          ))}
          {filteredHoods.length === 0 && neighborhoods.length > 0 && (
            <p className="text-xs text-gray-400">Aucun résultat pour "{searchQuery}"</p>
          )}
          {neighborhoods.length === 0 && (
            <p className="text-xs text-gray-400 italic">Cliquez sur la carte ou tapez un nom pour ajouter des quartiers</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDeliveryZones() {
  const { toast } = useToast();
  const [editing, setEditing] = useState<DeliveryZone | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    fee: "2",
    color: "#22c55e",
    neighborhoods: [] as string[],
    isActive: true,
    sortOrder: 0,
  });

  const { data: zones = [], isLoading } = useQuery<DeliveryZone[]>({
    queryKey: ["/api/delivery-zones"],
  });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("/api/delivery-zones", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-zones"] });
      setCreating(false);
      resetForm();
      toast({ title: "Zone créée", description: "La zone de livraison a été ajoutée" });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de créer la zone", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/delivery-zones/${id}`, { method: "PATCH", body: JSON.stringify(form) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-zones"] });
      setEditing(null);
      resetForm();
      toast({ title: "Zone mise à jour", description: "Les modifications ont été enregistrées" });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de mettre à jour", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/delivery-zones/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-zones"] });
      toast({ title: "Zone supprimée" });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest(`/api/delivery-zones/${id}`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-zones"] });
    },
  });

  const resetForm = () => {
    setForm({ name: "", fee: "2", color: "#22c55e", neighborhoods: [], isActive: true, sortOrder: 0 });
  };

  const startEdit = (zone: DeliveryZone) => {
    setEditing(zone);
    setCreating(false);
    setForm({
      name: zone.name,
      fee: String(zone.fee),
      color: zone.color,
      neighborhoods: zone.neighborhoods || [],
      isActive: zone.isActive,
      sortOrder: zone.sortOrder,
    });
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    resetForm();
    setForm(f => ({ ...f, sortOrder: zones.length }));
  };

  const cancelEdit = () => {
    setCreating(false);
    setEditing(null);
    resetForm();
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast({ title: "Nom requis", description: "Veuillez donner un nom à la zone", variant: "destructive" });
      return;
    }
    if (form.neighborhoods.length === 0) {
      toast({ title: "Quartiers requis", description: "Ajoutez au moins un quartier à la zone", variant: "destructive" });
      return;
    }
    const feeNum = parseFloat(form.fee);
    if (!isFinite(feeNum) || feeNum < 0) {
      toast({ title: "Frais invalides", description: "Entrez un montant valide (≥ 0)", variant: "destructive" });
      return;
    }
    if (editing) {
      updateMutation.mutate(editing.id);
    } else {
      createMutation.mutate();
    }
  };

  const showForm = creating || editing;

  if (isLoading) {
    return (
      <AdminLayout title="Zones de livraison" subtitle="Gestion des zones et tarifs de livraison">
        <div className="max-w-4xl space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <AppSkeleton className="h-5 w-32 mb-3" />
              <AppSkeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Zones de livraison" subtitle="Gestion des zones et tarifs de livraison — restaurants & boutiques">
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {zones.length} zone{zones.length !== 1 ? "s" : ""} configurée{zones.length !== 1 ? "s" : ""}
            </p>
          </div>
          {!showForm && (
            <button
              onClick={startCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-all"
              data-testid="button-create-zone"
            >
              <Plus size={16} /> Nouvelle zone
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-red-200 dark:border-red-800 shadow-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                {editing ? `Modifier: ${editing.name}` : "Nouvelle zone de livraison"}
              </h3>
              <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 p-1" data-testid="button-cancel-zone">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Nom de la zone</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Zone A - Gombe"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  data-testid="input-zone-name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                  <DollarSign size={11} className="inline" /> Frais de livraison (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.fee}
                  onChange={e => setForm(f => ({ ...f, fee: e.target.value }))}
                  placeholder="2.00"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  data-testid="input-zone-fee"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 block">
                <Palette size={11} className="inline" /> Couleur de la zone
              </label>
              <div className="flex gap-2 flex-wrap">
                {ZONE_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setForm(f => ({ ...f, color: c.value }))}
                    className={`w-9 h-9 rounded-xl border-2 transition-all ${
                      form.color === c.value ? "border-gray-900 dark:border-white scale-110 shadow-lg" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                    style={{ background: c.value }}
                    title={c.label}
                    data-testid={`color-${c.value}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 block">
                <MapPin size={11} className="inline" /> Quartiers / Communes (cliquez sur la carte ou tapez)
              </label>
              <NeighborhoodPicker
                neighborhoods={form.neighborhoods}
                onChange={hoods => setForm(f => ({ ...f, neighborhoods: hoods }))}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <button
                  onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className="text-gray-600 dark:text-gray-400"
                  data-testid="toggle-zone-active"
                >
                  {form.isActive ? <ToggleRight size={28} className="text-green-500" /> : <ToggleLeft size={28} className="text-gray-300" />}
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {form.isActive ? "Zone active" : "Zone désactivée"}
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-200 dark:shadow-none transition-all"
                  data-testid="button-save-zone"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  {editing ? "Enregistrer" : "Créer la zone"}
                </button>
              </div>
            </div>
          </div>
        )}

        {zones.length === 0 && !showForm ? (
          <div className="text-center py-20">
            <MapPin size={48} className="mx-auto mb-4 text-gray-200 dark:text-gray-700" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune zone de livraison configurée</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Créez votre première zone pour commencer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {zones.map(zone => (
              <div
                key={zone.id}
                className={`bg-white dark:bg-gray-900 rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md ${
                  zone.isActive ? "border-gray-100 dark:border-gray-800" : "border-gray-200 dark:border-gray-700 opacity-60"
                }`}
                data-testid={`zone-card-${zone.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <GripVertical size={14} className="text-gray-300 dark:text-gray-600" />
                      <div className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm" style={{ background: zone.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{zone.name}</h4>
                        {!zone.isActive && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">INACTIVE</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {(zone.neighborhoods || []).length} quartier{(zone.neighborhoods || []).length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-lg font-black text-red-600">${zone.fee.toFixed(2)}</span>
                      <p className="text-[9px] text-gray-400 font-medium">par livraison</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleMutation.mutate({ id: zone.id, isActive: !zone.isActive })}
                        className="p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        title={zone.isActive ? "Désactiver" : "Activer"}
                        data-testid={`toggle-zone-${zone.id}`}
                      >
                        {zone.isActive ? (
                          <ToggleRight size={22} className="text-green-500" />
                        ) : (
                          <ToggleLeft size={22} className="text-gray-300" />
                        )}
                      </button>
                      <button
                        onClick={() => startEdit(zone)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-500 transition-colors"
                        data-testid={`edit-zone-${zone.id}`}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Supprimer "${zone.name}" ?`)) deleteMutation.mutate(zone.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400 hover:text-red-600 transition-colors"
                        data-testid={`delete-zone-${zone.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {(zone.neighborhoods || []).slice(0, 12).map(h => (
                    <span
                      key={h}
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: zone.color + "15", color: zone.color, border: `1px solid ${zone.color}30` }}
                    >
                      {h}
                    </span>
                  ))}
                  {(zone.neighborhoods || []).length > 12 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium">
                      +{(zone.neighborhoods || []).length - 12} autres
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
          <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm mb-2">💡 Comment ça marche</h4>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1.5">
            <li>• Les zones s'appliquent à toutes les livraisons (restaurants et boutiques)</li>
            <li>• Les frais sont déterminés par l'adresse de livraison du client</li>
            <li>• Cliquez sur la carte pour sélectionner automatiquement les quartiers</li>
            <li>• Vous pouvez aussi ajouter des quartiers manuellement</li>
            <li>• Désactivez une zone pour la masquer temporairement sans la supprimer</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
