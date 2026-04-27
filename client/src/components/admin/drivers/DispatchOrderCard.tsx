import { MapPin, User } from "lucide-react";
import { formatPrice, statusColors, statusLabels } from "../../../lib/utils";
import type { Order } from "@shared/schema";
import { CountdownTimer, ElapsedTime } from "./DriverTimers";
import type { DispatchDriver } from "./types";

interface Props {
  order: Order;
  restaurantName: string;
  showAssign?: boolean;
  assigningOrderId: number | null;
  availableDrivers: DispatchDriver[];
  onStartAssign: (orderId: number) => void;
  onCancelAssign: () => void;
  onAssignDriver: (orderId: number, driverId: number) => void;
}

export default function DispatchOrderCard({ order, restaurantName, showAssign = false, assigningOrderId, availableDrivers, onStartAssign, onCancelAssign, onAssignDriver }: Props) {
  const elapsed = order.createdAt ? Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000) : 0;
  const isUrgent = elapsed >= 45;
  const isApproaching = elapsed >= 30 && elapsed < 45;
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-4" data-testid={`dispatch-order-card-${order.id}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-zinc-900 dark:text-white" data-testid={`order-number-${order.id}`}>{order.orderNumber}</span>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
          {isUrgent && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-red-600 text-white animate-pulse" data-testid={`urgent-badge-${order.id}`}>URGENT</span>}
          {isApproaching && !isUrgent && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700">BIENTOT</span>}
        </div>
        <ElapsedTime createdAt={order.createdAt} />
      </div>
      <p className="text-xs text-zinc-600 mt-1.5">{restaurantName}</p>
      <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 truncate"><MapPin size={9} />{order.deliveryAddress}</p>
      <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
        <span className="text-xs font-bold text-red-600">{formatPrice(order.total)}</span>
        {order.estimatedDelivery && <CountdownTimer estimatedDelivery={order.estimatedDelivery} compact />}
      </div>
      {showAssign && (
        <div className="mt-3 border-t border-zinc-100 dark:border-zinc-800 pt-3">
          {assigningOrderId === order.id ? (
            <div className="space-y-1.5">
              <p className="text-[10px] text-zinc-500 font-semibold">Attribuer a :</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {availableDrivers.map(d => (
                  <button key={d.id} onClick={() => onAssignDriver(order.id, d.id)}
                    data-testid={`assign-driver-${d.id}-to-order-${order.id}`}
                    className="w-full text-left px-3 py-2 bg-zinc-50 rounded-lg text-xs hover:bg-red-50 hover:text-red-700 transition-colors flex items-center justify-between gap-2">
                    <span className="truncate">{d.name}</span>
                    <span className="text-[9px] text-zinc-400 capitalize shrink-0">{d.vehicleType || "Moto"}</span>
                  </button>
                ))}
                {availableDrivers.length === 0 && (
                  <p className="text-[10px] text-zinc-400 text-center py-2">Aucun agent disponible</p>
                )}
              </div>
              <button onClick={onCancelAssign} className="text-[10px] text-zinc-500 hover:text-zinc-700">Annuler</button>
            </div>
          ) : (
            <button onClick={() => onStartAssign(order.id)} data-testid={`button-assign-order-${order.id}`}
              className="w-full py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5">
              <User size={12} /> Attribuer un agent
            </button>
          )}
        </div>
      )}
    </div>
  );
}
