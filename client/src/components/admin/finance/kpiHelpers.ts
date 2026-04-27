import { formatPrice } from "../../../lib/utils";
import type { Order, Restaurant, User } from "@shared/schema";

type OrderExtras = { taxAmount?: number | null };
type RestaurantExtras = { createdAt?: string | Date | null };

export function computeAnalyseKPIs(
  orders: Order[],
  allOrders: Order[],
  users: User[],
  restaurants: Restaurant[],
  restaurantCommissionMap: Map<number, number>,
  fromStr: string,
  toStr: string,
) {
  const from = fromStr ? new Date(fromStr).getTime() : 0;
  const to   = toStr   ? new Date(toStr + "T23:59:59").getTime() : Infinity;

  const periodOrders    = orders.filter(o => o.createdAt && new Date(o.createdAt).getTime() >= from && new Date(o.createdAt).getTime() <= to);
  const activeOrders    = periodOrders.filter(o => o.status !== "cancelled");
  const deliveredOrders = periodOrders.filter(o => o.status === "delivered");
  const cancelledOrders = periodOrders.filter(o => o.status === "cancelled");

  const totalOrders     = periodOrders.length;
  const totalSales      = activeOrders.reduce((s, o) => s + o.total, 0);
  const completedOrders = deliveredOrders.length;
  const cancelledCount  = cancelledOrders.length;
  const lostSales       = cancelledOrders.reduce((s, o) => s + o.total, 0);

  const activeClientIds  = new Set(activeOrders.map(o => o.clientId).filter(Boolean));
  const activeCustomers  = activeClientIds.size;
  const activeDriverIds  = new Set(deliveredOrders.map(o => o.driverId).filter(Boolean));
  const activeDriversCount = activeDriverIds.size;

  const mawejaRevenue = deliveredOrders.reduce((s, o) => {
    const sub   = o.subtotal ?? 0;
    const rate  = restaurantCommissionMap.get(o.restaurantId) ?? 20;
    const comm  = o.commission > 0 ? o.commission : Math.round(sub * rate / 100 * 100) / 100;
    const delMg = Math.round(o.deliveryFee * 0.2 * 100) / 100;
    const svc   = (o as Order & OrderExtras).taxAmount ?? 0;
    return s + comm + delMg + svc;
  }, 0);

  const mawejaLostRevenue = cancelledOrders.reduce((s, o) => {
    const sub  = o.subtotal ?? 0;
    const rate = restaurantCommissionMap.get(o.restaurantId) ?? 20;
    const comm = o.commission > 0 ? o.commission : Math.round(sub * rate / 100 * 100) / 100;
    return s + comm + Math.round(o.deliveryFee * 0.2 * 100) / 100;
  }, 0);

  const totalDriverEarnings = deliveredOrders.reduce((s, o) => s + Math.round(o.deliveryFee * 0.8 * 100) / 100, 0);
  const earningsPerDriver    = activeDriversCount > 0 ? totalDriverEarnings / activeDriversCount : null;
  const deliveriesPerDriver  = activeDriversCount > 0 ? completedOrders / activeDriversCount : null;
  const completedPerCustomer = activeCustomers > 0 ? completedOrders / activeCustomers : null;
  const cancelledPerCustomer = activeCustomers > 0 ? cancelledCount / activeCustomers : null;
  const salesPerCustomer     = activeCustomers > 0 ? totalSales / activeCustomers : null;

  const newRegisteredUsers = users.filter(u => {
    if (!u.createdAt || u.role !== "client") return false;
    const t = new Date(u.createdAt).getTime();
    return t >= from && t <= to;
  }).length;

  const newPartners = restaurants.filter(r => {
    const ts = (r as Restaurant & RestaurantExtras).createdAt;
    if (!ts) return false;
    const t = new Date(ts).getTime();
    return t >= from && t <= to;
  }).length;

  const clientFirstOrder = new Map<number, number>();
  allOrders.forEach(o => {
    if (o.clientId && o.createdAt) {
      const t = new Date(o.createdAt).getTime();
      if (!clientFirstOrder.has(o.clientId) || t < clientFirstOrder.get(o.clientId)!) {
        clientFirstOrder.set(o.clientId, t);
      }
    }
  });
  const firstOrderInPeriod = Array.from(clientFirstOrder.values()).filter(t => t >= from && t <= to).length;

  const partnersWithOrder = new Set(deliveredOrders.map(o => o.restaurantId)).size;

  return {
    totalOrders, totalSales, completedOrders, cancelledCount, lostSales,
    mawejaRevenue, mawejaLostRevenue,
    activeCustomers, activeDriversCount,
    earningsPerDriver, deliveriesPerDriver,
    completedPerCustomer, cancelledPerCustomer, salesPerCustomer,
    newRegisteredUsers, newPartners, firstOrderInPeriod, partnersWithOrder,
  };
}

export function pct(ev: number | null, cmp: number | null): number | null {
  if (ev === null || cmp === null || cmp === 0) return null;
  return ((ev - cmp) / Math.abs(cmp)) * 100;
}

export function fmtVal(v: number | null, mode: "int" | "price" | "dec2" = "int"): string {
  if (v === null || v === undefined) return "--";
  if (mode === "price") return formatPrice(v);
  if (mode === "dec2")  return v.toFixed(2);
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

export const CATEGORY_LABELS: Record<string, string> = {
  order: "Commande", delivery_fee: "Frais livraison", commission: "Commission",
  driver_payment: "Paiement agent", refund: "Remboursement",
  wallet_topup: "Recharge wallet", salary: "Salaire", marketing: "Marketing",
  equipment: "Equipement", other: "Autre",
};
