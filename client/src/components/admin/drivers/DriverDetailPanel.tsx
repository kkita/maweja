import { Truck, Phone, Bell, Edit, Ban, CheckCircle2, Trash2, Send, Package, MapPin, Navigation, ChevronLeft } from "lucide-react";
import { formatPrice, statusColors, statusLabels, formatPaymentMethod } from "../../../lib/utils";
import type { Order } from "@shared/schema";
import { CountdownTimer } from "./DriverTimers";

interface Props {
  driver: any;
  activeOrders: Order[];
  deliveredOrders: Order[];
  getDriverStatus: (d: any) => string;
  chatMessage: string;
  onChatChange: (v: string) => void;
  onSendChat: () => void;
  onAlarm: () => void;
  onEdit: () => void;
  onBlock: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export default function DriverDetailPanel({
  driver: sd, activeOrders: sdOrders, deliveredOrders: sdDelivered,
  getDriverStatus, chatMessage, onChatChange, onSendChat,
  onAlarm, onEdit, onBlock, onDelete, onBack,
}: Props) {
  const status = getDriverStatus(sd);
  const statusBg = status === "busy" ? "bg-orange-100" : status === "online" ? "bg-green-100" : status === "blocked" ? "bg-red-100" : "bg-zinc-100";
  const statusIcon = status === "busy" ? "text-orange-600" : status === "online" ? "text-green-600" : status === "blocked" ? "text-red-600" : "text-zinc-400";
  const statusBadge = status === "busy" ? "bg-orange-100 text-orange-700" : status === "online" ? "bg-green-100 text-green-700" : status === "blocked" ? "bg-red-100 text-red-700" : "bg-zinc-100 text-zinc-500";
  const statusLabel = status === "busy" ? "EN LIVRAISON" : status === "online" ? "DISPONIBLE" : status === "blocked" ? "BLOQUE" : "HORS LIGNE";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
        <button onClick={onBack} className="lg:hidden flex items-center gap-1 text-xs text-zinc-500 mb-3 hover:text-zinc-700" data-testid="back-to-list">
          <ChevronLeft size={14} /> Retour a la liste
        </button>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${statusBg}`}>
              <Truck size={22} className={statusIcon} />
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${sd.isOnline ? "bg-green-500" : "bg-zinc-400"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-sm text-zinc-900 truncate" data-testid="driver-detail-name">{sd.name}</h3>
            <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5"><Phone size={9} />{sd.phone}</p>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block ${statusBadge}`}>{statusLabel}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-0 border-b border-zinc-100 dark:border-zinc-800">
        <div className="p-3 text-center border-r border-zinc-100 dark:border-zinc-800">
          <p className="text-base font-black text-green-600">{formatPrice(sdDelivered.reduce((s, o) => s + o.deliveryFee, 0))}</p>
          <p className="text-[8px] text-zinc-400 dark:text-zinc-500 mt-0.5">GAINS</p>
        </div>
        <div className="p-3 text-center border-r border-zinc-100 dark:border-zinc-800">
          <p className="text-base font-black text-blue-600">{sdDelivered.length}</p>
          <p className="text-[8px] text-zinc-400 dark:text-zinc-500 mt-0.5">LIVREES</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-base font-black text-orange-600">{sdOrders.length}</p>
          <p className="text-[8px] text-zinc-400 dark:text-zinc-500 mt-0.5">EN COURS</p>
        </div>
      </div>

      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-[10px] text-zinc-500 mb-2 font-semibold">INFORMATIONS</p>
        <div className="space-y-1.5 text-xs text-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Vehicule</span>
            <span className="font-semibold capitalize">{sd.vehicleType || "Moto"}</span>
          </div>
          {sd.vehiclePlate && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Plaque</span>
              <span className="font-semibold">{sd.vehiclePlate}</span>
            </div>
          )}
          {sd.driverLicense && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Pièce d'identité</span>
              <span className="font-semibold">{sd.driverLicense}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Commission</span>
            <span className="font-semibold">{sd.commissionRate || 15}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Email</span>
            <span className="font-semibold text-[10px] truncate ml-2">{sd.email}</span>
          </div>
        </div>
      </div>

      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-[10px] text-zinc-500 mb-2 font-semibold">ACTIONS RAPIDES</p>
        <div className="grid grid-cols-4 gap-1.5">
          <button onClick={onAlarm} data-testid="button-alarm-driver"
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-red-50 hover:bg-red-100 transition-colors" title="Alarme">
            <Bell size={16} className="text-red-600" />
            <span className="text-[8px] text-red-600 font-semibold">Alarme</span>
          </button>
          <button onClick={onEdit} data-testid="button-edit-selected"
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors" title="Modifier">
            <Edit size={16} className="text-blue-600" />
            <span className="text-[8px] text-blue-600 font-semibold">Modifier</span>
          </button>
          <button onClick={onBlock} data-testid="button-block-selected"
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${sd.isBlocked ? "bg-green-50 hover:bg-green-100" : "bg-orange-50 hover:bg-orange-100"}`}>
            {sd.isBlocked
              ? <CheckCircle2 size={16} className="text-green-600" />
              : <Ban size={16} className="text-orange-600" />}
            <span className={`text-[8px] font-semibold ${sd.isBlocked ? "text-green-600" : "text-orange-600"}`}>
              {sd.isBlocked ? "Debloquer" : "Bloquer"}
            </span>
          </button>
          <button onClick={onDelete} data-testid="button-delete-selected"
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-red-50 hover:bg-red-100 transition-colors" title="Supprimer">
            <Trash2 size={16} className="text-red-600" />
            <span className="text-[8px] text-red-600 font-semibold">Supprimer</span>
          </button>
        </div>
      </div>

      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-[10px] text-zinc-500 mb-2 font-semibold">MESSAGE RAPIDE</p>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={chatMessage}
            onChange={e => onChatChange(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onSendChat()}
            placeholder={`Ecrire a ${sd.name?.split(" ")[0]}...`}
            data-testid="quick-chat-input"
            className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
          <button onClick={onSendChat} data-testid="quick-chat-send"
            className="w-9 h-9 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 shrink-0">
            <Send size={14} />
          </button>
        </div>
      </div>

      {sdOrders.length > 0 && (
        <div className="p-3">
          <p className="text-[10px] text-zinc-500 mb-2 font-semibold flex items-center gap-1">
            <Package size={10} className="text-orange-600" /> LIVRAISONS EN COURS ({sdOrders.length})
          </p>
          <div className="space-y-2">
            {sdOrders.map(order => (
              <div key={order.id} className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-100 dark:border-zinc-800" data-testid={`driver-order-${order.id}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[10px] text-zinc-900 dark:text-white">{order.orderNumber}</span>
                  <CountdownTimer estimatedDelivery={order.estimatedDelivery} compact />
                </div>
                <p className="text-[9px] text-zinc-500 flex items-center gap-1 truncate">
                  <MapPin size={8} />{order.deliveryAddress}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] font-bold text-red-600">{formatPrice(order.total)}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                </div>
                <p className="text-[9px] text-zinc-500 mt-0.5">{formatPaymentMethod(order.paymentMethod)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {sd.lat && sd.lng && (
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-[9px] text-zinc-400 flex items-center gap-1">
            <Navigation size={9} /> GPS: {sd.lat.toFixed(4)}, {sd.lng.toFixed(4)}
          </p>
        </div>
      )}
    </div>
  );
}
