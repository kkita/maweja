import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { authFetchJson, apiRequest, queryClient } from "../../lib/queryClient";
import DriverNav from "../../components/DriverNav";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft, MapPin, Phone, MessageCircle, Package,
  User, Clock, CreditCard, Truck, CheckCircle2, Navigation,
  Store, Copy, ChevronDown, ChevronUp,
  Receipt, Wallet
} from "lucide-react";
import { formatPrice, statusLabels, statusColors, formatDate, formatPaymentMethod } from "../../lib/utils";
import { useToast } from "../../hooks/use-toast";
import type { Order, Restaurant, User as UserType } from "@shared/schema";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";

const STATUS_STEPS = [
  { key: "confirmed", label: "Confirmée", icon: CheckCircle2 },
  { key: "preparing", label: "Préparation", icon: Clock },
  { key: "ready", label: "Prête", icon: Package },
  { key: "picked_up", label: "Récupérée", icon: Truck },
  { key: "delivered", label: "Livrée", icon: CheckCircle2 },
];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const statusOrder = STATUS_STEPS.map(s => s.key);
  const currentIdx = statusOrder.indexOf(currentStatus);

  if (currentStatus === "cancelled") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 rounded-xl">
        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
          <span className="text-white text-xs font-bold">✕</span>
        </div>
        <span className="text-sm font-bold text-red-600">Commande annulée</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1" data-testid="status-timeline">
      {STATUS_STEPS.map((step, i) => {
        const isDone = i <= currentIdx;
        const isCurrent = step.key === currentStatus;
        const StepIcon = step.icon;
        return (
          <div key={step.key} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex flex-col items-center ${isCurrent ? "scale-110" : ""} transition-transform`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                isDone ? "bg-red-600 shadow-sm shadow-red-200 dark:shadow-none" : "bg-gray-200 dark:bg-gray-700"
              }`}>
                <StepIcon size={13} className={isDone ? "text-white" : "text-gray-400"} />
              </div>
              <span className={`text-[8px] font-bold mt-0.5 whitespace-nowrap ${isDone ? "text-red-600" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`w-4 h-0.5 rounded-full mb-3 ${i < currentIdx ? "bg-red-600" : "bg-gray-200 dark:bg-gray-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DeliveryMap({ order, restaurant }: { order: Order; restaurant?: Restaurant }) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const deliveryLat = order.deliveryLat ?? -4.3222;
    const deliveryLng = order.deliveryLng ?? 15.3222;
    const restaurantLat = restaurant?.lat ?? null;
    const restaurantLng = restaurant?.lng ?? null;

    const bounds: [number, number][] = [[deliveryLat, deliveryLng]];
    if (restaurantLat && restaurantLng) {
      bounds.push([restaurantLat, restaurantLng]);
    }

    const map = L.map(containerRef.current, {
      center: [deliveryLat, deliveryLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

    if (restaurantLat && restaurantLng) {
      const restaurantIcon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:#f97316;border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(249,115,22,0.4);display:flex;align-items:center;justify-content:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><path d="M3 2h18v20H3z" fill="none"/><path d="M12 6v4M8 6v2M16 6v2"/></svg>
        </div>`,
        className: "", iconSize: [32, 32], iconAnchor: [16, 32],
      });
      L.marker([restaurantLat, restaurantLng], { icon: restaurantIcon })
        .addTo(map)
        .bindPopup(`<b>🏪 ${restaurant?.name || "Restaurant"}</b><br/>${restaurant?.address || ""}`);
    }

    if (order.deliveryLat && order.deliveryLng) {
      const deliveryIcon = L.divIcon({
        html: `<div style="width:36px;height:36px;background:#dc2626;border-radius:50%;border:3px solid white;box-shadow:0 4px 12px rgba(220,38,38,0.5);display:flex;align-items:center;justify-content:center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3" fill="#dc2626"/></svg>
        </div>`,
        className: "", iconSize: [36, 36], iconAnchor: [18, 36],
      });
      L.marker([order.deliveryLat, order.deliveryLng], { icon: deliveryIcon })
        .addTo(map)
        .bindPopup(`<b>📍 Livraison</b><br/>${order.deliveryAddress}`);
    }

    if (restaurantLat && restaurantLng && order.deliveryLat && order.deliveryLng) {
      const routeLine = L.polyline(
        [[restaurantLat, restaurantLng], [order.deliveryLat, order.deliveryLng]],
        { color: "#dc2626", weight: 3, opacity: 0.7, dashArray: "8, 8" }
      );
      routeLine.addTo(map);

      const allBounds = L.latLngBounds(bounds);
      map.fitBounds(allBounds, { padding: [40, 40] });
    }

    return () => { map.remove(); mapRef.current = null; };
  }, [order.deliveryLat, order.deliveryLng, restaurant?.lat, restaurant?.lng]);

  return <div ref={containerRef} className="w-full h-56 rounded-2xl overflow-hidden" data-testid="order-detail-map" />;
}

export default function DriverOrderDetail() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/driver/order/:id");
  const orderId = params?.id ? Number(params.id) : 0;
  const [showAllItems, setShowAllItems] = useState(false);

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["/api/orders", orderId],
    queryFn: () => authFetchJson(`/api/orders/${orderId}`),
    enabled: orderId > 0,
  });

  const { data: restaurant } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", order?.restaurantId],
    queryFn: () => authFetchJson(`/api/restaurants/${order?.restaurantId}`),
    enabled: !!order?.restaurantId,
  });

  const { data: client } = useQuery<UserType>({
    queryKey: ["/api/users", order?.clientId],
    queryFn: () => authFetchJson(`/api/users/${order?.clientId}`),
    enabled: !!order?.clientId,
  });

  const updateStatus = async (status: string) => {
    try {
      await apiRequest(`/api/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", orderId] });
      toast({ title: status === "delivered" ? "Livraison terminée! 🎉" : "Statut mis à jour" });
    } catch {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    }
  };

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-28">
        <DriverNav />
        <div className="max-w-lg mx-auto px-4 py-8 text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 mt-3">Chargement...</p>
        </div>
      </div>
    );
  }

  const items = (order.items as any[]) || [];
  const clientPhone = order.orderPhone || client?.phone || "";
  const clientName = order.orderName || client?.name || "Client";
  const restaurantPhone = (restaurant as any)?.phone || "";
  const displayItems = showAllItems ? items : items.slice(0, 4);
  const hasMoreItems = items.length > 4;

  const openWhatsApp = (phone: string, msg: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const fullPhone = cleaned.startsWith("243") ? cleaned : `243${cleaned.replace(/^0/, "")}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const callPhone = (phone: string) => {
    window.open(`tel:${phone}`, "_self");
  };

  const copyToClipboard = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      toast({ title: "Copié !" });
    } catch {
      toast({ title: "Impossible de copier" });
    }
  };

  const openNavigation = (lat: number | null, lng: number | null) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-28">
      <DriverNav />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">

        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 font-semibold"
            data-testid="button-back-dashboard">
            <ArrowLeft size={16} /> Retour
          </button>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${statusColors[order.status]}`} data-testid="text-order-status">
            {statusLabels[order.status]}
          </span>
        </div>

        <div className="bg-white dark:bg-[#141417] rounded-2xl border border-gray-100 dark:border-gray-800/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight" data-testid="text-order-number">{order.orderNumber}</p>
              <p className="text-[11px] text-gray-400 flex items-center gap-1"><Clock size={11} /> {formatDate(order.createdAt!)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-lg font-extrabold text-red-600" data-testid="text-order-total">{formatPrice(order.total)}</p>
            </div>
          </div>
          <StatusTimeline currentStatus={order.status} />
        </div>

        {order.notes && (
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-800/30 p-3">
            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Instructions du client</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{order.notes}</p>
          </div>
        )}

        {restaurant && (
          <div className="bg-white dark:bg-[#141417] rounded-2xl border border-gray-100 dark:border-gray-800/50 overflow-hidden">
            <div className="px-4 py-2.5 bg-orange-50 dark:bg-orange-950/20 border-b border-orange-100 dark:border-orange-900/30 flex items-center gap-2">
              <Store size={14} className="text-orange-600" />
              <span className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Point de récupération</span>
            </div>
            <div className="p-4">
              <p className="font-bold text-gray-900 dark:text-white text-sm" data-testid="text-restaurant-name">{restaurant.name}</p>
              <div className="flex items-start gap-2 mt-2">
                <MapPin size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-500 dark:text-gray-400">{restaurant.address}</p>
              </div>
              <div className="flex gap-2 mt-3">
                {restaurantPhone && (
                  <button onClick={() => callPhone(restaurantPhone)} data-testid="button-call-restaurant"
                    className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-xl text-xs font-bold active:scale-95 transition-all">
                    <Phone size={13} /> Appeler
                  </button>
                )}
                <button onClick={() => openNavigation(restaurant.lat, restaurant.lng)} data-testid="button-navigate-restaurant"
                  className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-xl text-xs font-bold active:scale-95 transition-all">
                  <Navigation size={13} /> Itinéraire
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-[#141417] rounded-2xl border border-gray-100 dark:border-gray-800/50 overflow-hidden">
          <div className="px-4 py-2.5 bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30 flex items-center gap-2">
            <MapPin size={14} className="text-red-600" />
            <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Point de livraison</span>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-50 dark:bg-red-950/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm" data-testid="text-client-name">{clientName}</p>
                {clientPhone && (
                  <button onClick={() => copyToClipboard(clientPhone)} className="flex items-center gap-1 group">
                    <p className="text-xs text-gray-500" data-testid="text-client-phone">{clientPhone}</p>
                    <Copy size={10} className="text-gray-300 group-hover:text-red-500 transition-colors" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl mb-3">
              <MapPin size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700 dark:text-gray-200 font-medium" data-testid="text-delivery-address">{order.deliveryAddress}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {clientPhone && (
                <>
                  <button onClick={() => callPhone(clientPhone)} data-testid="button-call-client"
                    className="flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-red-200 dark:shadow-none">
                    <Phone size={14} /> Appeler
                  </button>
                  <button onClick={() => openWhatsApp(clientPhone, `Bonjour, je suis votre agent Maweja pour la commande ${order.orderNumber}`)}
                    data-testid="button-whatsapp-client"
                    className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-green-200 dark:shadow-none">
                    <MessageCircle size={14} /> WhatsApp
                  </button>
                </>
              )}
            </div>

            {(order.deliveryLat && order.deliveryLng) && (
              <button onClick={() => openNavigation(order.deliveryLat, order.deliveryLng)} data-testid="button-navigate"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white py-3.5 rounded-xl text-sm font-bold mt-2 active:scale-95 transition-all shadow-lg shadow-red-200 dark:shadow-none">
                <Navigation size={16} /> Ouvrir l'itinéraire GPS
              </button>
            )}
          </div>
        </div>

        <DeliveryMap order={order} restaurant={restaurant} />

        <div className="bg-white dark:bg-[#141417] rounded-2xl border border-gray-100 dark:border-gray-800/50 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt size={14} className="text-red-600" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Facture détaillée</span>
            </div>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{items.length} article{items.length > 1 ? "s" : ""}</span>
          </div>
          <div className="p-4">
            <div className="space-y-0">
              {displayItems.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-800/30 last:border-0" data-testid={`invoice-item-${i}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-red-50 dark:bg-red-950/20 rounded-lg flex items-center justify-center text-[10px] font-extrabold text-red-600">{item.quantity || 1}x</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.name}</p>
                      {item.price && <p className="text-[10px] text-gray-400">{formatPrice(item.price)} / unité</p>}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice((item.price || 0) * (item.quantity || 1))}</span>
                </div>
              ))}
            </div>
            {hasMoreItems && (
              <button onClick={() => setShowAllItems(!showAllItems)}
                className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-red-600 py-2 mt-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                data-testid="button-toggle-items">
                {showAllItems ? <><ChevronUp size={14} /> Voir moins</> : <><ChevronDown size={14} /> Voir les {items.length - 4} autres articles</>}
              </button>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sous-total</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500">Frais de livraison</span>
                  {(order as any).deliveryZone && (
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white bg-blue-500">{(order as any).deliveryZone}</span>
                  )}
                </div>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{formatPrice(order.deliveryFee)}</span>
              </div>
              {Number(order.taxAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Frais de service</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{formatPrice(order.taxAmount)}</span>
                </div>
              )}
              {order.promoDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Réduction promo</span>
                  <span className="font-semibold text-green-600">-{formatPrice(order.promoDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-base font-extrabold text-gray-900 dark:text-white">TOTAL</span>
                <span className="text-xl font-extrabold text-red-600">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
          <CreditCard size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mode de paiement</p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200" data-testid="text-payment-method">{formatPaymentMethod(order.paymentMethod)}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-md shadow-emerald-200 dark:shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Votre gain</p>
              <p className="text-2xl font-extrabold" data-testid="text-driver-earning">{formatPrice(order.deliveryFee)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet size={22} className="text-white" />
            </div>
          </div>
        </div>

        {!["delivered", "cancelled"].includes(order.status) && (
          <div className="space-y-2 pt-1">
            {["confirmed", "preparing", "ready"].includes(order.status) && (
              <button onClick={() => updateStatus("picked_up")} data-testid="button-pickup"
                className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-4 rounded-2xl text-sm font-extrabold active:scale-[0.97] transition-all shadow-lg shadow-red-200 dark:shadow-none">
                <Package size={18} /> Commande Récupérée
              </button>
            )}
            {order.status === "picked_up" && (
              <button onClick={() => updateStatus("delivered")} data-testid="button-deliver"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-2xl text-sm font-extrabold active:scale-[0.97] transition-all shadow-lg shadow-emerald-200 dark:shadow-none">
                <CheckCircle2 size={18} /> Commande Livrée
              </button>
            )}
          </div>
        )}

        <p className="text-center text-[10px] text-gray-300 dark:text-gray-700 mt-4 pb-2">Made By Khevin Andrew Kita - Ed Corporation</p>
      </div>
    </div>
  );
}
