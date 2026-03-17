import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useEffect } from "react";
import ClientNav from "../../components/ClientNav";
import { onWSMessage } from "../../lib/websocket";
import { queryClient, authFetchJson } from "../../lib/queryClient";
import { ArrowLeft, CheckCircle2, Package, ChefHat, Truck, MapPin, Clock, Phone, MessageCircle } from "lucide-react";
import { formatPrice, formatDate, statusLabels } from "../../lib/utils";
import type { Order, User } from "@shared/schema";

const steps = [
  { key: "pending",    icon: Clock,         label: "En attente" },
  { key: "confirmed",  icon: CheckCircle2,  label: "Confirmée" },
  { key: "preparing",  icon: ChefHat,       label: "En préparation" },
  { key: "ready",      icon: Package,       label: "Prête" },
  { key: "picked_up",  icon: Truck,         label: "En livraison" },
  { key: "delivered",  icon: MapPin,        label: "Livrée" },
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);
  const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;

  return (
    <div className="min-h-screen bg-gray-50 pb-24" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 pt-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate("/orders")}
            className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center"
            data-testid="button-back-orders"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
          >
            <ArrowLeft size={18} className="text-gray-800" />
          </button>
          <div>
            <h2 className="font-bold text-gray-900" style={{ fontSize: 18 }}>
              Commande #{order.orderNumber}
            </h2>
            <p className="text-gray-400" style={{ fontSize: 12 }}>{formatDate(order.createdAt!)}</p>
          </div>
        </div>

        {/* Tracking steps */}
        <div className="bg-white rounded-3xl p-6 mb-4" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
          <p className="font-bold text-gray-900 mb-5" style={{ fontSize: 15 }}>Suivi de la commande</p>
          <div className="space-y-0">
            {steps.map((step, i) => {
              const isCompleted = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step.key} className="flex gap-4" data-testid={`tracking-step-${step.key}`}>
                  <div className="flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
                      style={{
                        background: isCurrent ? "#dc2626" : isCompleted ? "#FEE2E2" : "#F3F4F6",
                        color: isCurrent ? "#fff" : isCompleted ? "#dc2626" : "#D1D5DB",
                        boxShadow: isCurrent ? "0 4px 12px rgba(220,38,38,0.3)" : "none",
                      }}
                    >
                      <step.icon size={18} />
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className="w-0.5 h-8 my-1 rounded-full transition-all"
                        style={{ background: isCompleted ? "#FCA5A5" : "#E5E7EB" }}
                      />
                    )}
                  </div>
                  <div className="pb-4 pt-1.5">
                    <p
                      className="font-semibold"
                      style={{
                        fontSize: 13,
                        color: isCurrent ? "#dc2626" : isCompleted ? "#111827" : "#9CA3AF",
                      }}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-gray-400 mt-0.5" style={{ fontSize: 11 }}>En cours...</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Driver */}
        {driver && (
          <div className="bg-white rounded-3xl p-4 mb-4" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
            <p className="font-bold text-gray-900 mb-3" style={{ fontSize: 15 }}>Votre livreur</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Truck size={20} className="text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate" style={{ fontSize: 14 }}>{driver.name}</p>
                <p className="text-gray-400" style={{ fontSize: 12 }}>{driver.phone}</p>
              </div>
              <button
                className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 active:scale-95 transition-transform"
                data-testid="button-call-driver"
              >
                <Phone size={18} />
              </button>
              <button
                className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 active:scale-95 transition-transform"
                data-testid="button-chat-driver"
              >
                <MessageCircle size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Order details */}
        <div className="bg-white rounded-3xl p-4 mb-4" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
          <p className="font-bold text-gray-900 mb-3" style={{ fontSize: 15 }}>Détails de la commande</p>
          <div className="space-y-2">
            {(items as any[]).map((item: any, i: number) => (
              <div key={i} className="flex justify-between">
                <span className="text-gray-500" style={{ fontSize: 13 }}>
                  {item.qty}× {item.name}
                </span>
                <span className="font-semibold text-gray-900" style={{ fontSize: 13 }}>
                  {formatPrice(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1.5">
            <div className="flex justify-between" style={{ fontSize: 13 }}>
              <span className="text-gray-400">Livraison</span>
              <span className="text-gray-700 font-semibold">{formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-900" style={{ fontSize: 14 }}>Total</span>
              <span className="font-bold text-red-600" style={{ fontSize: 16 }}>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        <div className="bg-white rounded-3xl p-4" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.07)" }}>
          <p className="font-bold text-gray-900 mb-2" style={{ fontSize: 15 }}>Adresse de livraison</p>
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-500" style={{ fontSize: 13 }}>{order.deliveryAddress}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
