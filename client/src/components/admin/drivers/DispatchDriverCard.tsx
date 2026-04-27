import { Truck, Phone, Package, MapPin } from "lucide-react";
import { statusColors, statusLabels } from "../../../lib/utils";
import type { Order } from "@shared/schema";
import type { DispatchDriver } from "./types";

interface Props {
  driver: DispatchDriver;
  status: string;
  activeOrders: Order[];
  todayCount: number;
  showActiveOrder?: boolean;
}

export default function DispatchDriverCard({ driver: d, status, activeOrders: active, todayCount, showActiveOrder = true }: Props) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-4" data-testid={`dispatch-driver-card-${d.id}`}>
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            status === "busy" ? "bg-orange-100" : status === "online" ? "bg-green-100" : status === "blocked" ? "bg-red-100" : "bg-zinc-100"
          }`}>
            <Truck size={18} className={
              status === "busy" ? "text-orange-600" : status === "online" ? "text-green-600" : status === "blocked" ? "text-red-600" : "text-zinc-400"
            } />
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${d.isOnline ? "bg-green-500" : "bg-zinc-400"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm text-zinc-900 truncate" data-testid={`driver-name-${d.id}`}>{d.name}</p>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${d.isOnline ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500 dark:text-zinc-400"}`}>
              {d.isOnline ? "EN LIGNE" : "HORS LIGNE"}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Phone size={9} />{d.phone}</span>
            <span className="text-[10px] text-zinc-500 capitalize">{d.vehicleType || "Moto"}{d.vehiclePlate ? ` - ${d.vehiclePlate}` : ""}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[10px] text-zinc-400"><Package size={9} className="inline mr-0.5" />{todayCount} livr. aujourd'hui</span>
            {active.length > 0 && (
              <span className="text-[10px] text-orange-600 font-semibold">{active.length} en cours</span>
            )}
          </div>
        </div>
      </div>
      {showActiveOrder && active.length > 0 && (
        <div className="mt-3 space-y-2">
          {active.map(order => (
            <div key={order.id} className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-100 dark:border-zinc-800" data-testid={`dispatch-driver-order-${order.id}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-[10px] text-zinc-900 dark:text-white">{order.orderNumber}</span>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
              </div>
              <p className="text-[9px] text-zinc-500 mt-1 truncate"><MapPin size={8} className="inline mr-0.5" />{order.deliveryAddress}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
