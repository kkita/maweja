import { useLocation } from "wouter";
import { MapPin, Package, Banknote, ChevronRight } from "lucide-react";
import { dt, DCard } from "../DriverUI";
import { formatPrice, formatDate } from "../../../lib/utils";
import type { Order } from "@shared/schema";

interface PendingOrderCardProps {
  order: Order;
}

export default function PendingOrderCard({ order }: PendingOrderCardProps) {
  const [, navigate] = useLocation();
  const isCash = order.paymentMethod === "cash";

  return (
    <DCard
      onClick={() => navigate(`/driver/order/${order.id}`)}
      className="active:scale-[0.99] transition-transform"
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,158,11,0.15)" }}>
              <Package size={18} style={{ color: dt.amber }} />
            </div>
            <div>
              <p className="font-black text-white text-sm">{order.orderNumber}</p>
              <p className="text-[10px] font-medium" style={{ color: dt.text3 }}>{formatDate(order.createdAt!)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg" style={{ background: "rgba(245,158,11,0.15)", color: dt.amber }}>
              Disponible
            </span>
            <ChevronRight size={16} style={{ color: dt.text3 }} />
          </div>
        </div>

        <div className="flex items-start gap-2 mb-3">
          <MapPin size={13} className="flex-shrink-0 mt-0.5" style={{ color: dt.red }} />
          <p className="text-xs text-white leading-snug">{order.deliveryAddress}</p>
        </div>

        <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${dt.border}` }}>
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
            style={{ background: isCash ? "rgba(34,197,94,0.1)" : "rgba(96,165,250,0.1)" }}
          >
            <Banknote size={13} style={{ color: isCash ? dt.green : dt.blue }} />
            <span className="text-[10px] font-bold" style={{ color: isCash ? dt.green : dt.blue }}>
              {isCash ? "Cash à récolter" : "Mobile Money"}
            </span>
          </div>
          <span className="font-black text-base" style={{ color: dt.green }}>+{formatPrice(order.deliveryFee)}</span>
        </div>
      </div>
    </DCard>
  );
}
