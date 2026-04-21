import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "../../lib/auth";
import { authFetchJson } from "../../lib/queryClient";
import DriverNav from "../../components/DriverNav";
import { DStatusBadge, DEmptyState, DSkeletonCard, DCard } from "../../components/driver/DriverUI";
import {
  Package, MapPin, CheckCircle2, Truck, RotateCcw, X,
  CreditCard, Banknote, Phone, User, Receipt, Calendar, ChevronRight, DollarSign
} from "lucide-react";
import { formatPrice, formatDate, formatPaymentMethod } from "../../lib/utils";
import type { Order } from "@shared/schema";

const TABS = [
  { key: "active",    label: "En cours",  statuses: ["pending", "confirmed", "picked_up", "preparing", "ready"] },
  { key: "delivered", label: "Livrés",    statuses: ["delivered"] },
  { key: "all",       label: "Tous",      statuses: null },
];

function parseItems(items: any): any[] {
  if (typeof items === "string") { try { return JSON.parse(items); } catch { return []; } }
  return Array.isArray(items) ? items : [];
}

// ─── Detail Sheet ──────────────────────────────────────────────────────────────
function DetailSheet({ order, onClose }: { order: Order; onClose: () => void }) {
  const items      = parseItems(order.items);
  const subtotal   = items.reduce((s: number, it: any) => s + (it.price || 0) * (it.quantity || 1), 0);
  const commission = Math.round(order.total * 0.15);
  const isCash     = order.paymentMethod === "cash";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" data-testid="delivery-detail-popup">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-t-3xl shadow-2xl pb-8 max-h-[90vh] overflow-y-auto bg-driver-surface border border-driver-border2"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-driver-s3" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4 border-b border-driver-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-driver-green/15">
              <CheckCircle2 size={18} className="text-driver-green" />
            </div>
            <div>
              <p className="font-black text-base text-white">{order.orderNumber}</p>
              <p className="text-[10px] font-medium text-driver-subtle">Livraison terminée</p>
            </div>
          </div>
          <button
            onClick={onClose}
            data-testid="button-close-popup"
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 bg-driver-s2 text-driver-subtle"
          >
            <X size={17} />
          </button>
        </div>

        <div className="px-5 pt-4 space-y-3">
          {/* Date */}
          <div className="flex items-center gap-2 text-driver-subtle">
            <Calendar size={13} />
            <span className="text-xs">{formatDate(order.createdAt!)}</span>
            <DStatusBadge status={order.status} />
          </div>

          {/* Payment - PROMINENT */}
          <div className={`rounded-2xl p-4 border ${isCash ? "bg-driver-green/8 border-driver-green/20" : "bg-driver-blue/8 border-driver-blue/20"}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wide mb-2 ${isCash ? "text-driver-green" : "text-driver-blue"}`}>Mode de paiement</p>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCash ? "bg-driver-green" : "bg-driver-blue"}`}>
                {isCash ? <Banknote size={18} className="text-black" /> : <Phone size={18} className="text-black" />}
              </div>
              <div>
                <p className="font-black text-base text-white">{formatPaymentMethod(order.paymentMethod)}</p>
                <p className="text-xs text-driver-subtle">
                  {isCash ? "Paiement à la livraison" : order.paymentMethod === "mobile_money" ? "Mobile Money" : "Carte bancaire"}
                </p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="rounded-2xl p-4 bg-driver-s2">
            <p className="text-[10px] font-bold uppercase tracking-wide mb-2 text-driver-subtle">Adresse de livraison</p>
            <div className="flex items-start gap-2">
              <MapPin size={14} className="flex-shrink-0 mt-0.5 text-driver-red" />
              <p className="text-sm text-white font-medium">{order.deliveryAddress}</p>
            </div>
            {order.deliveryZone && (
              <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-driver-accent/15 text-driver-accent">
                Zone {order.deliveryZone}
              </span>
            )}
          </div>

          {/* Client */}
          {order.orderName && (
            <div className="rounded-2xl p-4 bg-driver-s2">
              <p className="text-[10px] font-bold uppercase tracking-wide mb-2 text-driver-subtle">Client</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-driver-s3">
                  <User size={14} className="text-driver-subtle" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{order.orderName}</p>
                  {order.orderPhone && <p className="text-xs text-driver-subtle">{order.orderPhone}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          {items.length > 0 && (
            <div className="rounded-2xl p-4 bg-driver-s2">
              <p className="text-[10px] font-bold uppercase tracking-wide mb-3 text-driver-subtle">Articles commandés</p>
              <div className="space-y-2">
                {items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-black bg-driver-accent/15 text-driver-accent">
                        {item.quantity || 1}
                      </span>
                      <p className="text-xs text-white font-medium truncate">{item.name}</p>
                    </div>
                    <p className="text-xs font-bold text-white flex-shrink-0">{formatPrice((item.price || 0) * (item.quantity || 1))}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial summary */}
          <div className="rounded-2xl p-4 bg-driver-s2">
            <p className="text-[10px] font-bold uppercase tracking-wide mb-3 text-driver-subtle">Récapitulatif</p>
            <div className="space-y-2">
              {subtotal > 0 && (
                <div className="flex justify-between text-xs text-driver-subtle">
                  <span>Sous-total articles</span>
                  <span className="font-medium text-white">{formatPrice(subtotal)}</span>
                </div>
              )}
              {order.deliveryFee != null && (
                <div className="flex justify-between text-xs text-driver-subtle">
                  <span>Frais de livraison</span>
                  <span className="font-medium text-white">{formatPrice(order.deliveryFee)}</span>
                </div>
              )}
              {order.taxAmount != null && order.taxAmount > 0 && (
                <div className="flex justify-between text-xs text-driver-subtle">
                  <span>Frais de service</span>
                  <span className="font-medium text-white">{formatPrice(order.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-white pt-2 border-t border-driver-border">
                <span>Total commande</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Commission */}
          <div className="rounded-2xl p-4 bg-driver-green/[0.06] border border-driver-green/15">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-driver-green">Votre commission</p>
                <p className="text-2xl font-black text-driver-green">{formatPrice(commission)}</p>
                <p className="text-[10px] mt-0.5 text-driver-subtle">15% du total commande</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-driver-green">
                <Receipt size={22} className="text-black" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pt-4">
          <button
            onClick={onClose}
            data-testid="button-close-popup-bottom"
            className="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] bg-driver-s2 text-driver-muted"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Order Card ────────────────────────────────────────────────────────────────
function OrderCard({ order, onTap }: { order: Order; onTap: () => void }) {
  const [, navigate] = useLocation();
  const items      = parseItems(order.items);
  const commission = Math.round(order.total * 0.15);
  const isCash     = order.paymentMethod === "cash";
  const isDelivered = order.status === "delivered";
  const isActive   = ["picked_up", "confirmed", "preparing", "ready"].includes(order.status);

  return (
    <DCard onClick={onTap} className="active:scale-[0.99] transition-transform">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isDelivered ? "bg-driver-green/15" : isActive ? "bg-driver-blue/15" : "bg-driver-amber/15"
            }`}>
              {isDelivered ? (
                <CheckCircle2 size={18} className="text-driver-green" />
              ) : isActive ? (
                <Truck size={18} className="text-driver-blue" />
              ) : (
                <Package size={18} className="text-driver-amber" />
              )}
            </div>
            <div>
              <p className="font-black text-sm text-white">{order.orderNumber}</p>
              <p className="text-[10px] font-medium text-driver-subtle">{formatDate(order.createdAt!)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DStatusBadge status={order.status} />
            <ChevronRight size={15} className="text-driver-subtle" />
          </div>
        </div>

        <div className="flex items-start gap-2 mb-3">
          <MapPin size={13} className="flex-shrink-0 mt-0.5 text-driver-red" />
          <p className="text-xs text-white leading-snug line-clamp-2">{order.deliveryAddress}</p>
        </div>

        {/* Payment row */}
        <div className="flex items-center gap-2 mb-3">
          {isCash
            ? <Banknote size={13} className="text-driver-green" />
            : <Phone size={13} className="text-driver-blue" />
          }
          <p className={`text-xs font-semibold ${isCash ? "text-driver-green" : "text-driver-blue"}`}>
            {isCash ? "Cash" : formatPaymentMethod(order.paymentMethod)}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-driver-border">
          <div>
            <p className="text-[10px] font-medium text-driver-subtle">Commission agent</p>
            <p className="text-sm font-black text-white">
              {formatPrice(commission)}
              <span className="text-[10px] font-normal ml-1 text-driver-subtle">/ {formatPrice(order.total)}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium text-driver-subtle">Articles</p>
            <p className="text-sm font-bold text-white">{items.length}</p>
          </div>
        </div>
      </div>
    </DCard>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DriverOrders() {
  const { user }     = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab]           = useState("active");
  const [selectedDelivery, setSelectedDelivery] = useState<Order | null>(null);

  const { data: orders = [], isLoading, refetch } = useQuery<Order[]>({
    queryKey: ["/api/orders", { driverId: user?.id }],
    queryFn: () => authFetchJson(`/api/orders?driverId=${user?.id}`),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const filtered = orders.filter(o => {
    const tab = TABS.find(t => t.key === activeTab);
    if (!tab?.statuses) return true;
    return tab.statuses.includes(o.status);
  });

  const activeCount    = orders.filter(o => ["picked_up", "confirmed", "pending", "preparing", "ready"].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === "delivered").length;
  const totalEarnings  = orders.filter(o => o.status === "delivered").reduce((s, o) => s + Math.round(o.total * 0.15), 0);

  const handleTap = (order: Order) => {
    if (order.status === "delivered") setSelectedDelivery(order);
    else navigate(`/driver/order/${order.id}`);
  };

  const statsData = [
    { label: "En cours", value: activeCount,          tc: "text-driver-blue"  },
    { label: "Livrés",   value: deliveredCount,        tc: "text-driver-green" },
    { label: "Gains",    value: `$${totalEarnings}`,   tc: "text-driver-amber" },
  ];

  return (
    <div className="min-h-screen pb-28 bg-driver-bg">
      <DriverNav />

      {selectedDelivery && (
        <DetailSheet order={selectedDelivery} onClose={() => setSelectedDelivery(null)} />
      )}

      <div className="max-w-lg mx-auto px-4 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-white">Mes livraisons</h2>
            <p className="text-xs mt-0.5 text-driver-subtle">{orders.length} livraison{orders.length !== 1 ? "s" : ""} au total</p>
          </div>
          <button
            onClick={() => refetch()}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 bg-driver-surface border border-driver-border text-driver-subtle"
            data-testid="button-refresh-orders"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {statsData.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-3 text-center bg-driver-surface border border-driver-border"
              data-testid={`stat-driver-${s.label.toLowerCase()}`}
            >
              <p className={`text-xl font-black ${s.tc}`}>{s.value}</p>
              <p className="text-[10px] font-semibold mt-0.5 text-driver-subtle">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-5 p-1.5 rounded-2xl bg-driver-surface border border-driver-border">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              data-testid={`tab-orders-${tab.key}`}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? "bg-driver-accent text-white shadow-glow-accent"
                  : "bg-transparent text-driver-subtle"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <DSkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <DEmptyState
            icon={Package}
            title="Aucune livraison"
            description={activeTab === "active" ? "Pas de livraison en cours pour le moment" : "Aucune livraison dans cette catégorie"}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <OrderCard key={order.id} order={order} onTap={() => handleTap(order)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
