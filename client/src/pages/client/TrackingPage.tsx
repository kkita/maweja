import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useEffect } from "react";
import ClientNav from "../../components/ClientNav";
import { onWSMessage } from "../../lib/websocket";
import { queryClient, authFetchJson, resolveImg } from "../../lib/queryClient";
import { CheckCircle2, Truck, MapPin, Clock, Phone, MessageCircle, ChevronLeft, Navigation } from "lucide-react";
import { formatPrice, statusLabels } from "../../lib/utils";
import type { Order, User } from "@shared/schema";
import { MCard, MBadge, ORDER_STATUS } from "../../components/client/ClientUI";

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
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  picked_up: "#06B6D4",
  delivered: "#E10000",
};

export default function TrackingPage() {
  const [, params] = useRoute("/tracking/:id");
  const [, navigate] = useLocation();
  const id = Number(params?.id);

  const { data: order } = useQuery<Order>({
    queryKey: ["/api/orders", id],
    queryFn: () => authFetchJson(`/api/orders/${id}`),
    refetchInterval: 10000,
  });

  const { data: driver } = useQuery<Omit<User, "password">>({
    queryKey: ["/api/drivers", order?.driverId],
    queryFn: () => authFetchJson("/api/drivers").then((drivers: any[]) => drivers.find(d => d.id === order?.driverId)),
    enabled: !!order?.driverId,
  });

  useEffect(() => {
    return onWSMessage(data => {
      if (data.type === "order_status" && data.orderId === id) {
        queryClient.invalidateQueries({ queryKey: ["/api/orders", id] });
      }
    });
  }, [id]);

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-[3px] border-gray-200 border-t-[#E10000] rounded-full animate-spin" />
      </div>
    );
  }

  const currentStep = STATUS_STEP[order.status] || "pending";
  const currentStepIdx = STEPS.findIndex(s => s.key === currentStep);
  const isDelivered = order.status === "delivered";
  const status = ORDER_STATUS[order.status] || { label: order.status, variant: "gray" as const };

  const items: any[] = (() => { try { return typeof order.items === "string" ? JSON.parse(order.items) : (order.items as any[]); } catch { return []; } })();
  const itemCount = (items as any[]).reduce((s: number, i: any) => s + (i.qty || 1), 0);

  return (
    <div className="min-h-screen bg-[#f4f4f4] dark:bg-[#0a0a0a] pb-28" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <ClientNav />

      {/* ── Custom header ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white dark:bg-[#0a0a0a] border-b border-black/[0.04] dark:border-white/[0.05]">
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

        {/* ── Delivery ETA hero ────────────────────────────────────── */}
        {!isDelivered && (
          <div
            className="relative overflow-hidden rounded-[22px] p-5 text-white"
            style={{ background: "linear-gradient(135deg, #E10000 0%, #9B0000 100%)" }}
          >
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -bottom-8 -left-4 w-28 h-28 bg-white/5 rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-red-100 text-xs font-medium">Commande en direct</span>
              </div>
              <p className="font-black text-2xl mt-1 leading-tight">
                {order.status === "pending" ? "En attente…"
                  : order.status === "confirmed" ? "En préparation"
                  : order.status === "preparing" ? "En préparation"
                  : order.status === "ready" ? "Prête pour livraison"
                  : order.status === "picked_up" ? "En route !"
                  : "En cours"}
              </p>
              <p className="text-red-100 text-sm mt-1.5">
                {order.deliveryAddress || "Livraison à votre adresse"}
              </p>
            </div>
          </div>
        )}

        {isDelivered && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 rounded-[18px] p-5 text-center">
            <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={28} color="white" />
            </div>
            <p className="font-black text-green-800 dark:text-green-400 text-lg">Commande livrée !</p>
            <p className="text-green-600 dark:text-green-500 text-sm mt-1">Merci pour votre confiance chez MAWEJA</p>
          </div>
        )}

        {/* ── Tracking steps (horizontal) ──────────────────────────── */}
        <MCard padded>
          <p className="font-bold text-gray-900 dark:text-white text-sm mb-5">Progression</p>

          {/* Row of icons connected by horizontal lines */}
          <div className="flex items-start justify-between relative">
            {STEPS.map((step, idx) => {
              const isDone = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const isPending = idx > currentStepIdx;
              const Icon = step.icon;
              const color = isCurrent ? STEP_COLORS[step.key] : isDone ? "#10B981" : "#D1D5DB";

              return (
                <div
                  key={step.key}
                  className="flex flex-col items-center flex-1 relative min-w-0"
                  data-testid={`tracking-step-${step.key}`}
                >
                  {/* Connector line to NEXT step (drawn from this icon's right edge) */}
                  {idx < STEPS.length - 1 && (
                    <div
                      className="absolute top-[18px] left-1/2 right-[-50%] h-0.5 rounded-full transition-all duration-700 -z-0"
                      style={{
                        background: isDone
                          ? "#10B981"
                          : isCurrent
                          ? `linear-gradient(90deg, ${color} 0%, ${color}40 100%)`
                          : "#E5E7EB",
                      }}
                    />
                  )}

                  {/* Icon bubble */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 relative z-10 ${
                      isPending ? "bg-gray-100 dark:bg-zinc-800" : ""
                    } ${isCurrent ? "scale-110" : ""}`}
                    style={{
                      background: isPending ? undefined : `${color}20`,
                      border: `2px solid ${isPending ? "#E5E7EB" : color}`,
                      boxShadow: isCurrent ? `0 0 0 4px ${color}15` : "none",
                    }}
                  >
                    <Icon
                      size={15}
                      style={{ color: isPending ? "#D1D5DB" : color }}
                      strokeWidth={isCurrent ? 2.5 : 2}
                    />
                  </div>

                  {/* Label below */}
                  <p
                    className={`font-bold leading-tight mt-2 text-center px-0.5 ${
                      isPending ? "text-gray-300 dark:text-zinc-600" : "text-gray-900 dark:text-white"
                    }`}
                    style={{ fontSize: 11 }}
                  >
                    {step.label}
                  </p>

                  {/* "En cours…" pulse — only on current step */}
                  {isCurrent && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: color }} />
                      <span className="font-semibold" style={{ fontSize: 9, color }}>
                        En cours
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Description of the CURRENT step shown below the bar */}
          {STEPS[currentStepIdx] && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed text-center">
                {STEPS[currentStepIdx].desc}
              </p>
            </div>
          )}
        </MCard>

        {/* ── Driver card ──────────────────────────────────────────── */}
        {driver && (
          <MCard padded>
            <p className="font-bold text-gray-900 dark:text-white text-sm mb-3.5">Votre agent de livraison</p>
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 flex-shrink-0 border-2 border-white dark:border-zinc-700"
                style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.12)" }}>
                {(driver as any).profileImage ? (
                  <img src={resolveImg((driver as any).profileImage)} alt={driver.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                    <span className="text-white font-black text-xl">{driver.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm">{driver.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">Agent MAWEJA</p>
                <div className="flex items-center gap-1 mt-1">
                  {[1,2,3,4,5].map(s => (
                    <div key={s} className="w-2.5 h-2.5 rounded-full" style={{ background: s <= 4 ? "#F59E0B" : "#E5E7EB" }} />
                  ))}
                  <span className="text-xs text-gray-400 ml-1">4.0</span>
                </div>
              </div>
              <div className="flex gap-2">
                {driver.phone && (
                  <a
                    href={`tel:${driver.phone}`}
                    className="w-11 h-11 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    data-testid="link-call-driver"
                  >
                    <Phone size={17} className="text-green-600" />
                  </a>
                )}
                <button
                  onClick={() => navigate(`/chat/order/${order.id}`)}
                  className="w-11 h-11 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  data-testid="button-chat-driver"
                  aria-label="Discuter avec l'agent"
                >
                  <MessageCircle size={17} className="text-blue-600" />
                </button>
              </div>
            </div>
          </MCard>
        )}

        {/* ── Order summary ────────────────────────────────────────── */}
        <MCard>
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-50 dark:border-zinc-800">
            <Navigation size={15} className="text-[#E10000]" />
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
              <span className="font-black text-[#E10000] text-lg">
                {formatPrice(typeof order.total === "string" ? parseFloat(order.total) : order.total)}
              </span>
            </div>
          </div>
        </MCard>

        {/* ── Rate order ───────────────────────────────────────────── */}
        {isDelivered && (
          <button
            onClick={() => navigate(`/orders/${order.id}`)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-[18px] text-white font-bold text-sm active:scale-[0.98] transition-transform"
            style={{ background: "linear-gradient(90deg, #E10000, #cc0000)", boxShadow: "0 6px 20px rgba(225,0,0,0.3)" }}
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
