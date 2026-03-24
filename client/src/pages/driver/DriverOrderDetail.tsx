import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAuth } from "../../lib/auth";
import { authFetchJson, apiRequest, queryClient } from "../../lib/queryClient";
import DriverNav from "../../components/DriverNav";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft, MapPin, Phone, MessageCircle, DollarSign, Package,
  User, Clock, CreditCard, Truck, CheckCircle2, Navigation
} from "lucide-react";
import { formatPrice, statusLabels, statusColors, formatDate } from "../../lib/utils";
import { useToast } from "../../hooks/use-toast";
import type { Order, Restaurant, User as UserType } from "@shared/schema";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";

function OrderMap({ lat, lng, address }: { lat: number | null; lng: number | null; address: string }) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const centerLat = lat ?? -4.3222;
    const centerLng = lng ?? 15.3222;
    const map = L.map(containerRef.current, {
      center: [centerLat, centerLng], zoom: 15, zoomControl: true, attributionControl: false,
    });
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

    if (lat && lng) {
      const icon = L.divIcon({
        html: `<div style="width:36px;height:36px;background:#dc2626;border-radius:50%;border:3px solid white;box-shadow:0 4px 12px rgba(220,38,38,0.5);display:flex;align-items:center;justify-content:center;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3" fill="#dc2626"/></svg>
        </div>`,
        className: "", iconSize: [36, 36], iconAnchor: [18, 36],
      });
      L.marker([lat, lng], { icon }).addTo(map).bindPopup(`📍 ${address}`).openPopup();
    }

    return () => { map.remove(); mapRef.current = null; };
  }, [lat, lng]);

  return <div ref={containerRef} className="w-full h-48 rounded-2xl overflow-hidden" data-testid="order-detail-map" />;
}

export default function DriverOrderDetail() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/driver/order/:id");
  const orderId = params?.id ? Number(params.id) : 0;

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
    await apiRequest(`/api/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    toast({ title: status === "delivered" ? "Livraison terminée! 🎉" : "Statut mis à jour" });
  };

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-28">
        <DriverNav />
        <div className="max-w-lg mx-auto px-4 py-8 text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const items = (order.items as any[]) || [];
  const clientPhone = order.orderPhone || client?.phone || "";
  const clientName = order.orderName || client?.name || "Client";

  const openWhatsApp = () => {
    const phone = clientPhone.replace(/\D/g, "");
    const fullPhone = phone.startsWith("243") ? phone : `243${phone.replace(/^0/, "")}`;
    window.open(`https://wa.me/${fullPhone}?text=Bonjour, je suis votre livreur Maweja pour la commande ${order.orderNumber}`, "_blank");
  };

  const callClient = () => {
    window.open(`tel:${clientPhone}`, "_self");
  };

  const openNavigation = () => {
    if (order.deliveryLat && order.deliveryLng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLat},${order.deliveryLng}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-28">
      <DriverNav />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <button onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-semibold mb-2"
          data-testid="button-back-dashboard">
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-lg font-black text-gray-900 dark:text-white" data-testid="text-order-number">{order.orderNumber}</p>
              <p className="text-xs text-gray-500">{formatDate(order.createdAt!)}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-xl ${statusColors[order.status]}`} data-testid="text-order-status">
              {statusLabels[order.status]}
            </span>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
              <User size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300">Client</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white" data-testid="text-client-name">{clientName}</p>
                {clientPhone && <p className="text-xs text-gray-500">{clientPhone}</p>}
              </div>
            </div>

            {restaurant && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-xl">
                <Package size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-orange-700 dark:text-orange-300">Restaurant</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white" data-testid="text-restaurant-name">{restaurant.name}</p>
                  <p className="text-xs text-gray-500">{restaurant.address}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-xl">
              <MapPin size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-red-700 dark:text-red-300">Adresse de livraison</p>
                <p className="text-sm text-gray-900 dark:text-white" data-testid="text-delivery-address">{order.deliveryAddress}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
              <CreditCard size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-purple-700 dark:text-purple-300">Mode de paiement</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize" data-testid="text-payment-method">
                  {order.paymentMethod === "cash" ? "💵 Cash à la livraison" :
                   order.paymentMethod === "wallet" ? "💳 Portefeuille Maweja" :
                   order.paymentMethod === "mobile_money" ? "📱 Mobile Money" :
                   order.paymentMethod}
                </p>
              </div>
            </div>
          </div>

          {clientPhone && (
            <div className="flex gap-2 mb-4">
              <button onClick={callClient} data-testid="button-call-client"
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold active:scale-95 transition-all shadow-md">
                <Phone size={16} /> Appeler
              </button>
              <button onClick={openWhatsApp} data-testid="button-whatsapp-client"
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl text-sm font-bold active:scale-95 transition-all shadow-md">
                <MessageCircle size={16} /> WhatsApp
              </button>
            </div>
          )}

          {(order.deliveryLat && order.deliveryLng) && (
            <button onClick={openNavigation} data-testid="button-navigate"
              className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-3 rounded-xl text-sm font-bold mb-4 active:scale-95 transition-all">
              <Navigation size={16} /> Ouvrir dans Google Maps
            </button>
          )}
        </div>

        <OrderMap lat={order.deliveryLat} lng={order.deliveryLng} address={order.deliveryAddress} />

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-black text-gray-900 dark:text-white">📋 Facture / Invoice</h3>
          </div>
          <div className="p-4 space-y-2">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1.5" data-testid={`invoice-item-${i}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-5">{item.quantity || 1}x</span>
                  <span className="text-sm text-gray-700 dark:text-gray-200">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice((item.price || 0) * (item.quantity || 1))}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-2 mt-2 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sous-total</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Frais de livraison</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{formatPrice(order.deliveryFee)}</span>
              </div>
              {order.promoDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Réduction promo</span>
                  <span className="font-semibold text-green-600">-{formatPrice(order.promoDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-red-600" data-testid="text-order-total">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-500 mb-2">Votre gain sur cette commande</p>
          <p className="text-2xl font-black text-emerald-600" data-testid="text-driver-earning">{formatPrice(order.deliveryFee)}</p>
        </div>

        {!["delivered", "cancelled"].includes(order.status) && (
          <div className="flex gap-2">
            {["confirmed", "preparing"].includes(order.status) && (
              <button onClick={() => updateStatus("picked_up")} data-testid="button-pickup"
                className="flex-1 bg-blue-600 text-white py-4 rounded-2xl text-sm font-black active:scale-95 transition-all shadow-lg shadow-blue-200">
                📦 Commande Récupérée
              </button>
            )}
            {order.status === "picked_up" && (
              <button onClick={() => updateStatus("delivered")} data-testid="button-deliver"
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-2xl text-sm font-black active:scale-95 transition-all shadow-lg shadow-emerald-200">
                ✓ Commande Livrée
              </button>
            )}
          </div>
        )}

        {order.notes && (
          <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-2xl border border-yellow-200 dark:border-yellow-800 p-4">
            <p className="text-xs font-bold text-yellow-700 dark:text-yellow-300 mb-1">Notes du client</p>
            <p className="text-sm text-gray-700 dark:text-gray-200">{order.notes}</p>
          </div>
        )}

        <p className="text-center text-[10px] text-gray-400 mt-6">Made By Khevin Andrew Kita - Ed Corporation</p>
      </div>
    </div>
  );
}
