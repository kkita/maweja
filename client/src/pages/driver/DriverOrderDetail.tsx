import { useState, useEffect, useRef } from "react";
import DriverNav from "../../components/DriverNav";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft, MapPin, Phone, MessageCircle, Package,
  User, Clock, CreditCard, Truck, CheckCircle2, Navigation,
  Store, Copy, ChevronDown, ChevronUp,
  Receipt, Wallet, ThumbsUp, ThumbsDown, AlertTriangle, Banknote
} from "lucide-react";
import { formatPrice, formatDate, formatPaymentMethod } from "../../lib/utils";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../hooks/use-toast";
import { DBtn, DStatusBadge } from "../../components/driver/DriverUI";
import { RefuseModal } from "../../components/driver/order-detail/RefuseModal";
import { useDriverOrderDetail } from "../../hooks/use-driver-order-detail";
import { useDriverLocationSharing } from "../../hooks/use-driver-location-sharing";
import type { Order, Restaurant } from "@shared/schema";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";

// ─── Status Timeline ────────────────────────────────────────────────────────────
const STATUS_STEPS = [
  { key: "confirmed", label: "Confirmée",    icon: CheckCircle2 },
  { key: "picked_up", label: "En livraison", icon: Truck },
  { key: "delivered", label: "Livrée",       icon: CheckCircle2 },
];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const statusOrder = STATUS_STEPS.map(s => s.key);
  const currentIdx  = statusOrder.indexOf(currentStatus);

  if (currentStatus === "cancelled") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-driver-red/10 border border-driver-red/20">
        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-driver-red">
          <span className="text-white text-xs font-black">✕</span>
        </div>
        <span className="text-sm font-bold text-driver-red">Commande annulée</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1" data-testid="status-timeline">
      {STATUS_STEPS.map((step, i) => {
        const isDone    = i <= currentIdx;
        const isCurrent = step.key === currentStatus;
        const StepIcon  = step.icon;
        return (
          <div key={step.key} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex flex-col items-center ${isCurrent ? "scale-110" : ""} transition-transform`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isDone ? "bg-driver-accent" : "bg-driver-s3"}`}>
                <StepIcon size={13} className={isDone ? "text-white" : "text-driver-subtle"} />
              </div>
              <span className={`text-[8px] font-bold mt-0.5 whitespace-nowrap ${isDone ? "text-driver-accent" : "text-driver-subtle"}`}>
                {step.label}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`w-4 h-0.5 rounded-full mb-3 ${i < currentIdx ? "bg-driver-accent" : "bg-driver-s3"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Delivery Map ───────────────────────────────────────────────────────────────
function DeliveryMap({ order, restaurant }: { order: Order; restaurant?: Restaurant }) {
  const mapRef       = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const deliveryLat   = order.deliveryLat ?? -4.3222;
    const deliveryLng   = order.deliveryLng ?? 15.3222;
    const restaurantLat = restaurant?.lat ?? null;
    const restaurantLng = restaurant?.lng ?? null;
    const bounds: [number, number][] = [[deliveryLat, deliveryLng]];
    if (restaurantLat && restaurantLng) bounds.push([restaurantLat, restaurantLng]);

    const map = L.map(containerRef.current, { center: [deliveryLat, deliveryLng], zoom: 14, zoomControl: false, attributionControl: false });
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

    if (restaurantLat && restaurantLng) {
      const icon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:#f97316;border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(249,115,22,0.5);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><path d="M3 2h18v20H3z" fill="none"/><path d="M12 6v4M8 6v2M16 6v2"/></svg></div>`,
        className: "", iconSize: [32, 32], iconAnchor: [16, 32],
      });
      L.marker([restaurantLat, restaurantLng], { icon }).addTo(map).bindPopup(`<b>🏪 ${restaurant?.name || "Restaurant"}</b>`);
    }

    if (order.deliveryLat && order.deliveryLng) {
      const icon = L.divIcon({
        html: `<div style="width:36px;height:36px;background:#E10000;border-radius:50%;border:3px solid white;box-shadow:0 4px 12px rgba(225,0,0,0.5);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3" fill="#ff4444"/></svg></div>`,
        className: "", iconSize: [36, 36], iconAnchor: [18, 36],
      });
      L.marker([order.deliveryLat, order.deliveryLng], { icon }).addTo(map).bindPopup(`<b>📍 Livraison</b><br/>${order.deliveryAddress}`);
    }

    if (restaurantLat && restaurantLng && order.deliveryLat && order.deliveryLng) {
      L.polyline([[restaurantLat, restaurantLng], [order.deliveryLat, order.deliveryLng]], { color: "#E10000", weight: 3, opacity: 0.7, dashArray: "8,8" }).addTo(map);
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
    }

    return () => { map.remove(); mapRef.current = null; };
  }, [order.deliveryLat, order.deliveryLng, restaurant?.lat, restaurant?.lng]);

  return <div ref={containerRef} className="w-full h-52 rounded-2xl overflow-hidden" data-testid="order-detail-map" />;
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function DriverOrderDetail() {
  const { user }     = useAuth();
  const { toast }    = useToast();
  const [, navigate] = useLocation();
  const [, params]   = useRoute("/driver/order/:id");
  const orderId      = params?.id ? Number(params.id) : 0;

  const [showAllItems,    setShowAllItems]    = useState(false);
  const [showRefuseModal, setShowRefuseModal] = useState(false);

  const { order, isLoading, restaurant, client, updateStatus, acceptMutation, refuseMutation } = useDriverOrderDetail(orderId);

  // PARTIE 4 — partage GPS pendant la livraison active uniquement
  const isActiveDelivery = !!order && (order.status === "confirmed" || order.status === "picked_up");
  const tracking = useDriverLocationSharing(orderId, isActiveDelivery, 15000);

  if (isLoading || !order) {
    return (
      <div className="min-h-screen pb-28 bg-driver-bg">
        <DriverNav />
        <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-driver-accent border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-driver-subtle">Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  const items           = (order.items as any[]) || [];
  const clientPhone     = order.orderPhone || client?.phone || "";
  const clientName      = order.orderName  || client?.name  || "Client";
  const restaurantPhone = (restaurant as any)?.phone || "";
  const displayItems    = showAllItems ? items : items.slice(0, 4);
  const hasMoreItems    = items.length > 4;
  const isCash          = order.paymentMethod === "cash";

  const openWhatsApp = (phone: string, msg: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const full    = cleaned.startsWith("243") ? cleaned : `243${cleaned.replace(/^0/, "")}`;
    window.open(`https://wa.me/${full}?text=${encodeURIComponent(msg)}`, "_blank");
  };
  const callPhone       = (phone: string) => window.open(`tel:${phone}`, "_self");
  const copyToClipboard = (text: string) => {
    try { navigator.clipboard.writeText(text); toast({ title: "Copié !" }); }
    catch { toast({ title: "Impossible de copier" }); }
  };
  const openNavigation  = (lat: number | null, lng: number | null) => {
    if (lat && lng) window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, "_blank");
  };

  const handleRefuse = (reason: string) => refuseMutation.mutate(reason, { onSuccess: () => setShowRefuseModal(false) });

  return (
    <div className="min-h-screen pb-32 bg-driver-bg">
      <DriverNav />

      {showRefuseModal && (
        <RefuseModal
          isPending={refuseMutation.isPending}
          onClose={() => setShowRefuseModal(false)}
          onConfirm={handleRefuse}
        />
      )}

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm font-semibold transition-all active:opacity-70 text-driver-muted"
            data-testid="button-back-dashboard"
          >
            <ArrowLeft size={16} /> Retour
          </button>
          <DStatusBadge status={order.status} />
        </div>

        <div className="rounded-2xl p-4 bg-driver-surface border border-driver-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xl font-black text-driver-text" data-testid="text-order-number">{order.orderNumber}</p>
              <p className="text-[11px] flex items-center gap-1 mt-0.5 text-driver-subtle">
                <Clock size={11} /> {formatDate(order.createdAt!)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-driver-subtle">Total client</p>
              <p className="text-xl font-black text-driver-accent" data-testid="text-order-total">{formatPrice(order.total)}</p>
            </div>
          </div>
          <StatusTimeline currentStatus={order.status} />

          {isActiveDelivery && (
            <div
              className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-semibold ${
                tracking.gpsActive
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300"
              }`}
              data-testid="status-gps-sharing"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${tracking.gpsActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
              />
              {tracking.gpsActive
                ? `Position partagée${tracking.lastSentAt ? ` · ${new Date(tracking.lastSentAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}`
                : tracking.lastError ?? "GPS indisponible — activez la localisation"}
            </div>
          )}
        </div>

        {order.notes && (
          <div className="rounded-2xl p-4 bg-driver-amber/8 border border-driver-amber/20">
            <p className="text-[10px] font-black uppercase tracking-wider mb-1.5 text-driver-amber">Instructions du client</p>
            <p className="text-sm text-driver-text">{order.notes}</p>
          </div>
        )}

        {restaurant && (
          <div className="rounded-2xl overflow-hidden bg-driver-surface border border-driver-border">
            <div className="px-4 py-3 flex items-center gap-2 bg-driver-orange/8 border-b border-driver-orange/20">
              <Store size={14} className="text-driver-orange" />
              <span className="text-xs font-black uppercase tracking-wider text-driver-orange">Point de récupération</span>
            </div>
            <div className="p-4">
              <p className="font-black text-base text-driver-text mb-2" data-testid="text-restaurant-name">{restaurant.name}</p>
              <div className="flex items-start gap-2 mb-3">
                <MapPin size={13} className="flex-shrink-0 mt-0.5 text-driver-subtle" />
                <p className="text-xs text-driver-muted">{restaurant.address}</p>
              </div>
              <div className="flex gap-2">
                {restaurantPhone && (
                  <button
                    onClick={() => callPhone(restaurantPhone)}
                    data-testid="button-call-restaurant"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 bg-driver-orange/12 text-driver-orange"
                  >
                    <Phone size={13} /> Appeler
                  </button>
                )}
                <button
                  onClick={() => openNavigation(restaurant.lat, restaurant.lng)}
                  data-testid="button-navigate-restaurant"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 bg-driver-orange/12 text-driver-orange"
                >
                  <Navigation size={13} /> Itinéraire
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl overflow-hidden bg-driver-surface border border-driver-border">
          <div className="px-4 py-3 flex items-center gap-2 bg-driver-accent/8 border-b border-driver-accent/20">
            <MapPin size={14} className="text-driver-accent" />
            <span className="text-xs font-black uppercase tracking-wider text-driver-accent">Point de livraison</span>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-driver-accent/10">
                <User size={18} className="text-driver-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-base text-driver-text" data-testid="text-client-name">{clientName}</p>
                {clientPhone && (
                  <button onClick={() => copyToClipboard(clientPhone)} className="flex items-center gap-1 active:opacity-70">
                    <p className="text-xs text-driver-subtle" data-testid="text-client-phone">{clientPhone}</p>
                    <Copy size={10} className="text-driver-subtle" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl mb-3 bg-driver-s2">
              <MapPin size={14} className="flex-shrink-0 mt-0.5 text-driver-red" />
              <p className="text-sm font-medium text-driver-text" data-testid="text-delivery-address">{order.deliveryAddress}</p>
            </div>
            {clientPhone && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => callPhone(clientPhone)}
                  data-testid="button-call-client"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold active:scale-95 transition-all text-white bg-driver-accent shadow-glow-accent"
                >
                  <Phone size={14} /> Appeler
                </button>
                <button
                  onClick={() => openWhatsApp(clientPhone, `Bonjour, je suis votre agent MAWEJA pour la commande ${order.orderNumber}`)}
                  data-testid="button-whatsapp-client"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold active:scale-95 transition-all text-white bg-driver-green shadow-glow-green-sm"
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
              </div>
            )}
            <button
              onClick={() => navigate(`/driver/chat/order/${order.id}`)}
              data-testid="button-chat-client"
              className="w-full mb-2 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold active:scale-95 transition-all text-white bg-blue-600 hover:bg-blue-700"
            >
              <MessageCircle size={14} /> Discuter avec le client
            </button>
            {order.deliveryLat && order.deliveryLng && (
              <button
                onClick={() => openNavigation(order.deliveryLat, order.deliveryLng)}
                data-testid="button-navigate"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white active:scale-[0.98] transition-all bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow-accent"
              >
                <Navigation size={16} /> Ouvrir l'itinéraire GPS
              </button>
            )}
          </div>
        </div>

        <DeliveryMap order={order} restaurant={restaurant} />

        <div className="rounded-2xl overflow-hidden bg-driver-surface border border-driver-border">
          <div className="px-4 py-3 flex items-center justify-between border-b border-driver-border bg-driver-s2">
            <div className="flex items-center gap-2">
              <Receipt size={14} className="text-driver-accent" />
              <span className="text-xs font-black uppercase tracking-wider text-driver-text">Facture détaillée</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-driver-s3 text-driver-muted">
              {items.length} article{items.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="p-4">
            {displayItems.map((item: any, i: number) => (
              <div
                key={i}
                className={`flex items-center justify-between py-3 ${i < displayItems.length - 1 ? "border-b border-driver-border" : ""}`}
                data-testid={`invoice-item-${i}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black bg-driver-accent/12 text-driver-accent">
                    {item.quantity || 1}x
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-driver-text">{item.name}</p>
                    {item.price && <p className="text-[10px] text-driver-subtle">{formatPrice(item.price)} / unité</p>}
                  </div>
                </div>
                <span className="text-sm font-bold text-driver-text">{formatPrice((item.price || 0) * (item.quantity || 1))}</span>
              </div>
            ))}
            {hasMoreItems && (
              <button
                onClick={() => setShowAllItems(!showAllItems)}
                className="w-full flex items-center justify-center gap-1 text-xs font-bold py-2.5 mt-1 rounded-xl transition-all active:opacity-70 text-driver-accent"
                data-testid="button-toggle-items"
              >
                {showAllItems ? <><ChevronUp size={14} /> Voir moins</> : <><ChevronDown size={14} /> {items.length - 4} autres articles</>}
              </button>
            )}
            <div className="space-y-2 mt-3 pt-3 border-t border-driver-border">
              {[
                { label: "Sous-total articles", value: order.subtotal },
                { label: `Frais de livraison${(order as any).deliveryZone ? ` — Zone ${(order as any).deliveryZone}` : ""}`, value: order.deliveryFee },
                { label: "Frais de service", value: order.taxAmount },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-driver-subtle">{label}</span>
                  <span className="font-semibold text-driver-text">{formatPrice(value)}</span>
                </div>
              ))}
              {order.promoDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-driver-green">Réduction {order.promoCode ? `(${order.promoCode})` : ""}</span>
                  <span className="font-semibold text-driver-green">-{formatPrice(order.promoDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-driver-border">
                <span className="text-base font-black text-driver-text">TOTAL CLIENT</span>
                <span className="text-xl font-black text-driver-accent">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-3 rounded-2xl p-4 border ${isCash ? "bg-driver-green/8 border-driver-green/20" : "bg-driver-blue/8 border-driver-blue/20"}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCash ? "bg-driver-green" : "bg-driver-blue"}`}>
            {isCash ? <Banknote size={18} className="text-black" /> : <Phone size={18} className="text-black" />}
          </div>
          <div className="flex-1">
            <p className={`text-[10px] font-bold uppercase tracking-wide ${isCash ? "text-driver-green" : "text-driver-blue"}`}>Mode de paiement</p>
            <p className="text-sm font-black text-driver-text" data-testid="text-payment-method">{formatPaymentMethod(order.paymentMethod)}</p>
            {isCash && <p className="text-[10px] text-driver-subtle">À percevoir à la livraison</p>}
          </div>
          {isCash && <div className="text-2xl font-black text-driver-green">{formatPrice(order.total)}</div>}
        </div>

        <div className="rounded-2xl p-5 bg-[linear-gradient(135deg,rgba(34,197,94,0.15)_0%,rgba(22,163,74,0.1)_100%)] border border-driver-green/25">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider mb-2 text-driver-green">Récapitulatif agent</p>
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-xs text-driver-muted">
                  <span>Total encaissé client</span>
                  <span className="font-semibold text-driver-text">{formatPrice(order.total)}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-driver-green/20">
                <p className="text-[10px] uppercase tracking-wider text-driver-green">Votre gain</p>
                <p className="text-3xl font-black text-driver-text" data-testid="text-driver-earning">{formatPrice(Math.round(order.deliveryFee * 0.8 * 100) / 100)}</p>
                <p className="text-[9px] mt-0.5 text-driver-subtle">80% des frais de livraison ({formatPrice(order.deliveryFee)})</p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-driver-green/20">
              <Wallet size={22} className="text-driver-green" />
            </div>
          </div>
        </div>

        {!["delivered", "cancelled"].includes(order.status) && (
          <div className="space-y-2 pt-1">
            {order.driverId === user?.id && !(order as any).driverAccepted && order.status !== "cancelled" && (
              <div className="rounded-2xl p-5 space-y-4 bg-driver-amber/[0.06] border border-driver-amber/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-driver-amber flex-shrink-0" />
                  <p className="text-sm font-black text-driver-text">Nouvelle commande assignée</p>
                </div>
                <p className="text-xs leading-relaxed text-driver-muted">
                  Vous avez été assigné à cette commande. Acceptez-la pour commencer la livraison ou refusez si vous n'êtes pas disponible.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <DBtn label="Accepter" icon={ThumbsUp} variant="accept" size="lg" loading={acceptMutation.isPending} onClick={() => acceptMutation.mutate()} testId="button-accept-order" fullWidth />
                  <DBtn label="Refuser" icon={ThumbsDown} variant="refuse" size="lg" loading={refuseMutation.isPending} onClick={() => setShowRefuseModal(true)} testId="button-refuse-order" fullWidth />
                </div>
              </div>
            )}
            {(order as any).driverAccepted && ["confirmed", "preparing", "ready", "pending"].includes(order.status) && (
              <DBtn label="Commande Récupérée" icon={Package} variant="blue" size="xl" fullWidth onClick={() => updateStatus("picked_up")} testId="button-pickup" />
            )}
            {order.status === "picked_up" && (
              <DBtn label="Commande Livrée ✓" icon={CheckCircle2} variant="deliver" size="xl" fullWidth onClick={() => updateStatus("delivered")} testId="button-deliver" />
            )}
          </div>
        )}

        <p className="text-center text-[10px] py-2 text-driver-subtle">MAWEJA Agent — Ed Corporation</p>
      </div>
    </div>
  );
}
