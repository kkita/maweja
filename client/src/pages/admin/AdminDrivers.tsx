import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../lib/auth";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { onWSMessage } from "../../lib/websocket";
import { useToast } from "../../hooks/use-toast";
import {
  Truck, MapPin, Phone, Circle, Plus, X, Edit, Trash2, Ban, CheckCircle2,
  MessageCircle, Bell, Clock, Navigation, Star, Package, DollarSign,
  AlertTriangle, Search, Filter, ChevronRight, Timer, Zap, Eye, Send
} from "lucide-react";
import { formatPrice, statusLabels, statusColors, formatDate } from "../../lib/utils";
import type { User, Order } from "@shared/schema";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

const driverIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function MapFlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 16, { duration: 1.2 }); }, [lat, lng, map]);
  return null;
}

function CountdownTimer({ estimatedDelivery, compact }: { estimatedDelivery: string | null; compact?: boolean }) {
  const [remaining, setRemaining] = useState("");
  const [isLate, setIsLate] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!estimatedDelivery) { setRemaining("--:--"); return; }
    const update = () => {
      const deadline = new Date(estimatedDelivery).getTime();
      const diff = deadline - Date.now();
      if (diff <= 0) {
        const overMinutes = Math.abs(Math.floor(diff / 60000));
        setRemaining(`-${overMinutes}min`);
        setIsLate(true);
        setIsUrgent(true);
      } else {
        const min = Math.floor(diff / 60000);
        const sec = Math.floor((diff % 60000) / 1000);
        setRemaining(`${min}:${sec.toString().padStart(2, "0")}`);
        setIsLate(false);
        setIsUrgent(min < 5);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [estimatedDelivery]);

  if (compact) {
    return (
      <span className={`font-mono font-bold text-xs px-2 py-1 rounded-lg ${isLate ? "bg-red-100 text-red-700 animate-pulse" : isUrgent ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`} data-testid="countdown-timer">
        <Timer size={10} className="inline mr-1" />{remaining}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isLate ? "bg-red-50 border border-red-200" : isUrgent ? "bg-orange-50 border border-orange-200" : "bg-green-50 border border-green-200"}`}>
      <Timer size={14} className={isLate ? "text-red-600 animate-pulse" : isUrgent ? "text-orange-600" : "text-green-600"} />
      <span className={`font-mono font-bold text-sm ${isLate ? "text-red-700" : isUrgent ? "text-orange-700" : "text-green-700"}`}>{remaining}</span>
      <span className={`text-[10px] ${isLate ? "text-red-500" : isUrgent ? "text-orange-500" : "text-green-500"}`}>
        {isLate ? "EN RETARD" : isUrgent ? "URGENT" : "restant"}
      </span>
    </div>
  );
}

export default function AdminDrivers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "online" | "busy" | "offline" | "blocked">("all");
  const [search, setSearch] = useState("");
  const [alarmReason, setAlarmReason] = useState("");
  const [showAlarmModal, setShowAlarmModal] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", vehicleType: "moto", vehiclePlate: "", driverLicense: "", commissionRate: 15 });

  const { data: drivers = [] } = useQuery<any[]>({
    queryKey: ["/api/drivers"],
    queryFn: () => fetch("/api/drivers").then(r => r.json()),
    refetchInterval: 5000,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 5000,
  });

  useEffect(() => {
    return onWSMessage((data) => {
      if (data.type === "driver_location" || data.type === "driver_status") {
        queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      }
    });
  }, []);

  const activeOrders = orders.filter(o => ["confirmed", "preparing", "ready", "picked_up"].includes(o.status));
  const getDriverActiveOrders = (driverId: number) => activeOrders.filter(o => o.driverId === driverId);
  const getDriverDelivered = (driverId: number) => orders.filter(o => o.driverId === driverId && o.status === "delivered");
  const getDriverStatus = (d: any) => {
    if (d.isBlocked) return "blocked";
    if (!d.isOnline) return "offline";
    if (getDriverActiveOrders(d.id).length > 0) return "busy";
    return "online";
  };

  const filteredDrivers = drivers
    .filter((d: any) => {
      if (filter === "all") return true;
      return getDriverStatus(d) === filter;
    })
    .filter((d: any) =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.phone?.includes(search) ||
      d.email?.toLowerCase().includes(search.toLowerCase())
    );

  const statusCounts = {
    all: drivers.length,
    online: drivers.filter((d: any) => d.isOnline && !d.isBlocked && getDriverActiveOrders(d.id).length === 0).length,
    busy: drivers.filter((d: any) => d.isOnline && !d.isBlocked && getDriverActiveOrders(d.id).length > 0).length,
    offline: drivers.filter((d: any) => !d.isOnline && !d.isBlocked).length,
    blocked: drivers.filter((d: any) => d.isBlocked).length,
  };

  const handleSave = async () => {
    try {
      if (editingDriver) {
        const { password, ...updateData } = form;
        const payload = password ? { ...updateData, password } : updateData;
        await apiRequest(`/api/drivers/${editingDriver.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast({ title: "Livreur mis a jour" });
      } else {
        if (!form.password) { toast({ title: "Mot de passe requis", variant: "destructive" }); return; }
        await apiRequest("/api/drivers", { method: "POST", body: JSON.stringify(form) });
        toast({ title: "Livreur ajoute!" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      setShowForm(false);
      setEditingDriver(null);
      setForm({ name: "", email: "", phone: "", password: "", vehicleType: "moto", vehiclePlate: "", driverLicense: "", commissionRate: 15 });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce livreur definitivement ?")) return;
    await apiRequest(`/api/drivers/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
    if (selectedDriver?.id === id) setSelectedDriver(null);
    toast({ title: "Livreur supprime" });
  };

  const handleBlock = async (id: number, isBlocked: boolean) => {
    await apiRequest(`/api/drivers/${id}/block`, { method: "PATCH", body: JSON.stringify({ isBlocked: !isBlocked }) });
    queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
    toast({ title: isBlocked ? "Livreur debloque" : "Livreur bloque" });
  };

  const startEdit = (d: any) => {
    setEditingDriver(d);
    setForm({ name: d.name, email: d.email, phone: d.phone, password: "", vehicleType: d.vehicleType || "moto", vehiclePlate: d.vehiclePlate || "", driverLicense: d.driverLicense || "", commissionRate: d.commissionRate || 15 });
    setShowForm(true);
  };

  const sendAlarm = async (driverId: number) => {
    try {
      await apiRequest(`/api/drivers/${driverId}/alarm`, {
        method: "POST",
        body: JSON.stringify({ reason: alarmReason || "Urgence - Contactez l'administration immediatement" }),
      });
      toast({ title: "Alarme envoyee", description: "Le livreur a ete alerte" });
      setShowAlarmModal(null);
      setAlarmReason("");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const sendQuickMessage = async (driverId: number) => {
    if (!chatMessage.trim() || !user) return;
    try {
      await apiRequest("/api/chat", {
        method: "POST",
        body: JSON.stringify({ senderId: user.id, receiverId: driverId, message: chatMessage.trim(), isRead: false }),
      });
      toast({ title: "Message envoye" });
      setChatMessage("");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const selectedDriverData = selectedDriver ? drivers.find((d: any) => d.id === selectedDriver.id) || selectedDriver : null;
  const selectedDriverOrders = selectedDriverData ? getDriverActiveOrders(selectedDriverData.id) : [];
  const selectedDriverDelivered = selectedDriverData ? getDriverDelivered(selectedDriverData.id) : [];

  const filterButtons = [
    { key: "all" as const, label: "Tous", color: "bg-gray-100 text-gray-700", activeColor: "bg-gray-900 text-white" },
    { key: "online" as const, label: "Disponibles", color: "bg-green-50 text-green-700", activeColor: "bg-green-600 text-white" },
    { key: "busy" as const, label: "En livraison", color: "bg-orange-50 text-orange-700", activeColor: "bg-orange-600 text-white" },
    { key: "offline" as const, label: "Hors ligne", color: "bg-gray-50 text-gray-500", activeColor: "bg-gray-600 text-white" },
    { key: "blocked" as const, label: "Bloques", color: "bg-red-50 text-red-700", activeColor: "bg-red-600 text-white" },
  ];

  return (
    <AdminLayout title="Gestion des livreurs">
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total", value: drivers.length, icon: Truck, color: "bg-blue-600", light: "bg-blue-50" },
          { label: "Disponibles", value: statusCounts.online, icon: CheckCircle2, color: "bg-green-600", light: "bg-green-50" },
          { label: "En livraison", value: statusCounts.busy, icon: Package, color: "bg-orange-600", light: "bg-orange-50" },
          { label: "Hors ligne", value: statusCounts.offline, icon: Circle, color: "bg-gray-500", light: "bg-gray-50" },
          { label: "Bloques", value: statusCounts.blocked, icon: Ban, color: "bg-red-600", light: "bg-red-50" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm" data-testid={`stat-${s.label.toLowerCase()}`}>
            <div className={`w-10 h-10 ${s.light} rounded-xl flex items-center justify-center mb-2`}>
              <s.icon size={18} className={s.color.replace("bg-", "text-")} />
            </div>
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Rechercher un livreur..." value={search} onChange={e => setSearch(e.target.value)}
            data-testid="search-drivers" className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
        </div>
        <div className="flex gap-1.5">
          {filterButtons.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} data-testid={`filter-${f.key}`}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filter === f.key ? f.activeColor : f.color}`}>
              {f.label} ({statusCounts[f.key]})
            </button>
          ))}
        </div>
        <button onClick={() => { setShowForm(true); setEditingDriver(null); setForm({ name: "", email: "", phone: "", password: "", vehicleType: "moto", vehiclePlate: "", driverLicense: "", commissionRate: 15 }); }}
          data-testid="button-add-driver" className="bg-red-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-red-700 shadow-lg shadow-red-200 ml-auto">
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">{editingDriver ? "Modifier le livreur" : "Nouveau livreur"}</h3>
            <button onClick={() => { setShowForm(false); setEditingDriver(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Nom complet *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} data-testid="input-driver-name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} data-testid="input-driver-email" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Telephone *</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} data-testid="input-driver-phone" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
            </div>
            {!editingDriver && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Mot de passe *</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} data-testid="input-driver-password" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Type de vehicule</label>
              <select value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })} data-testid="select-vehicle-type" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                <option value="moto">Moto</option>
                <option value="velo">Velo</option>
                <option value="voiture">Voiture</option>
                <option value="scooter">Scooter</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Plaque d'immatriculation</label>
              <input type="text" value={form.vehiclePlate} onChange={e => setForm({ ...form, vehiclePlate: e.target.value })} data-testid="input-vehicle-plate" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Numero permis</label>
              <input type="text" value={form.driverLicense} onChange={e => setForm({ ...form, driverLicense: e.target.value })} data-testid="input-license" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Taux commission (%)</label>
              <input type="number" value={form.commissionRate} onChange={e => setForm({ ...form, commissionRate: Number(e.target.value) })} data-testid="input-commission" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} data-testid="button-save-driver" className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 shadow-lg shadow-red-200">
              {editingDriver ? "Mettre a jour" : "Creer le livreur"}
            </button>
            <button onClick={() => { setShowForm(false); setEditingDriver(null); }} className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl text-sm font-semibold">Annuler</button>
          </div>
        </div>
      )}

      {showAlarmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Bell size={22} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Envoyer une alarme</h3>
                <p className="text-xs text-gray-500">a {showAlarmModal.name}</p>
              </div>
            </div>
            <select value={alarmReason} onChange={e => setAlarmReason(e.target.value)}
              data-testid="alarm-reason-select" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-3">
              <option value="">Choisir un motif...</option>
              <option value="Retard de livraison detecte - Accelerez votre course">Retard de livraison</option>
              <option value="Client en attente - Merci de vous depecher">Client en attente</option>
              <option value="Changement d'adresse de livraison - Verifiez vos commandes">Changement d'adresse</option>
              <option value="Contactez l'administration immediatement">Contact urgent</option>
              <option value="Votre position GPS n'est plus visible - Reactiver la localisation">GPS perdu</option>
            </select>
            <input type="text" value={alarmReason} onChange={e => setAlarmReason(e.target.value)}
              placeholder="Ou tapez un message personnalise..." data-testid="alarm-reason-input"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-500" />
            <div className="flex gap-3">
              <button onClick={() => sendAlarm(showAlarmModal.id)} data-testid="button-send-alarm"
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 flex items-center justify-center gap-2">
                <Zap size={16} /> Envoyer l'alarme
              </button>
              <button onClick={() => { setShowAlarmModal(null); setAlarmReason(""); }}
                className="px-6 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-600">Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4" style={{ height: "calc(100vh - 340px)" }}>
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900">Livreurs ({filteredDrivers.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredDrivers.map((d: any) => {
              const status = getDriverStatus(d);
              const active = getDriverActiveOrders(d.id);
              const delivered = getDriverDelivered(d.id);
              const earnings = delivered.reduce((s: number, o: Order) => s + o.deliveryFee, 0);
              const isSelected = selectedDriverData?.id === d.id;

              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDriver(d)}
                  data-testid={`driver-card-${d.id}`}
                  className={`p-3 border-b border-gray-50 cursor-pointer transition-all hover:bg-gray-50 ${isSelected ? "bg-red-50 border-l-4 border-l-red-600" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${status === "busy" ? "bg-orange-100" : status === "online" ? "bg-green-100" : status === "blocked" ? "bg-red-100" : "bg-gray-100"}`}>
                        <Truck size={16} className={status === "busy" ? "text-orange-600" : status === "online" ? "text-green-600" : status === "blocked" ? "text-red-600" : "text-gray-400"} />
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${status === "busy" ? "bg-orange-500" : status === "online" ? "bg-green-500" : status === "blocked" ? "bg-red-500" : "bg-gray-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm text-gray-900 truncate">{d.name}</p>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          status === "busy" ? "bg-orange-100 text-orange-700" :
                          status === "online" ? "bg-green-100 text-green-700" :
                          status === "blocked" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-500"
                        }`}>
                          {status === "busy" ? "EN LIVRAISON" : status === "online" ? "DISPONIBLE" : status === "blocked" ? "BLOQUE" : "HORS LIGNE"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-gray-400 capitalize">{d.vehicleType || "Moto"}</span>
                        <span className="text-[10px] text-gray-400">{d.phone}</span>
                      </div>
                      {active.length > 0 && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-orange-600 font-semibold">{active.length} commande(s)</span>
                          {active[0]?.estimatedDelivery && (
                            <CountdownTimer estimatedDelivery={active[0].estimatedDelivery} compact />
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </div>
              );
            })}
            {filteredDrivers.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Truck size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Aucun livreur trouve</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-[55%] flex flex-col gap-4">
          {selectedDriverData ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                      getDriverStatus(selectedDriverData) === "busy" ? "bg-orange-100" :
                      getDriverStatus(selectedDriverData) === "online" ? "bg-green-100" :
                      "bg-gray-100"
                    }`}>
                      <Truck size={26} className={
                        getDriverStatus(selectedDriverData) === "busy" ? "text-orange-600" :
                        getDriverStatus(selectedDriverData) === "online" ? "text-green-600" :
                        "text-gray-400"
                      } />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-white flex items-center justify-center ${
                      selectedDriverData.isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}>
                      <Circle size={8} className="text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-gray-900" data-testid="driver-detail-name">{selectedDriverData.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Phone size={10} />{selectedDriverData.phone}</span>
                      <span className="flex items-center gap-1 capitalize"><Truck size={10} />{selectedDriverData.vehicleType || "Moto"} {selectedDriverData.vehiclePlate && `- ${selectedDriverData.vehiclePlate}`}</span>
                      {selectedDriverData.driverLicense && <span className="flex items-center gap-1">Permis: {selectedDriverData.driverLicense}</span>}
                    </div>
                    <div className="flex gap-3 mt-2 text-xs">
                      <span className="flex items-center gap-1 text-green-600 font-semibold"><DollarSign size={10} />{formatPrice(selectedDriverDelivered.reduce((s, o) => s + o.deliveryFee, 0))}</span>
                      <span className="flex items-center gap-1 text-blue-600 font-semibold"><Package size={10} />{selectedDriverDelivered.length} livrees</span>
                      <span className="flex items-center gap-1 text-orange-600 font-semibold"><Clock size={10} />{selectedDriverOrders.length} en cours</span>
                      <span className="flex items-center gap-1 text-gray-500"><Star size={10} />{selectedDriverData.commissionRate || 15}%</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setShowAlarmModal(selectedDriverData)} data-testid="button-alarm-driver"
                      className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors" title="Alarme">
                      <Bell size={16} />
                    </button>
                    <button onClick={() => startEdit(selectedDriverData)} data-testid="button-edit-selected"
                      className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100" title="Modifier">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleBlock(selectedDriverData.id, selectedDriverData.isBlocked)} data-testid="button-block-selected"
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedDriverData.isBlocked ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-orange-50 text-orange-600 hover:bg-orange-100"}`} title={selectedDriverData.isBlocked ? "Debloquer" : "Bloquer"}>
                      {selectedDriverData.isBlocked ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                    </button>
                    <button onClick={() => handleDelete(selectedDriverData.id)} data-testid="button-delete-selected"
                      className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100" title="Supprimer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <input type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendQuickMessage(selectedDriverData.id)}
                    placeholder={`Message rapide a ${selectedDriverData.name?.split(" ")[0]}...`}
                    data-testid="quick-chat-input"
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <button onClick={() => sendQuickMessage(selectedDriverData.id)} data-testid="quick-chat-send"
                    className="w-9 h-9 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700">
                    <Send size={14} />
                  </button>
                </div>
              </div>

              {selectedDriverOrders.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <h4 className="font-bold text-xs text-gray-900 mb-3 flex items-center gap-2">
                    <Package size={14} className="text-orange-600" /> Livraisons en cours ({selectedDriverOrders.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedDriverOrders.map(order => (
                      <div key={order.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100" data-testid={`driver-order-${order.id}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-gray-900">{order.orderNumber}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                            <CountdownTimer estimatedDelivery={order.estimatedDelivery} compact />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <MapPin size={10} /><span className="truncate">{order.deliveryAddress}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs font-bold text-red-600">{formatPrice(order.total)}</span>
                          <span className="text-[10px] text-gray-400">Gain: {formatPrice(order.deliveryFee)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDriverData.lat && selectedDriverData.lng ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1">
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                    <h4 className="font-bold text-xs text-gray-900 flex items-center gap-2">
                      <Navigation size={12} className="text-red-600" /> Position en temps reel
                    </h4>
                    <span className="text-[9px] text-gray-400 font-mono">{selectedDriverData.lat.toFixed(4)}, {selectedDriverData.lng.toFixed(4)}</span>
                  </div>
                  <div style={{ height: "100%", minHeight: 200 }}>
                    <MapContainer center={[selectedDriverData.lat, selectedDriverData.lng]} zoom={16} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                      <MapFlyTo lat={selectedDriverData.lat} lng={selectedDriverData.lng} />
                      <Marker position={[selectedDriverData.lat, selectedDriverData.lng]} icon={driverIcon}>
                        <Popup>
                          <div className="text-sm">
                            <p className="font-bold">{selectedDriverData.name}</p>
                            <p className="text-green-600 text-xs font-bold">En ligne</p>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <MapPin size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">Position non disponible</p>
                    <p className="text-xs mt-1">{selectedDriverData.isOnline ? "En attente du signal GPS" : "Le livreur est hors ligne"}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Eye size={48} className="mx-auto mb-3 opacity-20" />
                <p className="font-bold text-gray-500">Selectionnez un livreur</p>
                <p className="text-xs mt-1">pour voir ses informations, sa position et ses livraisons</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
