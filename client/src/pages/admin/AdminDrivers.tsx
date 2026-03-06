import { useQuery } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { Truck, MapPin, Phone, Circle, Package } from "lucide-react";
import type { User, Order } from "@shared/schema";

export default function AdminDrivers() {
  const { data: drivers = [] } = useQuery<User[]>({ queryKey: ["/api/drivers"], queryFn: () => fetch("/api/drivers").then((r) => r.json()), refetchInterval: 5000 });
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ["/api/orders"] });

  const getDriverOrders = (driverId: number) => orders.filter((o) => o.driverId === driverId);
  const getDelivered = (driverId: number) => getDriverOrders(driverId).filter((o) => o.status === "delivered");
  const getActive = (driverId: number) => getDriverOrders(driverId).filter((o) => !["delivered", "cancelled"].includes(o.status));

  return (
    <AdminLayout title="Gestion des livreurs">
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
              <Truck size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">{drivers.length}</p>
          <p className="text-sm text-gray-500">Total livreurs</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
              <Circle size={20} className="text-green-600 fill-green-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">{(drivers as any[]).filter((d) => d.isOnline).length}</p>
          <p className="text-sm text-gray-500">En ligne</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center">
              <Circle size={20} className="text-red-600 fill-red-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">{(drivers as any[]).filter((d) => !d.isOnline).length}</p>
          <p className="text-sm text-gray-500">Hors ligne</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Liste des livreurs</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {(drivers as any[]).map((driver) => (
            <div key={driver.id} className="p-5 flex items-center gap-4" data-testid={`driver-row-${driver.id}`}>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center relative">
                <Truck size={20} className="text-gray-600" />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${driver.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{driver.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} /> {driver.phone}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-lg font-black text-gray-900">{getDelivered(driver.id).length}</p>
                <p className="text-[10px] text-gray-400">Livrees</p>
              </div>
              <div className="text-center px-4">
                <p className="text-lg font-black text-gray-900">{getActive(driver.id).length}</p>
                <p className="text-[10px] text-gray-400">En cours</p>
              </div>
              <div className="flex items-center gap-2">
                {driver.lat && driver.lng && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin size={12} /> {driver.lat?.toFixed(4)}, {driver.lng?.toFixed(4)}
                  </span>
                )}
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${driver.isOnline ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {driver.isOnline ? "En ligne" : "Hors ligne"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
