import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useEffect, useRef } from "react";
import ClientNav from "../../components/ClientNav";
import { onWSMessage } from "../../lib/websocket";
import { queryClient, authFetchJson, resolveImg } from "../../lib/queryClient";
import {
  CheckCircle2, Truck, MapPin, Clock, Phone, MessageCircle,
  ChevronLeft, Navigation, LifeBuoy,
} from "lucide-react";
import { formatPrice } from "../../lib/utils";
import type { Order } from "@shared/schema";
import { MCard, MBadge, ORDER_STATUS } from "../../components/client/ClientUI";
import { palette, brand } from "../../design-system/tokens";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";

const STATUS_STEP: Record<string, string> = {
  pending: "pending", confirmed: "confirmed",
  preparing: "picked_up", ready: "picked_up", picked_up: "picked_up",
  delivered: "delivered",
};

const STEPS = [
  { key: "pending",   icon: Clock,         label: "Reçue",           desc: "Votre commande a été reçue" },
  { key: "confirmed", icon: CheckCircle2,  label: "Confirmée",       desc: "Le restaurant prépare votre commande" },
  { key: "picked_up", icon: Truck,         label: "En livraison",    desc: "Votre agent est en route" },
  { key: "delivered", icon: MapPin,        label: "Livrée",          desc: "Commande livrée avec succès !" },
];

const STEP_COLORS: Record<string, string> = {
  pending:   palette.step.pending,
  confirmed: palette.step.confirmed,
  picked_up: palette.step.picked_up,
  delivered: palette.step.delivered,
};

/**
 * PARTIE 4 — réponse de GET /api/orders/:id/tracking.
 * Forme stable consommée par TrackingPage. Si vous changez le contrat côté
 * serveur, mettez à jour ce type aussi.
 */
type TrackingResponse = {
  orderId: number;
  orderNumber: string;
  status: string;
  statusText: string | null;
  destination: { latitude: number; longitude: number } | null;
  deliveryAddress: string | null;
  driver: {
    id: number; name: string; phone: string;
    vehicleType: string | null; vehiclePlate: string | null;
    profilePhotoUrl: string | null; rating: number | null;
  } | null;
  driverLocation: {
    latitude: number; longitude: number;
    heading: number | null; speed: number | null; accuracy: number | null;
    recordedAt: string | null;
  } | null;
  eta: {
    distanceKm: number; minutes: number; avgSpeedKmh: number; arrivalAt: string;
  } | null;
  channels: { canCall: boolean; canChat: boolean; canOpenSupport: boolean };
};

/**
 * Carte Leaflet : destination fixe + position livreur live. Le marker est
 * recréé/déplacé à chaque mise à jour, et la vue est ajustée pour englober
 * les deux points. Si la position livreur n'est pas encore connue, on
 * affiche seulement la destination — pas de map vide.
 */
function LiveTrackingMap({
  destination, driverLocation,
}: {
  destination: { latitude: number; longitude: number } | null;
  driverLocation: { latitude: number; longitude: number } | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const driverMarker = useRef<L.Marker | null>(null);
  const destMarker = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || !destination) return;
    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [destination.latitude, destination.longitude],
        zoom: 14, zoomControl: false, attributionControl: false,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      mapRef.current = map;
    }
    const map = mapRef.current!;

    if (!destMarker.current) {
      const icon = L.divIcon({
        className: "",
        iconSize: [28, 28],
        html: `<div style="background:#E10000;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)">📍</div>`,
      });
      destMarker.current = L.marker([destination.latitude, destination.longitude], { icon }).addTo(map);
    }

    if (driverLocation) {
      if (!driverMarker.current) {
        const icon = L.divIcon({
          className: "",
          iconSize: [32, 32],
          html: `<div style="background:#16a34a;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)">🛵</div>`,
        });
        driverMarker.current = L.marker([driverLocation.latitude, driverLocation.longitude], { icon }).addTo(map);
      } else {
        driverMarker.current.setLatLng([driverLocation.latitude, driverLocation.longitude]);
      }
      const bounds = L.latLngBounds([
        [destination.latitude, destination.longitude],
        [driverLocation.latitude, driverLocation.longitude],
      ]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } else {
      map.setView([destination.latitude, destination.longitude], 14);
    }
  }, [destination, driverLocation]);

  // Cleanup à l'unmount uniquement.
  useEffect(() => () => {
    mapRef.current?.remove();
    mapRef.current = null;
    driverMarker.current = null;
    destMarker.current = null;
  }, []);

  if (!destination) return null;
  return <div ref={containerRef} style={{ height: 220, width: "100%" }} className="rounded-2xl overflow-hidden" data-testid="map-tracking" />;
}

export default function TrackingPage() {
  const [, params] = useRoute("/tracking/:id");
  const [, navigate] = useLocation();
  const id = Number(params?.id);

  // Référence pour les infos de paiement / récapitulatif (commande complète).
  const { data: order } = useQuery<Order>({
    queryKey: ["/api/orders", id],
    queryFn: () => authFetchJson(`/api/orders/${id}`),
    refetchInterval: 15000,
  });

  // Tracking enrichi : statut, position livreur, ETA, infos publiques livreur.
  const { data: tracking } = useQuery<TrackingResponse>({
    queryKey: ["/api/orders", id, "tracking"],
    queryFn: () => authFetchJson(`/api/orders/${id}/tracking`),
    refetchInterval: 12000,
  });

  // WS : si on reçoit un push de position pour CETTE commande, on rafraîchit
  // immédiatement l'objet tracking (évite d'attendre le prochain polling).
  useEffect(() => {
    return onWSMessage((data) => {
      if (data.type === "order_status" && data.orderId === id) {
        queryClient.invalidateQueries({ queryKey: ["/api/orders", id] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders", id, "tracking"] });
      }
      if (data.type === "driver_location_update" && data.orderId === id) {
        queryClient.invalidateQueries({ queryKey: ["/api/orders", id, "tracking"] });
      }
    });
  }, [id]);

  if (!order) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-[3px] border-gray-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const currentStep = STATUS_STEP[order.status] || "pending";
  const currentStepIdx = STEPS.findIndex(s => s.key === currentStep);
  const isDelivered = order.status === "delivered";
  const status = ORDER_STATUS[order.status] || { label: order.status, variant: "gray" as const };
  const driver = tracking?.driver ?? null;
  const channels = tracking?.channels ?? { canCall: false, canChat: false, canOpenSupport: true };

  const items: any[] = (() => {
    try { return typeof order.items === "string" ? JSON.parse(order.items as any) : (order.items as any[]); }
    catch { return []; }
  })();
  const itemCount = (items as any[]).reduce((s: number, i: any) => s + (i.qty || 1), 0);

  // Texte d'ETA présenté à l'utilisateur. Le serveur fournit déjà un libellé
  // contextuel (ex. "Le livreur est à votre porte"), on le préfère à toute
  // logique côté front pour rester cohérent avec les notifications.
  const etaMinutes = tracking?.eta?.minutes ?? null;
  const etaArrival = tracking?.eta?.arrivalAt
    ? new Date(tracking.eta.arrivalAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : null;
  const heroText = tracking?.statusText
    ?? (order.status === "pending" ? "En attente…"
      : order.status === "confirmed" ? "En préparation"
      : order.status === "preparing" ? "En préparation"
      : order.status === "ready" ? "Prête pour livraison"
      : order.status === "picked_up" ? "En route !"
      : "En cours");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-28" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <ClientNav />

      <div className="sticky top-0 z-40 bg-white dark:bg-zinc-950 border-b border-black/[0.04] dark:border-white/[0.05]">
        <div className="max-w-lg mx-auto px-4 flex items-center gap-3" style={{ height: 56 }}>
          <button
            onClick={() => navigate("/orders")}
            className="w-9 h-9 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            data-testid="button-back"
          >
            <ChevronLeft size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex-1">
            <p className="font-black text-gray-900 dark:text-white text-base" style={{ letterSpacing: "-0.3px" }}>
              Suivi de commande
            </p>
            <p className="text-gray-400 text-xs"># {order.id} · {itemCount} article{itemCount > 1 ? "s" : ""}</p>
          </div>
          <MBadge variant={status.variant} dot={!isDelivered}>{status.label}</MBadge>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* ── ETA hero ─────────────────────────────────────────────── */}
        {!isDelivered && (
          <div
            className="relative overflow-hidden rounded-[22px] p-5 text-white"
            style={{ background: `linear-gradient(135deg, ${brand[500]} 0%, ${brand[700]} 100%)` }}
          >
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -bottom-8 -left-4 w-28 h-28 bg-white/5 rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-red-100 text-xs font-medium">Commande en direct</span>
              </div>
              <p className="font-black text-2xl mt-1 leading-tight" data-testid="text-status-hero">
                {heroText}
              </p>
              {etaMinutes !== null && (
                <p className="text-red-100 text-sm mt-1.5" data-testid="text-eta">
                  Arrivée estimée : <span className="font-bold text-white">{etaMinutes} min</span>
                  {etaArrival ? ` · ${etaArrival}` : ""}
                </p>
              )}
              <p className="text-red-100 text-xs mt-1">
                {order.deliveryAddress || "Livraison à votre adresse"}
              </p>
            </div>
          </div>
        )}

        {isDelivered && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-[18px] p-5 text-center">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={28} className="text-emerald-600 dark:text-emerald-300" />
            </div>
            <p className="font-black text-emerald-800 dark:text-emerald-300 text-lg">Commande livrée !</p>
            <p className="text-emerald-700/80 dark:text-emerald-400/80 text-sm mt-1">Merci pour votre confiance chez MAWEJA</p>
          </div>
        )}

        {/* ── Live map (apparaît dès qu'on a une destination) ──────── */}
        {!isDelivered && tracking?.destination && (
          <MCard padded>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-900 dark:text-white text-sm">Position du livreur</p>
              {tracking?.driverLocation ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  En direct
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-gray-400">En attente du GPS du livreur…</span>
              )}
            </div>
            <LiveTrackingMap
              destination={tracking.destination}
              driverLocation={tracking.driverLocation
                ? { latitude: tracking.driverLocation.latitude, longitude: tracking.driverLocation.longitude }
                : null}
            />
          </MCard>
        )}

        {/* ── Tracking steps ───────────────────────────────────────── */}
        <MCard padded>
          <p className="font-bold text-gray-900 dark:text-white text-sm mb-5">Progression</p>
          <div className="flex items-start justify-between relative">
            {STEPS.map((step, idx) => {
              const isDone = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const isPending = idx > currentStepIdx;
              const Icon = step.icon;
              const color = isCurrent ? STEP_COLORS[step.key] : isDone ? palette.step.done : palette.step.idle;
              return (
                <div key={step.key} className="flex flex-col items-center flex-1 relative min-w-0" data-testid={`tracking-step-${step.key}`}>
                  {idx < STEPS.length - 1 && (
                    <div
                      className="absolute top-[18px] left-1/2 right-[-50%] h-0.5 rounded-full transition-all duration-700 -z-0"
                      style={{
                        background: isDone ? palette.step.done
                          : isCurrent ? `linear-gradient(90deg, ${color} 0%, ${color}40 100%)`
                          : palette.step.border,
                      }}
                    />
                  )}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 relative z-10 ${isPending ? "bg-gray-100 dark:bg-zinc-800" : ""} ${isCurrent ? "scale-110" : ""}`}
                    style={{
                      background: isPending ? undefined : `${color}20`,
                      border: `2px solid ${isPending ? palette.step.border : color}`,
                      boxShadow: isCurrent ? `0 0 0 4px ${color}15` : "none",
                    }}
                  >
                    <Icon size={15} style={{ color: isPending ? palette.step.idle : color }} strokeWidth={isCurrent ? 2.5 : 2} />
                  </div>
                  <p className={`font-bold leading-tight mt-2 text-center px-0.5 ${isPending ? "text-gray-300 dark:text-zinc-600" : "text-gray-900 dark:text-white"}`} style={{ fontSize: 11 }}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: color }} />
                      <span className="font-semibold" style={{ fontSize: 9, color }}>En cours</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {STEPS[currentStepIdx] && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed text-center" data-testid="text-status-desc">
                {tracking?.statusText ?? STEPS[currentStepIdx].desc}
              </p>
            </div>
          )}
        </MCard>

        {/* ── Driver card avec call / chat / support ───────────────── */}
        {driver && (
          <MCard padded>
            <p className="font-bold text-gray-900 dark:text-white text-sm mb-3.5">Votre agent de livraison</p>
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 flex-shrink-0 border-2 border-white dark:border-zinc-700"
                style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.12)" }}>
                {driver.profilePhotoUrl ? (
                  <img src={resolveImg(driver.profilePhotoUrl)} alt={driver.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                    <span className="text-white font-black text-xl">{driver.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm" data-testid="text-driver-name">{driver.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {driver.vehicleType ? `${driver.vehicleType}${driver.vehiclePlate ? ` · ${driver.vehiclePlate}` : ""}` : "Agent MAWEJA"}
                </p>
              </div>
              <div className="flex gap-2">
                {channels.canCall && driver.phone && (
                  <a
                    href={`tel:${driver.phone}`}
                    className="w-11 h-11 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    data-testid="link-call-driver"
                    aria-label="Appeler l'agent"
                  >
                    <Phone size={17} className="text-green-600" />
                  </a>
                )}
                {channels.canChat && (
                  <button
                    onClick={() => navigate(`/chat/order/${order.id}`)}
                    className="w-11 h-11 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    data-testid="button-chat-driver"
                    aria-label="Discuter avec l'agent"
                  >
                    <MessageCircle size={17} className="text-blue-600" />
                  </button>
                )}
                {channels.canOpenSupport && (
                  <button
                    onClick={() => navigate(`/support?orderId=${order.id}`)}
                    className="w-11 h-11 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    data-testid="button-open-support"
                    aria-label="Contacter le support"
                  >
                    <LifeBuoy size={17} className="text-amber-600" />
                  </button>
                )}
              </div>
            </div>
          </MCard>
        )}

        {/* ── Order summary ────────────────────────────────────────── */}
        <MCard>
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-50 dark:border-zinc-800">
            <Navigation size={15} className="text-brand-500" />
            <p className="font-bold text-gray-900 dark:text-white text-sm">Récapitulatif</p>
          </div>
          <div className="px-4 py-4 space-y-3">
            <div className="flex justify-between items-center" style={{ fontSize: 13 }}>
              <span className="text-gray-400 dark:text-gray-500">Sous-total</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{formatPrice((order as any).subtotal || 0)}</span>
            </div>
            <div className="flex justify-between items-center" style={{ fontSize: 13 }}>
              <span className="text-gray-400 dark:text-gray-500">Livraison</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{formatPrice((order as any).deliveryFee || 0)}</span>
            </div>
            {(() => {
              const fee = Number((order as any).taxAmount ?? (order as any).serviceFee ?? 0);
              if (fee <= 0) return null;
              return (
                <div className="flex justify-between items-center" style={{ fontSize: 13 }}>
                  <span className="text-gray-400 dark:text-gray-500">Frais de service</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200" data-testid="text-service-fee">{formatPrice(fee)}</span>
                </div>
              );
            })()}
            <div className="border-t border-gray-100 dark:border-zinc-800 pt-3 flex justify-between items-center">
              <span className="font-bold text-gray-900 dark:text-white">Total</span>
              <span className="font-black text-brand-500 text-lg">
                {formatPrice(typeof order.total === "string" ? parseFloat(order.total) : order.total)}
              </span>
            </div>
          </div>
        </MCard>

        {isDelivered && (
          <button
            onClick={() => navigate(`/orders/${order.id}`)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-[18px] text-white font-bold text-sm active:scale-[0.98] transition-transform brand-cta-gradient brand-shadow-cta"
            data-testid="button-rate-order"
          >
            <CheckCircle2 size={17} />
            Voir les détails & noter
          </button>
        )}
      </div>
    </div>
  );
}
