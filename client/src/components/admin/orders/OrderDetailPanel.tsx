import { useState, useEffect } from "react";
import {
  MapPin, Clock, Printer, Lock, Unlock, MessageSquare,
  Edit3, AlertCircle, CheckCircle2, ChevronRight, X,
} from "lucide-react";
import { apiRequest, queryClient } from "../../../lib/queryClient";
import { useToast } from "../../../hooks/use-toast";
import { formatPrice, formatDate, statusLabels, statusColors, paymentLabels } from "../../../lib/utils";
import type { Order, User, Restaurant } from "@shared/schema";
import { Apple, Play, Globe } from "lucide-react";

const ORDER_STATUS_SEQUENCE = ["pending", "confirmed", "picked_up", "delivered"];
const TERMINAL_STATUSES = ["delivered", "cancelled", "returned"];

function getAvailableStatuses(currentStatus: string): string[] {
  if (TERMINAL_STATUSES.includes(currentStatus)) return [currentStatus];
  const currentIdx = ORDER_STATUS_SEQUENCE.indexOf(currentStatus);
  if (currentIdx === -1) return [currentStatus];
  const forward = ORDER_STATUS_SEQUENCE.slice(currentIdx);
  return [...forward, "cancelled", "returned"];
}

const TERMINAL_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  delivered: { label: "Livrée",    color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800/40" },
  cancelled:  { label: "Annulée",  color: "text-red-700 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-950/20",         border: "border-red-200 dark:border-red-800/40" },
  returned:   { label: "Retournée",color: "text-orange-700 dark:text-orange-400",   bg: "bg-orange-50 dark:bg-orange-950/20",   border: "border-orange-200 dark:border-orange-800/40" },
};

function DeviceIcon({ type }: { type?: string | null }) {
  switch (type) {
    case "ios":     return <Apple size={14} className="text-zinc-400" />;
    case "android": return <Play  size={14} className="text-green-500" />;
    default:        return <Globe size={14} className="text-blue-400" />;
  }
}

const parseOrderItems = (items: any): any[] => {
  if (!items) return [];
  if (typeof items === "string") { try { return JSON.parse(items); } catch { return []; } }
  return items as any[];
};

const parseAdminRemarks = (v: any): any[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v); } catch { return []; }
};

const parseOrderMods = (v: any): any[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v); } catch { return []; }
};

const parseAuditLog = (log: any): Array<{ action: string; by: string; byId?: number; role?: string; timestamp: string; details?: string }> => {
  if (!log) return [];
  if (typeof log === "string") { try { return JSON.parse(log); } catch { return []; } }
  if (Array.isArray(log)) return log;
  return [];
};

interface Props {
  order: Order;
  restaurants: Restaurant[];
  drivers: User[];
  onPrint: () => void;
  onOpenOverride: (order: Order) => void;
  onUpdateStatus: (orderId: number, status: string) => void;
  onAssignDriver: (orderId: number, driverId: number) => void;
}

export default function OrderDetailPanel({ order, restaurants, drivers, onPrint, onOpenOverride, onUpdateStatus, onAssignDriver }: Props) {
  const { toast } = useToast();

  const [remarkText, setRemarkText] = useState("");
  const [remarkLoading, setRemarkLoading] = useState(false);
  const [showModifyPanel, setShowModifyPanel] = useState(false);
  const [modifyItems, setModifyItems] = useState<{ name: string; qty: number; price: string }[]>([]);
  const [modifyDeliveryFee, setModifyDeliveryFee] = useState("");
  const [modifyServiceFee, setModifyServiceFee] = useState("");
  const [modifyRemark, setModifyRemark] = useState("");
  const [modifyLoading, setModifyLoading] = useState(false);

  useEffect(() => {
    const items = parseOrderItems(order.items);
    setModifyItems(items.map((it: any) => ({ name: it.name, qty: it.qty, price: String(it.price) })));
    setModifyDeliveryFee(String(order.deliveryFee));
    setModifyServiceFee(String(order.taxAmount));
    setModifyRemark("");
    setRemarkText("");
    setShowModifyPanel(false);
  }, [order.id]);

  const getRestaurantName = (id: number) => restaurants.find(r => r.id === id)?.name || `Restaurant #${id}`;

  const submitRemark = async () => {
    if (!remarkText.trim()) return;
    setRemarkLoading(true);
    try {
      await apiRequest(`/api/orders/${order.id}/remarks`, {
        method: "POST",
        body: JSON.stringify({ text: remarkText }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setRemarkText("");
      toast({ title: "Remarque ajoutée" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible d'ajouter la remarque", variant: "destructive" });
    } finally {
      setRemarkLoading(false);
    }
  };

  const submitModify = async () => {
    if (!modifyRemark.trim()) {
      toast({ title: "Remarque obligatoire", description: "Vous devez expliquer la raison de cette modification", variant: "destructive" });
      return;
    }
    setModifyLoading(true);
    try {
      const newItems = modifyItems.map(it => ({
        name: it.name,
        qty: it.qty,
        price: parseFloat(it.price) || 0,
      }));
      const newSubtotal = parseFloat(newItems.reduce((s, it) => s + it.price * it.qty, 0).toFixed(2));
      const newDeliveryFee = parseFloat(modifyDeliveryFee) || 0;
      const newTaxAmount = parseFloat(modifyServiceFee) || 0;
      const newTotal = parseFloat(Math.max(0, newSubtotal + newDeliveryFee + newTaxAmount - (order.promoDiscount || 0) - (order.loyaltyCreditDiscount || 0)).toFixed(2));
      await apiRequest(`/api/orders/${order.id}/modify`, {
        method: "PATCH",
        body: JSON.stringify({
          remark: modifyRemark,
          items: newItems,
          subtotal: newSubtotal,
          deliveryFee: newDeliveryFee,
          taxAmount: newTaxAmount,
          total: newTotal,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setShowModifyPanel(false);
      setModifyRemark("");
      toast({ title: "Commande modifiée", description: "Les changements ont été enregistrés avec la remarque" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Modification impossible", variant: "destructive" });
    } finally {
      setModifyLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-5 sticky top-24">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <h3 className="font-bold text-lg" data-testid="text-selected-order-number">{order.orderNumber}</h3>
        <button
          onClick={onPrint}
          data-testid="button-print-detail"
          className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1"
        >
          <Printer size={12} /> Imprimer
        </button>
      </div>

      {/* Order info */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm gap-2 flex-wrap">
          <span className="text-zinc-500 dark:text-zinc-400">Statut</span>
          <span className={`font-bold px-2 py-0.5 rounded ${statusColors[order.status]}`}>
            {statusLabels[order.status]}
          </span>
        </div>
        <div className="flex justify-between text-sm gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Restaurant</span>
          <span className="font-medium">{getRestaurantName(order.restaurantId)}</span>
        </div>
        <div className="flex justify-between text-sm gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Total</span>
          <span className="font-bold text-red-600">{formatPrice(order.total)}</span>
        </div>
        <div className="flex justify-between text-sm gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Paiement</span>
          <span className="font-medium">{paymentLabels[order.paymentMethod]}</span>
        </div>
        <div className="flex justify-between text-sm gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Appareil</span>
          <span className="flex items-center gap-1 font-medium">
            <DeviceIcon type={order.deviceType} /> {order.deviceType || "web"}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Adresse</span>
          <p className="font-medium mt-1 flex items-start gap-1">
            <MapPin size={14} className="text-red-500 mt-0.5 flex-shrink-0" /> {order.deliveryAddress}
          </p>
        </div>
      </div>

      {/* Items & financials */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-2 mb-4">
        <p className="text-xs font-semibold text-zinc-500 uppercase">Articles</p>
        {parseOrderItems(order.items).map((item: any, i: number) => (
          <div key={i} className="flex justify-between text-sm gap-2">
            <span>{item.qty}x {item.name}</span>
            <span className="font-medium">{formatPrice(item.price * item.qty)}</span>
          </div>
        ))}
        <div className="border-t border-gray-50 dark:border-zinc-800 pt-3 mt-2 space-y-1.5">
          <div className="flex justify-between text-xs gap-2">
            <span className="text-zinc-500 dark:text-zinc-400">Sous-total articles</span>
            <span className="font-medium dark:text-zinc-200">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs gap-2">
            <div className="flex items-center gap-1">
              <span className="text-zinc-500 dark:text-zinc-400">Frais de livraison</span>
              {(order as any).deliveryZone && (
                <span className="text-[7px] font-black px-1 py-0.5 rounded-full text-white bg-blue-500">{(order as any).deliveryZone}</span>
              )}
            </div>
            <span className="font-medium dark:text-zinc-200">{formatPrice(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-xs gap-2">
            <span className="text-zinc-500 dark:text-zinc-400">Frais de service</span>
            <span className="font-medium dark:text-zinc-200">{formatPrice(order.taxAmount)}</span>
          </div>
          {order.promoCode ? (
            <div className="flex justify-between text-xs text-green-600 gap-2">
              <span>Promo <span className="font-bold">({order.promoCode})</span></span>
              <span className="font-medium">-{formatPrice(order.promoDiscount)}</span>
            </div>
          ) : order.promoDiscount > 0 ? (
            <div className="flex justify-between text-xs text-green-600 gap-2">
              <span>Réduction</span>
              <span className="font-medium">-{formatPrice(order.promoDiscount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-sm font-bold text-red-600 pt-1.5 border-t border-zinc-100 dark:border-zinc-800 gap-2">
            <span>Total client</span>
            <span>{formatPrice(order.total)}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-700 space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">Répartition financière</p>
            <div className="flex justify-between text-xs gap-2">
              <span className="text-orange-600 dark:text-orange-400">Commission MAWEJA</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">{formatPrice(order.commission)}</span>
            </div>
            <div className="flex justify-between text-xs gap-2">
              <span className="text-blue-600 dark:text-blue-400">Net restaurateur</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{formatPrice(Math.max(0, order.subtotal - order.commission))}</span>
            </div>
            <div className="flex justify-between text-xs gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">Gain agent livraison</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-xs gap-2">
              <span className="text-purple-600 dark:text-purple-400">Revenus MAWEJA (service)</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">{formatPrice(parseFloat((order.commission + order.taxAmount).toFixed(2)))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel reason */}
      {order.status === "cancelled" && order.cancelReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">
          <p className="text-xs font-semibold text-red-700 mb-1">Raison d'annulation</p>
          <p className="text-sm text-red-600" data-testid="text-cancel-reason">{order.cancelReason}</p>
        </div>
      )}

      {/* Rating */}
      {order.rating && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 mb-4">
          <p className="text-xs font-semibold text-yellow-700 mb-1">Evaluation client</p>
          <div className="flex items-center gap-1" data-testid="display-rating">
            {[1, 2, 3, 4, 5].map(s => (
              <span key={s} className={`text-lg ${s <= order.rating! ? "text-yellow-500" : "text-zinc-300"}`}>★</span>
            ))}
          </div>
          {order.feedback && <p className="text-sm text-yellow-700 mt-1">{order.feedback}</p>}
        </div>
      )}

      {/* Audit log */}
      {parseAuditLog(order.auditLog).length > 0 && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mb-4">
          <p className="text-xs font-semibold text-zinc-500 uppercase mb-2">Historique</p>
          <div className="space-y-2" data-testid="audit-log">
            {parseAuditLog(order.auditLog).map((entry, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Clock size={12} className="text-zinc-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-zinc-700">{entry.action}</span>
                  {entry.by && <span className="text-zinc-400"> par {entry.by}</span>}
                  {entry.role && <span className="text-zinc-400"> ({entry.role})</span>}
                  {entry.timestamp && <span className="text-zinc-400 ml-1">{formatDate(entry.timestamp)}</span>}
                  {entry.details && <p className="text-zinc-400 dark:text-zinc-500 mt-0.5">{entry.details}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin remarks */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mb-4">
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-2 flex items-center gap-1">
          <MessageSquare size={12} /> Remarques admin
        </p>
        {parseAdminRemarks((order as any).adminRemarks).length > 0 && (
          <div className="space-y-2 mb-3" data-testid="admin-remarks-list">
            {parseAdminRemarks((order as any).adminRemarks).map((r: any, i: number) => (
              <div key={i} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-3 py-2">
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{r.text}</p>
                <p className="text-[10px] text-amber-500 dark:text-amber-600 mt-1">{r.adminName} · {formatDate(r.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={remarkText}
            onChange={e => setRemarkText(e.target.value)}
            placeholder="Ajouter une remarque interne..."
            rows={2}
            data-testid="input-admin-remark"
            className="flex-1 px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl resize-none dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <button
            onClick={submitRemark}
            disabled={remarkLoading || !remarkText.trim()}
            data-testid="button-add-remark"
            className="self-end px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {remarkLoading ? "..." : "Ajouter"}
          </button>
        </div>
      </div>

      {/* Modify section */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase flex items-center gap-1">
            <Edit3 size={12} /> Modifier la commande
          </p>
          <button
            onClick={() => setShowModifyPanel(!showModifyPanel)}
            data-testid="button-toggle-modify"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
          >
            {showModifyPanel ? "Fermer" : "Modifier"} <ChevronRight size={12} className={showModifyPanel ? "rotate-90" : ""} />
          </button>
        </div>
        {parseOrderMods((order as any).orderModifications).length > 0 && (
          <div className="space-y-2 mb-3" data-testid="order-modifications-list">
            {parseOrderMods((order as any).orderModifications).map((m: any, i: number) => (
              <div key={i} className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl px-3 py-2">
                <div className="flex justify-between text-[10px] text-blue-500 dark:text-blue-400 mb-1">
                  <span className="font-bold">{m.adminName}</span>
                  <span>{formatDate(m.createdAt)}</span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">"{m.remark}"</p>
                <div className="mt-1 text-[10px] text-blue-500 dark:text-blue-500">
                  Total: {formatPrice(m.previousTotal)} → <span className="font-bold text-blue-700 dark:text-blue-300">{formatPrice(m.newTotal)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {showModifyPanel && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 space-y-3">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Articles</p>
              {modifyItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-zinc-600 dark:text-zinc-300 flex-1 truncate">{item.name}</span>
                  <input
                    type="number" min={0} value={item.qty}
                    onChange={e => {
                      const updated = [...modifyItems];
                      updated[idx] = { ...updated[idx], qty: parseInt(e.target.value) || 0 };
                      setModifyItems(updated);
                    }}
                    data-testid={`input-modify-qty-${idx}`}
                    className="w-12 px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg text-center bg-white dark:bg-zinc-800 dark:text-white"
                  />
                  <span className="text-xs text-zinc-400">×</span>
                  <input
                    type="number" min={0} step="0.01" value={item.price}
                    onChange={e => {
                      const updated = [...modifyItems];
                      updated[idx] = { ...updated[idx], price: e.target.value };
                      setModifyItems(updated);
                    }}
                    data-testid={`input-modify-price-${idx}`}
                    className="w-20 px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 dark:text-white"
                  />
                  <button
                    onClick={() => setModifyItems(modifyItems.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Frais livraison ($)</label>
                <input
                  type="number" min={0} step="0.01" value={modifyDeliveryFee}
                  onChange={e => setModifyDeliveryFee(e.target.value)}
                  data-testid="input-modify-delivery-fee"
                  className="w-full mt-1 px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Frais service ($)</label>
                <input
                  type="number" min={0} step="0.01" value={modifyServiceFee}
                  onChange={e => setModifyServiceFee(e.target.value)}
                  data-testid="input-modify-service-fee"
                  className="w-full mt-1 px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1">
                <AlertCircle size={10} /> Remarque obligatoire — raison de la modification
              </label>
              <textarea
                value={modifyRemark}
                onChange={e => setModifyRemark(e.target.value)}
                placeholder="Expliquez la raison de cette modification (obligatoire)..."
                rows={2}
                data-testid="input-modify-remark"
                className="w-full mt-1 px-3 py-2 text-xs border-2 border-red-200 dark:border-red-800/60 rounded-xl resize-none bg-white dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-400"
              />
            </div>
            <button
              onClick={submitModify}
              disabled={modifyLoading || !modifyRemark.trim()}
              data-testid="button-submit-modify"
              className="w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={13} />
              {modifyLoading ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-2">
        <p className="text-xs font-semibold text-zinc-500 uppercase mb-2">Actions</p>
        {TERMINAL_STATUSES.includes(order.status) ? (
          <div className={`rounded-xl border p-3 ${TERMINAL_LABELS[order.status]?.bg || "bg-zinc-50"} ${TERMINAL_LABELS[order.status]?.border || "border-zinc-200"}`}>
            <div className="flex items-center gap-2 mb-2">
              <Lock size={13} className={TERMINAL_LABELS[order.status]?.color || "text-zinc-600"} />
              <span className={`text-xs font-bold ${TERMINAL_LABELS[order.status]?.color || "text-zinc-700"}`}>
                Statut final — {TERMINAL_LABELS[order.status]?.label || order.status}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
              Ce statut est définitif. Pour le modifier, un code d'accès confidentiel est requis. Cette action sera enregistrée dans l'historique.
            </p>
            <button
              onClick={() => onOpenOverride(order)}
              data-testid="button-override-status"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:border-red-300 hover:text-red-600 dark:hover:text-red-400 transition-all shadow-sm"
            >
              <Unlock size={12} /> Modifier avec code d'accès
            </button>
          </div>
        ) : (
          <>
            <select
              onChange={e => onUpdateStatus(order.id, e.target.value)}
              value={order.status}
              data-testid="select-status"
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white"
            >
              {getAvailableStatuses(order.status).map(k => (
                <option key={k} value={k}>{(statusLabels as any)[k] || k}</option>
              ))}
            </select>
            <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
              <Lock size={9} /> Livrée, Annulée, Retournée sont définitifs — code requis pour modification
            </p>
          </>
        )}

        {!order.driverId && (
          <select
            onChange={e => onAssignDriver(order.id, Number(e.target.value))}
            defaultValue=""
            data-testid="select-driver"
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white"
          >
            <option value="" disabled>Assigner un agent</option>
            {drivers.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name} {d.isOnline ? "(En ligne)" : "(Hors ligne)"}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
