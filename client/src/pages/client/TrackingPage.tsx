import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useEffect } from "react";
import ClientNav from "../../components/ClientNav";
import { onWSMessage } from "../../lib/websocket";
import { queryClient, authFetchJson } from "../../lib/queryClient";
import { ArrowLeft, CheckCircle2, Package, ChefHat, Truck, MapPin, Clock, Phone, MessageCircle, Star } from "lucide-react";
import { formatPrice, formatDate, statusLabels } from "../../lib/utils";
import type { Order, User } from "@shared/schema";

const steps = [
  {
    key: "pending",
    icon: Clock,
    label: "En attente",
    desc: "Votre commande a été reçue",
    color: "#F59E0B",
  },
  {
    key: "confirmed",
    icon: CheckCircle2,
    label: "Confirmée",
    desc: "Le restaurant a accepté votre commande",
    color: "#10B981",
  },
  {
    key: "preparing",
    icon: ChefHat,
    label: "En préparation",
    desc: "Votre repas est en cours de préparation",
    color: "#6366F1",
  },
  {
    key: "ready",
    icon: Package,
    label: "Prête",
    desc: "Commande prête, en attente du livreur",
    color: "#8B5CF6",
  },
  {
    key: "picked_up",
    icon: Truck,
    label: "En livraison",
    desc: "Votre livreur est en route",
    color: "#3B82F6",
  },
  {
    key: "delivered",
    icon: MapPin,
    label: "Livrée",
    desc: "Commande livrée avec succès !",
    color: "#dc2626",
  },
];

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
    queryFn: () => authFetchJson(`/api/drivers`).then((drivers: any[]) => drivers.find(d => d.id === order?.driverId)),
    enabled: !!order?.driverId,
  });

  useEffect(() => {
    return onWSMessage((data) => {
      if (data.type === "order_status" && data.orderId === id) {
        queryClient.invalidateQueries({ queryKey: ["/api/orders", id] });
      }
    });
  }, [id]);

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);
  const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
  const isDelivered = order.status === "delivered";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] pb-28" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 pt-5">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate("/orders")}
            className="w-10 h-10 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
            data-testid="button-back-orders"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
          >
            <ArrowLeft size={18} className="text-gray-800 dark:text-gray-100" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 dark:text-white" style={{ fontSize: 18 }}>
              Commande #{order.orderNumber}
            </h2>
            <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: 12 }}>{formatDate(order.createdAt!)}</p>
          </div>
          {/* Status badge */}
          <div
            className="px-3 py-1 rounded-full"
            style={{
              background: isDelivered ? "#DCFCE7" : "#FEF3C7",
              border: `1px solid ${isDelivered ? "#BBF7D0" : "#FDE68A"}`,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: isDelivered ? "#16A34A" : "#D97706",
              }}
            >
              {statusLabels[order.status as keyof typeof statusLabels] || order.status}
            </span>
          </div>
        </div>

        {/* ── Horizontal Tracking Timeline ─────────────────────────────── */}
        <div
          className="bg-white dark:bg-gray-900 rounded-3xl p-5 mb-4"
          style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-gray-900 dark:text-white" style={{ fontSize: 15 }}>
              Suivi de la commande
            </p>
            {/* Status pill */}
            <div
              className="px-3 py-1 rounded-full"
              style={{
                background: isDelivered ? "#DCFCE7" : "#FEF3C7",
                border: `1px solid ${isDelivered ? "#BBF7D0" : "#FDE68A"}`,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: isDelivered ? "#16A34A" : "#D97706" }}>
                {isDelivered ? "Livrée ✓" : "En cours…"}
              </span>
            </div>
          </div>

          {/* Horizontal stepper — icon + label per step, perfectly aligned */}
          <div className="w-full">
            <div className="relative flex justify-between items-start w-full">
              {/* Background line at circle center (top: 16px = half of 32px) */}
              <div
                className="absolute h-0.5 rounded-full"
                style={{ left: 16, right: 16, top: 16, background: "#E5E7EB", zIndex: 0 }}
              />
              {/* Red fill line */}
              <div
                className="absolute h-0.5 rounded-full transition-all duration-700"
                style={{
                  left: 16,
                  top: 16,
                  background: "linear-gradient(to right, #EC0000, #ff4444)",
                  width: currentStepIndex === 0 ? 0 : `calc(${(currentStepIndex / (steps.length - 1)) * 100}% - 32px)`,
                  zIndex: 0,
                }}
              />
              {/* Step: circle + label stacked */}
              {steps.map((step, i) => {
                const isCompleted = i < currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const isFuture = i > currentStepIndex;
                const StepIcon = step.icon;
                return (
                  <div
                    key={step.key}
                    className="flex flex-col items-center"
                    style={{ zIndex: 1, width: `${100 / steps.length}%` }}
                    data-testid={`tracking-step-${step.key}`}
                  >
                    {/* Circle */}
                    <div
                      className="relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 flex-shrink-0"
                      style={{
                        background: isCurrent ? "#EC0000" : isCompleted ? "#FEE2E2" : "#F3F4F6",
                        border: isFuture ? "1.5px dashed #D1D5DB" : "none",
                        boxShadow: isCurrent ? "0 0 0 3px rgba(236,0,0,0.15)" : "none",
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={14} style={{ color: "#EC0000" }} />
                      ) : (
                        <StepIcon size={14} style={{ color: isCurrent ? "#fff" : "#C4C4C4" }} />
                      )}
                      {isCurrent && (
                        <span
                          className="absolute inset-0 rounded-full"
                          style={{ animation: "tracking-pulse 2s ease-in-out infinite", background: "rgba(236,0,0,0.15)" }}
                        />
                      )}
                    </div>
                    {/* Label — centered under icon */}
                    <p
                      className="text-center leading-tight mt-1.5 w-full"
                      style={{
                        fontSize: 9,
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? "#EC0000" : isCompleted ? "#374151" : "#9CA3AF",
                        wordBreak: "break-word",
                        hyphens: "auto",
                      }}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <div
                        className="w-1 h-1 rounded-full mt-0.5"
                        style={{ background: "#EC0000", animation: "pulse 1s ease-in-out infinite" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivered celebration */}
          {isDelivered && (
            <div
              className="mt-4 rounded-2xl p-3 flex items-center gap-3"
              style={{ background: "linear-gradient(135deg, #FEF2F2, #FFF7ED)" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#dc2626" }}>
                <Star size={16} fill="white" className="text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900" style={{ fontSize: 13 }}>Commande livrée avec succès !</p>
                <p className="text-gray-500" style={{ fontSize: 11 }}>Merci de votre confiance 🎉</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Driver card ─────────────────────────────────────────────── */}
        {driver && (
          <div
            className="bg-white dark:bg-gray-900 rounded-3xl p-4 mb-4"
            style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}
          >
            <p className="font-bold text-gray-900 dark:text-white mb-3" style={{ fontSize: 14 }}>
              Votre livreur
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #FEE2E2, #FCA5A5)" }}
              >
                <Truck size={20} className="text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white truncate" style={{ fontSize: 14 }}>{driver.name}</p>
                <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: 12 }}>{driver.phone}</p>
              </div>
              <a
                href={`tel:${driver.phone}`}
                className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 active:scale-95 transition-transform"
                data-testid="button-call-driver"
              >
                <Phone size={18} />
              </a>
              <button
                className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 active:scale-95 transition-transform"
                data-testid="button-chat-driver"
              >
                <MessageCircle size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── Order details ───────────────────────────────────────────── */}
        <div
          className="bg-white dark:bg-gray-900 rounded-3xl p-4 mb-4"
          style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}
        >
          <p className="font-bold text-gray-900 dark:text-white mb-3" style={{ fontSize: 14 }}>
            Détails de la commande
          </p>
          <div className="space-y-2">
            {(items as any[]).map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: "#dc2626", fontSize: 11, fontWeight: 800 }}
                  >
                    {item.qty}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300" style={{ fontSize: 13 }}>{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white" style={{ fontSize: 13 }}>
                  {formatPrice(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 mt-3 pt-3 space-y-2">
            <div className="flex justify-between items-center" style={{ fontSize: 13 }}>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 dark:text-gray-500">Livraison</span>
                {(order as any).deliveryZone && (
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white bg-blue-500">{(order as any).deliveryZone}</span>
                )}
              </div>
              <span className="text-gray-700 dark:text-gray-200 font-semibold">{formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900 dark:text-white" style={{ fontSize: 14 }}>Total</span>
              <span className="font-black text-red-600" style={{ fontSize: 18 }}>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* ── Delivery address ────────────────────────────────────────── */}
        <div
          className="bg-white dark:bg-gray-900 rounded-3xl p-4"
          style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}
        >
          <p className="font-bold text-gray-900 dark:text-white mb-2" style={{ fontSize: 14 }}>
            Adresse de livraison
          </p>
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: 13 }}>{order.deliveryAddress}</p>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes tracking-pulse {
          0%, 100% { opacity: 0; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
