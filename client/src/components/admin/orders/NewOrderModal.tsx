import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Plus, Minus } from "lucide-react";
import { apiRequest, queryClient, authFetchJson } from "../../../lib/queryClient";
import { useToast } from "../../../hooks/use-toast";
import { formatPrice, statusLabels, paymentLabels } from "../../../lib/utils";
import { getDevicePlatform } from "../../../lib/notify";
import type { Restaurant, MenuItem } from "@shared/schema";

type DeliveryZone = { id: number; name: string; fee: number; color: string; isActive: boolean };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
  deliveryZones: DeliveryZone[];
  appSettings?: Record<string, string>;
}

export default function NewOrderModal({ isOpen, onClose, restaurants, deliveryZones, appSettings }: Props) {
  const { toast } = useToast();

  const [newOrderRestaurant, setNewOrderRestaurant] = useState<number | null>(null);
  const [newOrderItems, setNewOrderItems] = useState<Record<number, number>>({});
  const [newOrderItemPrices, setNewOrderItemPrices] = useState<Record<number, string>>({});
  const [newOrderCustomItems, setNewOrderCustomItems] = useState<{ name: string; price: string; qty: number }[]>([]);
  const [newOrderClientName, setNewOrderClientName] = useState("");
  const [newOrderClientPhone, setNewOrderClientPhone] = useState("");
  const [newOrderAddress, setNewOrderAddress] = useState("");
  const [newOrderPayment, setNewOrderPayment] = useState("cash");
  const [newOrderZoneId, setNewOrderZoneId] = useState<number | "custom" | "">("");
  const [newOrderDeliveryFee, setNewOrderDeliveryFee] = useState("0");
  const [newOrderServiceFee, setNewOrderServiceFee] = useState("0");
  const [newOrderDiscount, setNewOrderDiscount] = useState("0");
  const [newOrderNotes, setNewOrderNotes] = useState("");
  const [newOrderInitialStatus, setNewOrderInitialStatus] = useState("pending");
  const [newCustomItemName, setNewCustomItemName] = useState("");
  const [newCustomItemPrice, setNewCustomItemPrice] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/restaurants", newOrderRestaurant, "menu"],
    queryFn: () =>
      newOrderRestaurant
        ? authFetchJson(`/api/restaurants/${newOrderRestaurant}/menu?adminView=true`)
        : Promise.resolve([]),
    enabled: !!newOrderRestaurant,
  });

  useEffect(() => {
    if (isOpen && appSettings?.service_fee) {
      setNewOrderServiceFee(appSettings.service_fee);
    }
  }, [isOpen, appSettings]);

  useEffect(() => {
    if (newOrderZoneId !== "" && newOrderZoneId !== "custom") {
      const zone = deliveryZones.find(z => z.id === Number(newOrderZoneId));
      if (zone) setNewOrderDeliveryFee(String(zone.fee));
    }
  }, [newOrderZoneId, deliveryZones]);

  const newOrderMenuSubtotal = Object.entries(newOrderItems).reduce((sum, [id, qty]) => {
    const item = menuItems.find(m => m.id === Number(id));
    if (!item) return sum;
    const customPrice = parseFloat(newOrderItemPrices[Number(id)] ?? "");
    const price = isFinite(customPrice) && customPrice >= 0 ? customPrice : item.price;
    return sum + price * qty;
  }, 0);

  const newOrderCustomSubtotal = newOrderCustomItems.reduce((sum, ci) => {
    const p = parseFloat(ci.price);
    return sum + (isFinite(p) ? p * ci.qty : 0);
  }, 0);

  const newOrderSubtotal = parseFloat((newOrderMenuSubtotal + newOrderCustomSubtotal).toFixed(2));
  const noFee = parseFloat(newOrderDeliveryFee) || 0;
  const noServiceFee = parseFloat(newOrderServiceFee) || 0;
  const noDiscount = parseFloat(newOrderDiscount) || 0;
  const newOrderTotal = parseFloat(Math.max(0, newOrderSubtotal + noFee + noServiceFee - noDiscount).toFixed(2));

  const resetForm = () => {
    setNewOrderRestaurant(null);
    setNewOrderItems({});
    setNewOrderItemPrices({});
    setNewOrderCustomItems([]);
    setNewOrderClientName("");
    setNewOrderClientPhone("");
    setNewOrderAddress("");
    setNewOrderPayment("cash");
    setNewOrderZoneId("");
    setNewOrderDeliveryFee("0");
    setNewOrderServiceFee(appSettings?.service_fee ?? "0");
    setNewOrderDiscount("0");
    setNewOrderNotes("");
    setNewOrderInitialStatus("pending");
    setNewCustomItemName("");
    setNewCustomItemPrice("");
  };

  const handleClose = () => { onClose(); resetForm(); };

  const submitNewOrder = async () => {
    if (!newOrderRestaurant) {
      toast({ title: "Choisissez un restaurant / boutique", variant: "destructive" }); return;
    }
    if (!newOrderClientName || !newOrderClientPhone) {
      toast({ title: "Nom et téléphone du client requis", variant: "destructive" }); return;
    }
    if (!newOrderAddress) {
      toast({ title: "Adresse de livraison requise", variant: "destructive" }); return;
    }

    const menuItemsArr = Object.entries(newOrderItems)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = menuItems.find(m => m.id === Number(id));
        const customPrice = parseFloat(newOrderItemPrices[Number(id)] ?? "");
        const price = isFinite(customPrice) && customPrice >= 0 ? customPrice : (item?.price ?? 0);
        return { menuItemId: Number(id), name: item?.name ?? "", price, quantity: qty };
      });

    const customItemsArr = newOrderCustomItems
      .filter(ci => ci.qty > 0 && ci.name.trim())
      .map(ci => ({ name: ci.name.trim(), price: parseFloat(ci.price) || 0, quantity: ci.qty }));

    const itemsArr = [...menuItemsArr, ...customItemsArr];

    if (itemsArr.length === 0) {
      toast({ title: "Ajoutez au moins un article", variant: "destructive" }); return;
    }

    setSubmittingOrder(true);
    try {
      await apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          adminOverride: true,
          restaurantId: newOrderRestaurant,
          items: itemsArr,
          subtotal: newOrderSubtotal,
          deliveryFee: noFee,
          taxAmount: noServiceFee,
          promoDiscount: noDiscount,
          total: newOrderTotal,
          paymentMethod: newOrderPayment,
          deliveryAddress: newOrderAddress,
          orderName: newOrderClientName,
          orderPhone: newOrderClientPhone,
          notes: newOrderNotes,
          status: newOrderInitialStatus,
          zoneId: newOrderZoneId !== "" && newOrderZoneId !== "custom" ? newOrderZoneId : undefined,
          deliveryZone: newOrderZoneId === "custom" ? "Personnalisé" : undefined,
          commission: 0,
          promoCode: null,
          deviceType: getDevicePlatform(),
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "✅ Commande créée !", description: `Client: ${newOrderClientName} — Total: $${newOrderTotal.toFixed(2)}` });
      handleClose();
    } catch (e: any) {
      toast({ title: "Erreur création", description: e.message || "Impossible de créer la commande", variant: "destructive" });
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" data-testid="modal-new-order">
      <div className="bg-white dark:bg-[#18181f] rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[96vh] overflow-y-auto mx-0 sm:mx-4">
        <div className="sticky top-0 bg-white dark:bg-[#18181f] px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 rounded-t-3xl z-10">
          <div>
            <h2 className="text-base font-black text-zinc-900 dark:text-white">Nouvelle commande admin</h2>
            <p className="text-xs text-zinc-400">Liberté totale — tous les champs sont éditables</p>
          </div>
          <button
            onClick={handleClose}
            data-testid="button-close-modal"
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* 1. Restaurant */}
          <section>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-2">1. Restaurant / Boutique</p>
            <select
              value={newOrderRestaurant || ""}
              onChange={(e) => { setNewOrderRestaurant(Number(e.target.value) || null); setNewOrderItems({}); setNewOrderItemPrices({}); }}
              data-testid="select-new-order-restaurant"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white font-medium"
            >
              <option value="">— Choisir un établissement —</option>
              {restaurants.filter(r => r.type === "restaurant" || !r.type).length > 0 && (
                <optgroup label="🍽️ Restaurants">
                  {restaurants.filter(r => r.type === "restaurant" || !r.type).map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </optgroup>
              )}
              {restaurants.filter(r => r.type === "boutique").length > 0 && (
                <optgroup label="🛍️ Boutiques">
                  {restaurants.filter(r => r.type === "boutique").map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </section>

          {/* 2. Menu items */}
          {newOrderRestaurant && (
            <section>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-2">2. Articles du menu</p>
              {menuItems.length === 0 ? (
                <p className="text-xs text-zinc-400 italic py-2">Chargement du menu...</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {menuItems.map((item) => {
                    const qty = newOrderItems[item.id] || 0;
                    const customPriceVal = newOrderItemPrices[item.id] ?? "";
                    return (
                      <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${qty > 0 ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40" : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-700"}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-800 dark:text-white truncate">{item.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-zinc-400 line-through">{formatPrice(item.price)}</span>
                            <input
                              type="number" min="0" step="0.01"
                              value={customPriceVal}
                              onChange={e => setNewOrderItemPrices(p => ({ ...p, [item.id]: e.target.value }))}
                              placeholder={String(item.price)}
                              data-testid={`input-price-${item.id}`}
                              className="w-20 px-2 py-0.5 text-xs bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-gray-600 rounded-lg dark:text-white focus:outline-none focus:ring-1 focus:ring-red-400"
                            />
                            <span className="text-[9px] text-zinc-400">USD</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => setNewOrderItems(p => ({ ...p, [item.id]: Math.max((p[item.id] || 0) - 1, 0) }))}
                            data-testid={`button-decrease-${item.id}`}
                            className="w-7 h-7 flex items-center justify-center bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-gray-600 rounded-lg hover:bg-red-50 text-zinc-600 dark:text-zinc-300"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-black w-6 text-center text-zinc-800 dark:text-white" data-testid={`qty-${item.id}`}>{qty}</span>
                          <button
                            onClick={() => setNewOrderItems(p => ({ ...p, [item.id]: (p[item.id] || 0) + 1 }))}
                            data-testid={`button-increase-${item.id}`}
                            className="w-7 h-7 flex items-center justify-center bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* 3. Custom items */}
          <section>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-2">3. Articles personnalisés (hors menu)</p>
            <div className="flex gap-2 mb-2">
              <input
                type="text" value={newCustomItemName} onChange={e => setNewCustomItemName(e.target.value)}
                placeholder="Nom de l'article..." data-testid="input-custom-item-name"
                className="flex-1 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
              <input
                type="number" min="0" step="0.01" value={newCustomItemPrice} onChange={e => setNewCustomItemPrice(e.target.value)}
                placeholder="Prix $" data-testid="input-custom-item-price"
                className="w-24 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
              <button
                onClick={() => {
                  if (!newCustomItemName.trim()) return;
                  setNewOrderCustomItems(prev => [...prev, { name: newCustomItemName.trim(), price: newCustomItemPrice || "0", qty: 1 }]);
                  setNewCustomItemName(""); setNewCustomItemPrice("");
                }}
                data-testid="button-add-custom-item"
                className="px-3 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            {newOrderCustomItems.length > 0 && (
              <div className="space-y-1.5">
                {newOrderCustomItems.map((ci, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 dark:text-white truncate">{ci.name}</p>
                      <div className="flex items-center gap-1">
                        <input
                          type="number" min="0" step="0.01" value={ci.price}
                          onChange={e => setNewOrderCustomItems(prev => prev.map((c, i) => i === idx ? { ...c, price: e.target.value } : c))}
                          className="w-20 px-2 py-0.5 text-xs bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-gray-600 rounded-lg dark:text-white"
                        />
                        <span className="text-[9px] text-zinc-400">USD</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setNewOrderCustomItems(p => p.map((c, i) => i === idx ? { ...c, qty: Math.max(1, c.qty - 1) } : c))} className="w-6 h-6 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-gray-600 rounded-lg flex items-center justify-center"><Minus size={10} /></button>
                      <span className="text-xs font-bold w-5 text-center">{ci.qty}</span>
                      <button onClick={() => setNewOrderCustomItems(p => p.map((c, i) => i === idx ? { ...c, qty: c.qty + 1 } : c))} className="w-6 h-6 bg-red-600 text-white rounded-lg flex items-center justify-center"><Plus size={10} /></button>
                      <button onClick={() => setNewOrderCustomItems(p => p.filter((_, i) => i !== idx))} className="w-6 h-6 text-red-400 hover:text-red-600 flex items-center justify-center ml-1"><X size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 4. Client info */}
          <section>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-2">4. Informations client</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Nom complet *</label>
                <input
                  type="text" value={newOrderClientName} onChange={e => setNewOrderClientName(e.target.value)}
                  placeholder="Ex: Jean Mutombo" data-testid="input-client-name"
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Téléphone *</label>
                <input
                  type="text" value={newOrderClientPhone} onChange={e => setNewOrderClientPhone(e.target.value)}
                  placeholder="+243 8X XXX XXXX" data-testid="input-client-phone"
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Adresse de livraison *</label>
              <input
                type="text" value={newOrderAddress} onChange={e => setNewOrderAddress(e.target.value)}
                placeholder="Quartier, avenue, numéro, commune..." data-testid="input-delivery-address"
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>
            <div className="mt-3">
              <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Notes / Instructions</label>
              <input
                type="text" value={newOrderNotes} onChange={e => setNewOrderNotes(e.target.value)}
                placeholder="Instructions de livraison, remarques..." data-testid="input-order-notes"
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none"
              />
            </div>
          </section>

          {/* 5. Zone & Fees */}
          <section>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-2">5. Zone & Frais de livraison</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Zone de livraison</label>
                <select
                  value={String(newOrderZoneId)}
                  onChange={e => setNewOrderZoneId(e.target.value === "custom" ? "custom" : (e.target.value ? Number(e.target.value) : ""))}
                  data-testid="select-delivery-zone"
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white"
                >
                  <option value="">— Sans zone —</option>
                  {deliveryZones.filter(z => z.isActive).map(z => (
                    <option key={z.id} value={z.id}>{z.name} — ${z.fee.toFixed(2)}</option>
                  ))}
                  <option value="custom">✏️ Personnalisé</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1 block">
                  Frais livraison ($)
                  {newOrderZoneId !== "" && newOrderZoneId !== "custom" && (
                    <span className="text-[9px] text-blue-500">(auto-zone, éditable)</span>
                  )}
                </label>
                <input
                  type="number" min="0" step="0.01" value={newOrderDeliveryFee}
                  onChange={e => setNewOrderDeliveryFee(e.target.value)}
                  data-testid="input-delivery-fee"
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Frais de service ($)</label>
                <input
                  type="number" min="0" step="0.01" value={newOrderServiceFee}
                  onChange={e => setNewOrderServiceFee(e.target.value)}
                  data-testid="input-service-fee"
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Remise / Réduction ($)</label>
                <input
                  type="number" min="0" step="0.01" value={newOrderDiscount}
                  onChange={e => setNewOrderDiscount(e.target.value)}
                  data-testid="input-order-discount"
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>
            </div>
          </section>

          {/* 6. Payment & Status */}
          <section>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-2">6. Paiement & Statut</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Mode de paiement</label>
                <select
                  value={newOrderPayment} onChange={e => setNewOrderPayment(e.target.value)}
                  data-testid="select-new-order-payment"
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white"
                >
                  {Object.entries(paymentLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Statut initial</label>
                <select
                  value={newOrderInitialStatus} onChange={e => setNewOrderInitialStatus(e.target.value)}
                  data-testid="select-initial-status"
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white"
                >
                  {["pending", "confirmed", "picked_up"].map(s => (
                    <option key={s} value={s}>{(statusLabels as any)[s] || s}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Récapitulatif</p>
            <div className="flex justify-between text-sm gap-2">
              <span className="text-zinc-500 dark:text-zinc-400">Sous-total articles</span>
              <span className="font-semibold dark:text-white" data-testid="text-new-subtotal">{formatPrice(newOrderSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm gap-2">
              <span className="text-zinc-500 dark:text-zinc-400">Frais de livraison</span>
              <span className="font-semibold dark:text-white">{formatPrice(noFee)}</span>
            </div>
            <div className="flex justify-between text-sm gap-2">
              <span className="text-zinc-500 dark:text-zinc-400">Frais de service</span>
              <span className="font-semibold dark:text-white">{formatPrice(noServiceFee)}</span>
            </div>
            {noDiscount > 0 && (
              <div className="flex justify-between text-sm gap-2 text-green-600">
                <span>Remise</span>
                <span className="font-semibold">-{formatPrice(noDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-red-600 pt-2 border-t border-zinc-200 dark:border-zinc-700 gap-2">
              <span>TOTAL</span>
              <span data-testid="text-new-total">{formatPrice(newOrderTotal)}</span>
            </div>
          </section>

          <button
            onClick={submitNewOrder}
            disabled={submittingOrder}
            data-testid="button-submit-new-order"
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-200 dark:shadow-none"
          >
            {submittingOrder ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Création en cours...</>
            ) : (
              <><Plus size={16} /> Créer la commande</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
