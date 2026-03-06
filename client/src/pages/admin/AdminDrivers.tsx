import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { Truck, MapPin, Phone, Circle, Plus, X, Edit, Trash2, Ban, CheckCircle2, Eye } from "lucide-react";
import { formatPrice } from "../../lib/utils";
import type { User, Order } from "@shared/schema";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const driverIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const deliveryIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

export default function AdminDrivers() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [showMap, setShowMap] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", vehicleType: "moto", vehiclePlate: "", driverLicense: "", commissionRate: 15 });

  const { data: drivers = [] } = useQuery<any[]>({ queryKey: ["/api/drivers"], queryFn: () => fetch("/api/drivers").then(r => r.json()), refetchInterval: 5000 });
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ["/api/orders"], refetchInterval: 5000 });

  const activeOrders = orders.filter(o => ["confirmed", "preparing", "ready", "picked_up"].includes(o.status));
  const getDriverActiveOrders = (driverId: number) => activeOrders.filter(o => o.driverId === driverId);
  const getDriverDelivered = (driverId: number) => orders.filter(o => o.driverId === driverId && o.status === "delivered");

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

  const driversWithLocation = drivers.filter(d => d.lat && d.lng);

  return (
    <AdminLayout title="Gestion des livreurs">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: drivers.length, color: "bg-blue-50 text-blue-600", icon: Truck },
          { label: "En ligne", value: drivers.filter((d: any) => d.isOnline && !d.isBlocked).length, color: "bg-green-50 text-green-600", icon: Circle },
          { label: "Hors ligne", value: drivers.filter((d: any) => !d.isOnline && !d.isBlocked).length, color: "bg-gray-50 text-gray-600", icon: Circle },
          { label: "Bloques", value: drivers.filter((d: any) => d.isBlocked).length, color: "bg-red-50 text-red-600", icon: Ban },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm" data-testid={`stat-drivers-${s.label.toLowerCase()}`}>
            <div className={`w-11 h-11 ${s.color.split(" ")[0]} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon size={20} className={s.color.split(" ")[1]} />
            </div>
            <p className="text-3xl font-black text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={() => { setShowForm(true); setEditingDriver(null); setForm({ name: "", email: "", phone: "", password: "", vehicleType: "moto", vehiclePlate: "", driverLicense: "", commissionRate: 15 }); }}
          data-testid="button-add-driver" className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-200">
          <Plus size={16} /> Ajouter un livreur
        </button>
        <button onClick={() => setShowMap(!showMap)} data-testid="button-toggle-map" className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 border transition-all ${showMap ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-600"}`}>
          <MapPin size={16} /> {showMap ? "Masquer la carte" : "Voir la carte"}
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

      {showMap && driversWithLocation.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Carte en temps reel</h3>
            <span className="text-xs text-gray-400">{driversWithLocation.length} livreurs visibles</span>
          </div>
          <div style={{ height: 400 }}>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <MapContainer center={[-4.3200, 15.3100]} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
              {driversWithLocation.map((d: any) => (
                <Marker key={d.id} position={[d.lat, d.lng]} icon={driverIcon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold">{d.name}</p>
                      <p className="text-gray-500">{d.phone}</p>
                      <p className={`text-xs font-bold mt-1 ${d.isOnline ? "text-green-600" : "text-gray-400"}`}>
                        {d.isOnline ? "En ligne" : "Hors ligne"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{d.vehicleType || "Moto"} - {d.vehiclePlate || "N/A"}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {activeOrders.filter(o => o.deliveryLat && o.deliveryLng).map(o => (
                <Marker key={`del-${o.id}`} position={[o.deliveryLat!, o.deliveryLng!]} icon={deliveryIcon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold">{o.orderNumber}</p>
                      <p className="text-gray-500">{o.deliveryAddress}</p>
                      <p className="text-xs text-blue-600 font-bold mt-1">{formatPrice(o.total)}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Liste des livreurs ({drivers.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Livreur</th>
                <th className="px-5 py-3 text-left">Contact</th>
                <th className="px-5 py-3 text-left">Vehicule</th>
                <th className="px-5 py-3 text-center">Livraisons</th>
                <th className="px-5 py-3 text-center">En cours</th>
                <th className="px-5 py-3 text-center">Gains</th>
                <th className="px-5 py-3 text-center">Statut</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {drivers.map((d: any) => {
                const delivered = getDriverDelivered(d.id);
                const active = getDriverActiveOrders(d.id);
                const earnings = delivered.reduce((s: number, o: Order) => s + o.deliveryFee, 0);
                return (
                  <tr key={d.id} className={`hover:bg-gray-50 transition-colors ${d.isBlocked ? "opacity-50" : ""}`} data-testid={`driver-row-${d.id}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center relative">
                          <Truck size={16} className="text-red-600" />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${d.isOnline && !d.isBlocked ? "bg-green-500" : d.isBlocked ? "bg-red-500" : "bg-gray-400"}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{d.name}</p>
                          <p className="text-[10px] text-gray-400">{d.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{d.phone}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm capitalize">{d.vehicleType || "Moto"}</p>
                      <p className="text-[10px] text-gray-400">{d.vehiclePlate || "-"}</p>
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-sm">{delivered.length}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${active.length > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"}`}>
                        {active.length}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-sm text-green-600">{formatPrice(earnings)}</td>
                    <td className="px-5 py-4 text-center">
                      {d.isBlocked ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700">Bloque</span>
                      ) : d.isOnline ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">En ligne</span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Hors ligne</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => startEdit(d)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100" data-testid={`edit-driver-${d.id}`}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleBlock(d.id, d.isBlocked)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${d.isBlocked ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-orange-50 text-orange-600 hover:bg-orange-100"}`} data-testid={`block-driver-${d.id}`}>
                          {d.isBlocked ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                        </button>
                        <button onClick={() => handleDelete(d.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100" data-testid={`delete-driver-${d.id}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
