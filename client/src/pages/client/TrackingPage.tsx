import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useEffect } from "react";
import ClientNav from "../../components/ClientNav";
import { onWSMessage } from "../../lib/websocket";
import { queryClient } from "../../lib/queryClient";
import { ArrowLeft, CheckCircle2, Package, ChefHat, Truck, MapPin, Clock, Phone, MessageCircle } from "lucide-react";
import { formatPrice, formatDate, statusLabels } from "../../lib/utils";
import type { Order, User } from "@shared/schema";

const steps = [
  { key: "pending", icon: Clock, label: "En attente" },
  { key: "confirmed", icon: CheckCircle2, label: "Confirmee" },
  { key: "preparing", icon: ChefHat, label: "En preparation" },
  { key: "ready", icon: Package, label: "Prete" },
  { key: "picked_up", icon: Truck, label: "En livraison" },
  { key: "delivered", icon: MapPin, label: "Livree" },
];

export default function TrackingPage() {
  const [, params] = useRoute("/tracking/:id");
  const [, navigate] = useLocation();
  const id = Number(params?.id);

  const { data: order } = useQuery<Order>({
    queryKey: ["/api/orders", id],
    queryFn: () => fetch(`/api/orders/${id}`).then((r) => r.json()),
    refetchInterval: 10000,
  });

  const { data: driver } = useQuery<Omit<User, "password">>({
    queryKey: ["/api/drivers", order?.driverId],
    queryFn: () => fetch(`/api/drivers`).then(r => r.json()).then((drivers: any[]) => drivers.find(d => d.id === order?.driverId)),
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);
  const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/orders")} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200" data-testid="button-back-orders">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Commande {order.orderNumber}</h2>
            <p className="text-xs text-gray-500">{formatDate(order.createdAt!)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-6">Suivi de la commande</h3>
          <div className="space-y-0">
            {steps.map((step, i) => {
              const isCompleted = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step.key} className="flex gap-4" data-testid={`tracking-step-${step.key}`}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isCurrent ? "bg-red-600 text-white shadow-lg shadow-red-200" : isCompleted ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400"
                    }`}>
                      <step.icon size={18} />
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`w-0.5 h-8 my-1 ${isCompleted ? "bg-red-300" : "bg-gray-200"}`} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className={`font-semibold text-sm ${isCurrent ? "text-red-600" : isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                      {step.label}
                    </p>
                    {isCurrent && <p className="text-xs text-gray-500 mt-0.5">En cours...</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {driver && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Votre livreur</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Truck size={20} className="text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{driver.name}</p>
                <p className="text-xs text-gray-500">{driver.phone}</p>
              </div>
              <button className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600" data-testid="button-call-driver">
                <Phone size={18} />
              </button>
              <button className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600" data-testid="button-chat-driver">
                <MessageCircle size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Details de la commande</h3>
          <div className="space-y-2">
            {(items as any[]).map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.qty}x {item.name}</span>
                <span className="font-medium">{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Livraison</span><span>{formatPrice(order.deliveryFee)}</span></div>
            <div className="flex justify-between font-bold"><span>Total</span><span className="text-red-600">{formatPrice(order.total)}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-2">Adresse de livraison</h3>
          <p className="text-sm text-gray-600 flex items-start gap-2">
            <MapPin size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            {order.deliveryAddress}
          </p>
        </div>
      </div>
    </div>
  );
}
