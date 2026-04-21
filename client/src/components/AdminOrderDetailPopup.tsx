import {
  MapPin, User, Banknote, CreditCard, Phone, Wallet, Receipt,
  CheckCircle2, Truck, Store, Calendar, Package, UserCheck, ClipboardList
} from "lucide-react";
import { formatPrice, formatDate, statusLabels, statusColors, formatPaymentMethod } from "../lib/utils";
import type { Order } from "@shared/schema";
import { DrawerPanel, AdminBadge } from "./admin/AdminUI";

const PAYMENT_ICONS: Record<string, any> = {
  cash: Banknote,
  card: CreditCard,
  mobile_money: Phone,
};

function parseItems(items: any): any[] {
  if (typeof items === "string") {
    try { return JSON.parse(items); } catch { return []; }
  }
  return Array.isArray(items) ? items : [];
}

interface AdminOrderDetailPopupProps {
  order: Order;
  onClose: () => void;
  driverName?: string;
  restaurantName?: string;
}

const STATUS_BADGE_MAP: Record<string, any> = {
  delivered: "green",
  cancelled: "red",
  returned: "amber",
  confirmed: "blue",
  picked_up: "blue",
  pending: "amber",
};

function InfoBlock({ label, children, className = "" }: { label: string; children: any; className?: string }) {
  return (
    <div className={`bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-4 ${className}`}>
      <p className="text-[9.5px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">{label}</p>
      {children}
    </div>
  );
}

export default function AdminOrderDetailPopup({ order, onClose, driverName, restaurantName }: AdminOrderDetailPopupProps) {
  const items = parseItems(order.items);
  const subtotal = items.reduce((s: number, it: any) => s + (it.price || 0) * (it.quantity || 1), 0);
  const commission = order.commission ?? Math.round(order.total * 0.15);
  const PayIcon = PAYMENT_ICONS[order.paymentMethod] || Wallet;
  const badgeVariant = STATUS_BADGE_MAP[order.status] ?? "gray";
  const icon = order.status === "delivered" ? CheckCircle2 : order.status === "picked_up" ? Truck : Package;
  const StatusIcon = icon;

  return (
    <DrawerPanel
      open
      onClose={onClose}
      title={order.orderNumber}
      subtitle="Détails de la commande"
      testId="admin-order-detail-popup"
    >
      <div className="px-6 py-5 space-y-4 pb-8">

        {/* Status + Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              order.status === "delivered" ? "bg-emerald-100 dark:bg-emerald-900/40" :
              order.status === "cancelled" ? "bg-red-100 dark:bg-red-900/40" :
              "bg-blue-100 dark:bg-blue-900/40"
            }`}>
              <StatusIcon size={15} className={
                order.status === "delivered" ? "text-emerald-600" :
                order.status === "cancelled" ? "text-rose-600" : "text-blue-600"
              } />
            </div>
            <AdminBadge variant={badgeVariant}>{statusLabels[order.status]}</AdminBadge>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
            <Calendar size={11} />
            <span>{formatDate(order.createdAt!)}</span>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-100 dark:border-blue-900/40">
          <p className="text-[9.5px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-2.5">Mode de paiement</p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
              <PayIcon size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-[13px] text-zinc-900 dark:text-zinc-100">{formatPaymentMethod(order.paymentMethod)}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {order.paymentMethod === "cash" ? "Paiement à la livraison" :
                 order.paymentMethod === "card" ? "Carte bancaire" :
                 order.paymentMethod === "mobile_money" ? "Mobile Money (M-Pesa / Airtel)" : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Restaurant */}
        {(restaurantName || order.restaurantId) && (
          <InfoBlock label="Établissement">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Store size={13} className="text-orange-600" />
              </div>
              <p className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
                {restaurantName || `Établissement #${order.restaurantId}`}
              </p>
            </div>
          </InfoBlock>
        )}

        {/* Client + Driver */}
        <div className="grid grid-cols-2 gap-3">
          {(order.orderName || order.clientId) && (
            <InfoBlock label="Client">
              <div className="flex items-center gap-2">
                <User size={13} className="text-zinc-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{order.orderName || `Client #${order.clientId}`}</p>
                  {order.orderPhone && <p className="text-[10px] text-zinc-400 truncate">{order.orderPhone}</p>}
                </div>
              </div>
            </InfoBlock>
          )}
          {(driverName || order.driverId) && (
            <InfoBlock label="Agent livreur">
              <div className="flex items-center gap-2">
                <UserCheck size={13} className="text-emerald-500 flex-shrink-0" />
                <p className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{driverName || `Agent #${order.driverId}`}</p>
              </div>
            </InfoBlock>
          )}
        </div>

        {/* Adresse */}
        <InfoBlock label="Adresse de livraison">
          <div className="flex items-start gap-2">
            <MapPin size={12} className="text-rose-500 mt-0.5 flex-shrink-0" />
            <p className="text-[12px] text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">{order.deliveryAddress}</p>
          </div>
          {order.deliveryZone && (
            <span className="mt-2 inline-block text-[10px] font-bold px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-md">
              Zone {order.deliveryZone}
            </span>
          )}
        </InfoBlock>

        {/* Articles */}
        {items.length > 0 && (
          <InfoBlock label={`Articles commandés (${items.length})`}>
            <div className="space-y-2">
              {items.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-black rounded-md flex items-center justify-center flex-shrink-0">
                      {item.quantity || 1}
                    </span>
                    <p className="text-[12px] text-zinc-700 dark:text-zinc-300 font-medium truncate">{item.name}</p>
                  </div>
                  <p className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 flex-shrink-0">
                    {formatPrice((item.price || 0) * (item.quantity || 1))}
                  </p>
                </div>
              ))}
            </div>
          </InfoBlock>
        )}

        {/* Récapitulatif financier */}
        <InfoBlock label="Récapitulatif financier">
          <div className="space-y-2.5">
            {subtotal > 0 && (
              <div className="flex justify-between text-[12px] text-zinc-500 dark:text-zinc-400">
                <span>Sous-total articles</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatPrice(subtotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-[12px] text-zinc-500 dark:text-zinc-400">
              <span>Frais de livraison</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatPrice(order.deliveryFee)}</span>
            </div>
            {order.taxAmount > 0 && (
              <div className="flex justify-between text-[12px] text-zinc-500 dark:text-zinc-400">
                <span>Frais de service</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatPrice(order.taxAmount)}</span>
              </div>
            )}
            {order.promoDiscount > 0 && (
              <div className="flex justify-between text-[12px] text-emerald-600 dark:text-emerald-400">
                <span>Remise promo</span>
                <span className="font-semibold">-{formatPrice(order.promoDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-[14px] text-zinc-900 dark:text-zinc-50 pt-3 border-t border-zinc-200 dark:border-zinc-700">
              <span>Total commande</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </InfoBlock>

        {/* Commission MAWEJA */}
        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
          <div>
            <p className="text-[9.5px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Commission MAWEJA</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatPrice(commission)}</p>
            <p className="text-[10px] text-emerald-500 mt-0.5">
              {order.total > 0 ? Math.round((commission / order.total) * 100) : 15}% du total
            </p>
          </div>
          <div className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <Receipt size={20} className="text-white" />
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <InfoBlock label="Notes">
            <p className="text-[12px] text-zinc-700 dark:text-zinc-300 leading-relaxed">{order.notes}</p>
          </InfoBlock>
        )}

        {/* Remarque agent */}
        {(order as any).remark && (
          <InfoBlock label="Remarque">
            <div className="flex items-start gap-2">
              <ClipboardList size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-zinc-700 dark:text-zinc-300 leading-relaxed">{(order as any).remark}</p>
            </div>
          </InfoBlock>
        )}

        <button
          onClick={onClose}
          data-testid="button-close-admin-popup-bottom"
          className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-[13px] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors active:scale-[0.99]"
        >
          Fermer
        </button>
      </div>
    </DrawerPanel>
  );
}
