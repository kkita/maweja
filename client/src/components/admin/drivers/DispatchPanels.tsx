import { useState } from "react";
import { Truck, MapPin, Package, ChevronUp, ChevronDown, CheckCircle2 } from "lucide-react";
import { formatPrice, formatDate, statusLabels, statusColors, formatPaymentMethod } from "../../../lib/utils";
import { EmptyState } from "../AdminUI";
import type { Order } from "@shared/schema";
import { CountdownTimer } from "./DriverTimers";
import DispatchDriverCard from "./DispatchDriverCard";
import DispatchOrderCard from "./DispatchOrderCard";
import type { DispatchDriver } from "./types";

type DispatchTab = "unassigned" | "assigned" | "completed" | "free" | "busy" | "offline" | "gestion";

interface Props {
  dispatchTab: DispatchTab;
  drivers: DispatchDriver[];
  unassignedOrders: Order[];
  assignedOrders: Order[];
  assignedByDriver: Map<number, Order[]>;
  completedOrders: Order[];
  freeDrivers: DispatchDriver[];
  busyDrivers: DispatchDriver[];
  offlineDrivers: DispatchDriver[];
  availableDriversForAssign: DispatchDriver[];
  assigningOrderId: number | null;
  setAssigningOrderId: (n: number | null) => void;
  handleAssignDriver: (orderId: number, driverId: number) => void;
  getRestaurantName: (rid: number) => string;
  getDriverActiveOrders: (driverId: number) => Order[];
  getDriverStatus: (d: DispatchDriver) => string;
  getDriverTodayDeliveries: (driverId: number) => number;
}

export default function DispatchPanels(props: Props) {
  const {
    dispatchTab, drivers, unassignedOrders, assignedOrders, assignedByDriver,
    completedOrders, freeDrivers, busyDrivers, offlineDrivers, availableDriversForAssign,
    assigningOrderId, setAssigningOrderId, handleAssignDriver,
    getRestaurantName, getDriverActiveOrders, getDriverStatus, getDriverTodayDeliveries,
  } = props;

  const [expandedBusyDriver, setExpandedBusyDriver] = useState<number | null>(null);

  const renderOrder = (order: Order, showAssign = false) => (
    <DispatchOrderCard
      key={order.id}
      order={order}
      restaurantName={getRestaurantName(order.restaurantId)}
      showAssign={showAssign}
      assigningOrderId={assigningOrderId}
      availableDrivers={availableDriversForAssign}
      onStartAssign={(id) => setAssigningOrderId(id)}
      onCancelAssign={() => setAssigningOrderId(null)}
      onAssignDriver={handleAssignDriver}
    />
  );

  const renderDriver = (d: DispatchDriver, showActiveOrder = false) => (
    <DispatchDriverCard
      key={d.id}
      driver={d}
      status={getDriverStatus(d)}
      activeOrders={getDriverActiveOrders(d.id)}
      todayCount={getDriverTodayDeliveries(d.id)}
      showActiveOrder={showActiveOrder}
    />
  );

  switch (dispatchTab) {
    case "unassigned":
      return (
        <div>
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white" data-testid="tab-title-unassigned">Commandes non attribuees ({unassignedOrders.length})</h2>
          </div>
          {unassignedOrders.length === 0 ? (
            <EmptyState icon={Package} title="Aucune commande non attribuée" description="Toutes les commandes ont été attribuées." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {unassignedOrders.map(o => renderOrder(o, true))}
            </div>
          )}
        </div>
      );

    case "assigned":
      return (
        <div>
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white" data-testid="tab-title-assigned">Commandes attribuees ({assignedOrders.length})</h2>
          </div>
          {assignedByDriver.size === 0 ? (
            <EmptyState icon={Package} title="Aucune commande attribuée" description="Aucun agent n'a de commande en cours." />
          ) : (
            <div className="space-y-4">
              {Array.from(assignedByDriver.entries()).map(([driverId, driverOrders]) => {
                const driver = drivers.find(d => d.id === driverId);
                return (
                  <div key={driverId} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden" data-testid={`assigned-driver-group-${driverId}`}>
                    <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3 flex-wrap">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-orange-100`}>
                        <Truck size={14} className="text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-zinc-900 truncate">{driver?.name || `Agent #${driverId}`}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{driver?.phone} - {driver?.vehicleType || "Moto"}</p>
                      </div>
                      <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-lg">{driverOrders.length} commande(s)</span>
                    </div>
                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {driverOrders.map(order => (
                        <div key={order.id} className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 dark:border-zinc-800" data-testid={`assigned-order-${order.id}`}>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-bold text-xs text-zinc-900 dark:text-white">{order.orderNumber}</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                          </div>
                          <p className="text-[10px] text-zinc-600 mt-1">{getRestaurantName(order.restaurantId)}</p>
                          <p className="text-[9px] text-zinc-500 mt-0.5 truncate"><MapPin size={8} className="inline mr-0.5" />{order.deliveryAddress}</p>
                          <div className="flex items-center justify-between mt-1.5 gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-red-600">{formatPrice(order.total)}</span>
                            {order.estimatedDelivery && <CountdownTimer estimatedDelivery={order.estimatedDelivery} compact />}
                          </div>
                          <p className="text-[9px] text-zinc-500 mt-0.5">{formatPaymentMethod(order.paymentMethod)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );

    case "completed":
      return (
        <div>
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white" data-testid="tab-title-completed">Commandes completees ({completedOrders.length})</h2>
          </div>
          {completedOrders.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Aucune commande livrée" description="Les commandes livrées apparaîtront ici." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {completedOrders.map(order => {
                const isOnTime = order.estimatedDelivery && order.updatedAt
                  ? new Date(order.updatedAt).getTime() <= new Date(order.estimatedDelivery).getTime()
                  : null;
                const driver = order.driverId ? drivers.find(d => d.id === order.driverId) : null;
                return (
                  <div key={order.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-4" data-testid={`completed-order-${order.id}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white">{order.orderNumber}</span>
                      {isOnTime === true && <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-green-100 text-green-700" data-testid={`ontime-badge-${order.id}`}>A l'heure</span>}
                      {isOnTime === false && <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700" data-testid={`late-badge-${order.id}`}>En retard</span>}
                      {isOnTime === null && <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-500 dark:text-zinc-400">--</span>}
                    </div>
                    <p className="text-xs text-zinc-600 mt-1.5">{getRestaurantName(order.restaurantId)}</p>
                    <p className="text-[10px] text-zinc-500 mt-1 truncate"><MapPin size={9} className="inline mr-0.5" />{order.deliveryAddress}</p>
                    <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                      <span className="text-xs font-bold text-red-600">{formatPrice(order.total)}</span>
                      {driver && <span className="text-[10px] text-zinc-500 dark:text-zinc-400"><Truck size={9} className="inline mr-0.5" />{driver.name}</span>}
                    </div>
                    <p className="text-[9px] text-zinc-500 mt-1" data-testid={`payment-method-${order.id}`}>{formatPaymentMethod(order.paymentMethod)}</p>
                    {order.updatedAt && <p className="text-[9px] text-zinc-400 mt-1.5">{formatDate(order.updatedAt)}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );

    case "free":
      return (
        <div>
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white" data-testid="tab-title-free">Agents disponibles ({freeDrivers.length})</h2>
          </div>
          {freeDrivers.length === 0 ? (
            <EmptyState icon={Truck} title="Aucun agent disponible" description="Tous les agents sont occupés ou hors ligne." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {freeDrivers.map(d => renderDriver(d, false))}
            </div>
          )}
        </div>
      );

    case "busy":
      return (
        <div>
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white" data-testid="tab-title-busy">Agents occupes ({busyDrivers.length})</h2>
          </div>
          {busyDrivers.length === 0 ? (
            <EmptyState icon={Truck} title="Aucun agent occupé" description="Aucun agent n'est en livraison actuellement." />
          ) : (
            <div className="space-y-3">
              {busyDrivers.map(d => {
                const active = getDriverActiveOrders(d.id);
                const todayCount = getDriverTodayDeliveries(d.id);
                const isExpanded = expandedBusyDriver === d.id;
                return (
                  <div key={d.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden" data-testid={`busy-driver-card-${d.id}`}>
                    <button onClick={() => setExpandedBusyDriver(isExpanded ? null : d.id)}
                      data-testid={`toggle-busy-driver-${d.id}`}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-orange-100 shrink-0`}>
                        <Truck size={18} className="text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-zinc-900 truncate">{d.name}</p>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">({active.length} commandes)</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{d.phone}</span>
                          <span className="text-[10px] text-zinc-500 capitalize">{d.vehicleType || "Moto"}</span>
                          <span className="text-[10px] text-zinc-400">{todayCount} livr. aujourd'hui</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-zinc-400 shrink-0" /> : <ChevronDown size={16} className="text-zinc-400 shrink-0" />}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-3 border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-2">
                        {active.map(order => (
                          <div key={order.id} className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 dark:border-zinc-800" data-testid={`busy-driver-order-${order.id}`}>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-bold text-xs text-zinc-900 dark:text-white">{order.orderNumber}</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                            </div>
                            <p className="text-[10px] text-zinc-600 mt-1">{getRestaurantName(order.restaurantId)}</p>
                            <p className="text-[9px] text-zinc-500 mt-0.5 truncate"><MapPin size={8} className="inline mr-0.5" />{order.deliveryAddress}</p>
                            <div className="flex items-center justify-between mt-1.5 gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-red-600">{formatPrice(order.total)}</span>
                              {order.estimatedDelivery && <CountdownTimer estimatedDelivery={order.estimatedDelivery} compact />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );

    case "offline":
      return (
        <div>
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white" data-testid="tab-title-offline">Agents hors ligne ({offlineDrivers.length})</h2>
          </div>
          {offlineDrivers.length === 0 ? (
            <EmptyState icon={Truck} title="Tous les agents sont en ligne" description="Aucun agent hors ligne pour le moment." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {offlineDrivers.map(d => renderDriver(d, false))}
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}
