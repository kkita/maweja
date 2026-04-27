import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../lib/auth";
import { apiRequest, queryClient, authFetchJson } from "../../lib/queryClient";
import { onWSMessage } from "../../lib/websocket";
import { useToast } from "../../hooks/use-toast";
import {
  Truck, MapPin, Phone, Circle, Plus, Edit, Trash2, Ban, CheckCircle2,
  Clock, Navigation, Package, Search, Menu,
} from "lucide-react";
import type { Order } from "@shared/schema";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { KPICard, KPIGrid, TabContent, FilterChip, EmptyState } from "../../components/admin/AdminUI";
import { tints, palette, brand, neutralSurface } from "../../design-system/tokens";
import AlarmModal from "../../components/admin/drivers/AlarmModal";
import DriverDetailPanel from "../../components/admin/drivers/DriverDetailPanel";
import DriverFormModal from "../../components/admin/drivers/DriverFormModal";
import DispatchPanels from "../../components/admin/drivers/DispatchPanels";
import DriverListSidebar from "../../components/admin/drivers/DriverListSidebar";

const KINSHASA_CENTER: [number, number] = [-4.3217, 15.3126];

const driverIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const onlineIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function MapFlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 16, { duration: 1.2 }); }, [lat, lng, map]);
  return null;
}

function MapInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

type DispatchTab = "unassigned" | "assigned" | "completed" | "free" | "busy" | "offline" | "gestion";

export default function AdminDrivers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dispatchTab, setDispatchTab] = useState<DispatchTab>("gestion");
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "online" | "busy" | "offline" | "blocked">("all");
  const [search, setSearch] = useState("");
  const [alarmReason, setAlarmReason] = useState("");
  const [showAlarmModal, setShowAlarmModal] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [mobilePanel, setMobilePanel] = useState<"list" | "info" | "map">("list");
  const [assigningOrderId, setAssigningOrderId] = useState<number | null>(null);

  const { data: hideFeeSetting } = useQuery<{ value: string | null }>({
    queryKey: ["/api/settings", "hideDeliveryFees"],
    queryFn: () => authFetchJson("/api/settings/hideDeliveryFees"),
  });
  const hideFeesFromDrivers = hideFeeSetting?.value === "true";

  const toggleHideFees = async () => {
    const newVal = hideFeesFromDrivers ? "false" : "true";
    await apiRequest("/api/settings/hideDeliveryFees", { method: "PUT", body: JSON.stringify({ value: newVal }) });
    queryClient.invalidateQueries({ queryKey: ["/api/settings", "hideDeliveryFees"] });
    toast({ title: newVal === "true" ? "Frais masqués pour les agents" : "Frais visibles pour les agents" });
  };

  const { data: drivers = [] } = useQuery<any[]>({
    queryKey: ["/api/drivers"],
    queryFn: () => authFetchJson("/api/drivers"),
    refetchInterval: 5000,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 5000,
  });

  const { data: restaurants = [] } = useQuery<any[]>({
    queryKey: ["/api/restaurants"],
  });

  useEffect(() => {
    return onWSMessage((data) => {
      if (data.type === "driver_location" || data.type === "driver_status") {
        queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      }
    });
  }, []);

  const activeOrders = orders.filter(o => ["confirmed", "picked_up"].includes(o.status));
  const getDriverActiveOrders = (driverId: number) => activeOrders.filter(o => o.driverId === driverId);
  const getDriverDelivered = (driverId: number) => orders.filter(o => o.driverId === driverId && o.status === "delivered");
  const getDriverStatus = (d: any) => {
    if (d.isBlocked) return "blocked";
    if (!d.isOnline) return "offline";
    if (getDriverActiveOrders(d.id).length > 0) return "busy";
    return "online";
  };

  const getRestaurantName = (restaurantId: number) => {
    const r = restaurants.find((rest: any) => rest.id === restaurantId);
    return r?.name || `Restaurant #${restaurantId}`;
  };

  const filteredDrivers = drivers
    .filter((d: any) => filter === "all" ? true : getDriverStatus(d) === filter)
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

  const driversWithLocation = drivers.filter((d: any) => d.lat && d.lng && d.isOnline);

  const unassignedOrders = useMemo(() =>
    orders.filter(o => !o.driverId && ["pending", "confirmed"].includes(o.status)),
    [orders]
  );

  const assignedOrders = useMemo(() =>
    orders.filter(o => o.driverId && !["delivered", "cancelled"].includes(o.status)),
    [orders]
  );

  const assignedByDriver = useMemo(() => {
    const map = new Map<number, Order[]>();
    assignedOrders.forEach(o => {
      if (o.driverId) {
        const existing = map.get(o.driverId) || [];
        existing.push(o);
        map.set(o.driverId, existing);
      }
    });
    return map;
  }, [assignedOrders]);

  const completedOrders = useMemo(() => orders.filter(o => o.status === "delivered"), [orders]);
  const freeDrivers = useMemo(() => drivers.filter((d: any) => d.isOnline && !d.isBlocked && getDriverActiveOrders(d.id).length === 0), [drivers, activeOrders]);
  const busyDrivers = useMemo(() => drivers.filter((d: any) => d.isOnline && !d.isBlocked && getDriverActiveOrders(d.id).length > 0), [drivers, activeOrders]);
  const offlineDrivers = useMemo(() => drivers.filter((d: any) => !d.isOnline), [drivers]);
  const availableDriversForAssign = useMemo(() => drivers.filter((d: any) => d.isOnline && !d.isBlocked), [drivers]);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const getDriverTodayDeliveries = (driverId: number) =>
    orders.filter(o => o.driverId === driverId && o.status === "delivered" && o.updatedAt && new Date(o.updatedAt).getTime() >= todayStart).length;

  const handleAssignDriver = async (orderId: number, driverId: number) => {
    try {
      await apiRequest(`/api/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ driverId, status: "confirmed" }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Agent attribue" });
      setAssigningOrderId(null);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cet agent definitivement ?")) return;
    try {
      await apiRequest(`/api/drivers/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      if (selectedDriver?.id === id) setSelectedDriver(null);
      toast({ title: "Agent supprime" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de supprimer l'agent", variant: "destructive" });
    }
  };

  const handleBlock = async (id: number, isBlocked: boolean) => {
    try {
      await apiRequest(`/api/drivers/${id}/block`, { method: "PATCH", body: JSON.stringify({ isBlocked: !isBlocked }) });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({ title: isBlocked ? "Agent debloque" : "Agent bloque" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de modifier le statut de l'agent", variant: "destructive" });
    }
  };

  const startEdit = (d: any) => {
    setEditingDriver(d);
    setShowForm(true);
  };

  const sendAlarm = async (driverId: number, reason: string) => {
    try {
      await apiRequest(`/api/drivers/${driverId}/alarm`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || "Urgence - Contactez l'administration immediatement" }),
      });
      toast({ title: "Alarme envoyee", description: "L'agent a ete alerte" });
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

  const selectDriver = (d: any) => {
    setSelectedDriver(d);
    setMobilePanel("info");
  };

  const sd = selectedDriver ? drivers.find((d: any) => d.id === selectedDriver.id) || selectedDriver : null;
  const sdOrders = sd ? getDriverActiveOrders(sd.id) : [];
  const sdDelivered = sd ? getDriverDelivered(sd.id) : [];

  const filterButtons = [
    { key: "all" as const, label: "Tous", active: "bg-zinc-900 text-white", idle: "bg-zinc-100 text-zinc-600 hover:bg-zinc-200" },
    { key: "online" as const, label: "Dispo", active: "bg-green-600 text-white", idle: "bg-green-50 text-green-700 hover:bg-green-100" },
    { key: "busy" as const, label: "Occupe", active: "bg-orange-600 text-white", idle: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
    { key: "offline" as const, label: "Off", active: "bg-zinc-600 text-white", idle: "bg-zinc-50 text-zinc-500 hover:bg-zinc-100" },
    { key: "blocked" as const, label: "Bloque", active: "bg-red-600 text-white", idle: "bg-red-50 text-red-700 hover:bg-red-100" },
  ];

  const dispatchTabs: { key: DispatchTab; label: string; count: number }[] = [
    { key: "gestion", label: "Gestion", count: drivers.length },
    { key: "unassigned", label: "Non attribuees", count: unassignedOrders.length },
    { key: "assigned", label: "Attribuees", count: assignedOrders.length },
    { key: "completed", label: "Completees", count: completedOrders.length },
    { key: "free", label: "Disponibles", count: freeDrivers.length },
    { key: "busy", label: "Occupes", count: busyDrivers.length },
    { key: "offline", label: "Hors ligne", count: offlineDrivers.length },
  ];

  return (
    <AdminLayout title="Gestion des agents">
      <div className="mb-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-1.5 min-w-max">
          {dispatchTabs.map(tab => (
            <FilterChip key={tab.key} label={tab.label} count={tab.count} active={dispatchTab === tab.key} onClick={() => setDispatchTab(tab.key)} />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 px-4 py-3 mb-4">
        <div>
          <p className="text-sm font-bold text-zinc-900 dark:text-white">Masquer frais de livraison</p>
          <p className="text-[10px] text-zinc-500">Les agents ne verront pas leurs gains</p>
        </div>
        <button onClick={toggleHideFees} data-testid="toggle-hide-fees"
          className={`relative w-12 h-7 rounded-full transition-colors ${hideFeesFromDrivers ? "bg-red-600" : "bg-zinc-300"}`}>
          <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${hideFeesFromDrivers ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      <TabContent tabKey={dispatchTab}>
        {dispatchTab !== "gestion" ? (
          <DispatchPanels
            dispatchTab={dispatchTab}
            drivers={drivers}
            unassignedOrders={unassignedOrders}
            assignedOrders={assignedOrders}
            assignedByDriver={assignedByDriver}
            completedOrders={completedOrders}
            freeDrivers={freeDrivers}
            busyDrivers={busyDrivers}
            offlineDrivers={offlineDrivers}
            availableDriversForAssign={availableDriversForAssign}
            assigningOrderId={assigningOrderId}
            setAssigningOrderId={setAssigningOrderId}
            handleAssignDriver={handleAssignDriver}
            getRestaurantName={getRestaurantName}
            getDriverActiveOrders={getDriverActiveOrders}
            getDriverStatus={getDriverStatus}
            getDriverTodayDeliveries={getDriverTodayDeliveries}
          />
        ) : (
          <>
            <KPIGrid cols={5} className="mb-4">
              <KPICard label="Total agents" value={drivers.length} icon={Truck} iconColor={palette.semantic.info} iconBg={tints.info(0.08)} testId="stat-total" />
              <KPICard label="Disponibles" value={statusCounts.online} icon={CheckCircle2} iconColor={palette.semantic.success} iconBg={tints.success(0.08)} testId="stat-disponibles" />
              <KPICard label="En livraison" value={statusCounts.busy} icon={Package} iconColor={neutralSurface.dangerWarm} iconBg={tints.orange(0.08)} testId="stat-busy" />
              <KPICard label="Hors ligne" value={statusCounts.offline} icon={Circle} iconColor={palette.semantic.neutralStrong} iconBg={tints.mutedGray(0.08)} testId="stat-offline" />
              <KPICard label="Bloqués" value={statusCounts.blocked} icon={Ban} iconColor={brand[500]} iconBg={tints.brand(0.08)} testId="stat-blocked" />
            </KPIGrid>

            <div className="flex lg:hidden gap-1 mb-3 bg-white rounded-xl p-1 border border-zinc-100 dark:border-zinc-800">
              {([
                { key: "list" as const, label: "Liste", icon: Menu },
                { key: "info" as const, label: "Details", icon: Truck },
                { key: "map" as const, label: "Carte", icon: Navigation },
              ]).map(tab => (
                <button key={tab.key} onClick={() => setMobilePanel(tab.key)} data-testid={`tab-${tab.key}`}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${mobilePanel === tab.key ? "bg-red-600 text-white shadow-sm" : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
                  <tab.icon size={14} />{tab.label}
                </button>
              ))}
            </div>

            {showForm && (
              <DriverFormModal
                editingDriver={editingDriver}
                onClose={() => { setShowForm(false); setEditingDriver(null); }}
              />
            )}

            {showAlarmModal && (
              <AlarmModal
                driver={showAlarmModal}
                reason={alarmReason}
                onReasonChange={setAlarmReason}
                onSend={sendAlarm}
                onClose={() => { setShowAlarmModal(null); setAlarmReason(""); }}
              />
            )}

            <div className="flex gap-3" style={{ height: "calc(100vh - 340px)", minHeight: 400 }}>
              <div className={`${mobilePanel === "info" ? "flex" : "hidden"} lg:flex w-full lg:w-[280px] xl:w-[300px] shrink-0 flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden`}>
                {sd ? (
                  <DriverDetailPanel
                    driver={sd}
                    activeOrders={sdOrders}
                    deliveredOrders={sdDelivered}
                    getDriverStatus={getDriverStatus}
                    chatMessage={chatMessage}
                    onChatChange={setChatMessage}
                    onSendChat={() => sendQuickMessage(sd.id)}
                    onAlarm={() => setShowAlarmModal(sd)}
                    onEdit={() => startEdit(sd)}
                    onBlock={() => handleBlock(sd.id, sd.isBlocked)}
                    onDelete={() => handleDelete(sd.id)}
                    onBack={() => { setSelectedDriver(null); setMobilePanel("list"); }}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center text-zinc-400">
                      <Truck size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Selectionnez un agent</p>
                      <p className="text-[10px] mt-1">dans la liste pour voir ses details</p>
                    </div>
                  </div>
                )}
              </div>

              <div className={`${mobilePanel === "map" ? "flex" : "hidden"} lg:flex flex-1 flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden`}>
                <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                  <h3 className="font-bold text-xs text-zinc-900 flex items-center gap-2">
                    <Navigation size={12} className="text-red-600" /> Carte en temps reel
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-400">{driversWithLocation.length} visible(s)</span>
                    {sd?.lat && sd?.lng && (
                      <span className="text-[9px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-semibold">{sd.name?.split(" ")[0]}</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 relative" style={{ minHeight: 0 }}>
                  <MapContainer
                    center={sd?.lat && sd?.lng ? [sd.lat, sd.lng] : KINSHASA_CENTER}
                    zoom={sd?.lat ? 16 : 12}
                    style={{ height: "100%", width: "100%", position: "absolute", inset: 0 }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                    <MapInvalidateSize />
                    {sd?.lat && sd?.lng && <MapFlyTo lat={sd.lat} lng={sd.lng} />}
                    {driversWithLocation.map((d: any) => (
                      <Marker key={d.id} position={[d.lat, d.lng]} icon={sd?.id === d.id ? driverIcon : onlineIcon}
                        eventHandlers={{ click: () => selectDriver(d) }}>
                        <Popup>
                          <div className="text-xs min-w-[120px]">
                            <p className="font-bold text-sm">{d.name}</p>
                            <p className="text-zinc-500 dark:text-zinc-400">{d.phone}</p>
                            <p className="capitalize text-zinc-400">{d.vehicleType || "Moto"}</p>
                            {getDriverActiveOrders(d.id).length > 0 && (
                              <p className="text-orange-600 font-semibold mt-1">{getDriverActiveOrders(d.id).length} livraison(s)</p>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>

              <DriverListSidebar
                visible={mobilePanel === "list"}
                filteredDrivers={filteredDrivers}
                selectedDriverId={sd?.id ?? null}
                search={search}
                onSearchChange={setSearch}
                filter={filter}
                onFilterChange={setFilter}
                filterButtons={filterButtons}
                statusCounts={statusCounts}
                getDriverStatus={getDriverStatus}
                getDriverActiveOrders={getDriverActiveOrders}
                onSelect={selectDriver}
                onAdd={() => { setShowForm(true); setEditingDriver(null); }}
              />
            </div>
          </>
        )}
      </TabContent>
    </AdminLayout>
  );
}
