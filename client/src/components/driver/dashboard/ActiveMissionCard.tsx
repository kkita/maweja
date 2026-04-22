import { useLocation } from "wouter";
import { MapPin, Phone, Banknote, ChevronRight } from "lucide-react";
import { dt, DBtn, DStatusBadge } from "../DriverUI";
import { formatPrice } from "../../../lib/utils";
import Countdown from "./Countdown";
import type { Order } from "@shared/schema";

interface ActiveMissionCardProps {
  order: Order;
  onAction: (status: string) => void;
}

export default function ActiveMissionCard({ order, onAction }: ActiveMissionCardProps) {
  const [, navigate] = useLocation();
  const isPickedUp = order.status === "picked_up";
  const isCash = order.paymentMethod === "cash";

  const nextAction = isPickedUp
    ? { label: "Commande Livrée ✓", variant: "deliver" as const, status: "delivered" }
    : { label: "Commande Récupérée", variant: "blue" as const, status: "picked_up" };

  return (
    <div
      className="driver-mission-gradient rounded-3xl overflow-hidden relative"
      style={{
        border: `1px solid ${isPickedUp ? "rgba(249,115,22,0.4)" : "rgba(96,165,250,0.3)"}`,
        boxShadow: isPickedUp ? "0 0 24px rgba(249,115,22,0.12)" : "0 0 24px rgba(96,165,250,0.12)",
      }}
    >
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-driver-border">
        <div className="relative">
          <div className="w-2 h-2 rounded-full" style={{ background: isPickedUp ? dt.orange : dt.blue, opacity: 0.4, position: "absolute", animation: "ping 1.2s cubic-bezier(0,0,0.2,1) infinite" }} />
          <div className="w-2 h-2 rounded-full" style={{ background: isPickedUp ? dt.orange : dt.blue }} />
        </div>
        <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: isPickedUp ? dt.orange : dt.blue }}>
          {isPickedUp ? "En cours de livraison" : "Mission active"}
        </span>
        <button
          onClick={() => navigate(`/driver/order/${order.id}`)}
          className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-driver-text3"
        >
          Détails <ChevronRight size={12} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-black text-driver-text text-base">{order.orderNumber}</p>
          <div className="flex items-center gap-2">
            <DStatusBadge status={order.status} />
            {order.estimatedDelivery && <Countdown estimatedDelivery={order.estimatedDelivery} />}
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl p-3 bg-driver-s2">
          <MapPin size={16} style={{ color: dt.red }} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm text-driver-text font-medium leading-snug">{order.deliveryAddress}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {order.orderPhone && (
            <a
              href={`tel:${order.orderPhone}`}
              className="flex items-center gap-2 rounded-xl p-3 active:opacity-70 transition-opacity"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
              data-testid="link-call-client"
            >
              <Phone size={16} style={{ color: dt.green }} />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-driver-text3">Client</p>
                <p className="text-xs font-black text-driver-text truncate">{order.orderName || order.orderPhone}</p>
              </div>
            </a>
          )}
          <div
            className="flex items-center gap-2 rounded-xl p-3"
            style={{ background: isCash ? "rgba(34,197,94,0.1)" : "rgba(96,165,250,0.1)", border: `1px solid ${isCash ? "rgba(34,197,94,0.2)" : "rgba(96,165,250,0.2)"}` }}
          >
            {isCash ? <Banknote size={16} style={{ color: dt.green }} /> : <span className="text-base">📱</span>}
            <div>
              <p className="text-[10px] font-semibold text-driver-text3">Paiement</p>
              <p className="text-xs font-black" style={{ color: isCash ? dt.green : dt.blue }}>
                {isCash ? "CASH" : "Mobile"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-driver-s3">
          <span className="text-xs font-semibold text-driver-text2">Votre gain</span>
          <span className="text-lg font-black" style={{ color: dt.green }}>+{formatPrice(order.deliveryFee)}</span>
        </div>

        <DBtn
          label={nextAction.label}
          variant={nextAction.variant}
          fullWidth
          size="lg"
          onClick={() => onAction(nextAction.status)}
          testId={`btn-action-${nextAction.status}`}
        />
      </div>
    </div>
  );
}
