import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useToast } from "../../hooks/use-toast";
import { formatPrice, formatDate, statusLabels, paymentLabels } from "../../lib/utils";
import ClientNav from "../../components/ClientNav";
import { ArrowLeft, Truck, Phone, Ban, AlertTriangle, Star, MessageSquare, LifeBuoy } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { StatusStepper } from "../../components/client/order-detail/StatusStepper";
import { CancelModal } from "../../components/client/order-detail/OrderModals";
import { ReviewModal } from "../../components/client/order-detail/ReviewModal";
import { useOrderDetail } from "../../hooks/use-order-detail";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../../lib/queryClient";
import type { Order, Review } from "@shared/schema";

export default function OrderDetailPage() {
  const [, params]   = useRoute("/order/:id");
  const [, navigate] = useLocation();
  const { toast }    = useToast();
  const id           = Number(params?.id);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRateModal,   setShowRateModal]   = useState(false);

  const { order, isLoading, restaurant, driver, whatsappNumber, cancelMutation } = useOrderDetail(id);

  // Avis (PARTIE 6)
  const reviewQuery = useQuery<{ review: Review | null }>({
    queryKey: ["/api/orders", id, "review"],
    enabled: Number.isFinite(id),
  });
  const existingReview = reviewQuery.data?.review ?? null;

  const reviewMutation = useMutation({
    mutationFn: async (payload: {
      restaurantRating: number | null;
      driverRating: number | null;
      comment: string;
      tags: string[];
    }) => {
      const res = await apiRequest(`/api/orders/${id}/review`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", id, "review"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", id] });
      toast({ title: "Merci !", description: "Votre avis a été enregistré." });
      setShowRateModal(false);
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e?.message ?? "Impossible d'enregistrer l'avis.", variant: "destructive" });
    },
  });

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  const canCancel   = order.status === "pending" || order.status === "confirmed";
  const canRate     = order.status === "delivered" && existingReview == null;
  const items: any[] = (() => { try { return typeof order.items === "string" ? JSON.parse(order.items) : (order.items as any[]); } catch { return []; } })();

  const handleCancel = (reason: string) => {
    if (!reason.trim()) {
      toast({ title: "Erreur", description: "Veuillez indiquer une raison.", variant: "destructive" });
      return;
    }
    cancelMutation.mutate(reason, { onSuccess: () => setShowCancelModal(false) });
  };


  const openWhatsApp = () => {
    const dateStr  = new Date(order.createdAt!).toLocaleDateString("fr-CD", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const restName = restaurant?.name || "Restaurant";
    const msg = encodeURIComponent(
      `Bonjour MAWEJA,\n\nJe vous contacte au sujet de ma commande:\n` +
      `- N° de commande: ${order.orderNumber}\n` +
      `- Date: ${dateStr}\n` +
      `- Restaurant: ${restName}\n` +
      `- Montant: ${formatPrice(order.total)}\n` +
      `- Statut actuel: ${statusLabels[order.status] || order.status}\n\n` +
      `Merci de votre aide.`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, "_blank");
  };

  const adminRemarks: any[] = Array.isArray((order as any).adminRemarks)
    ? (order as any).adminRemarks
    : (() => { try { return JSON.parse((order as any).adminRemarks || "[]"); } catch { return []; } })();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <ClientNav />

      {showCancelModal && (
        <CancelModal
          isPending={cancelMutation.isPending}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancel}
        />
      )}
      {showRateModal && (
        <ReviewModal
          isPending={reviewMutation.isPending}
          hasRestaurant={Boolean(order.restaurantId)}
          hasDriver={Boolean(order.driverId)}
          onClose={() => setShowRateModal(false)}
          onSubmit={(p) => reviewMutation.mutate(p)}
        />
      )}

      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/orders")}
            className="w-10 h-10 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700"
            data-testid="button-back-orders"
          >
            <ArrowLeft size={18} className="text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Commande {order.orderNumber}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.createdAt!)}</p>
          </div>
        </div>

        {isCancelled && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-4 flex items-center gap-3" data-testid="banner-cancelled">
            <Ban size={20} className="text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-700 dark:text-red-400 text-sm">Commande annulee</p>
              {order.cancelReason && <p className="text-xs text-red-500 mt-0.5">Raison : {order.cancelReason}</p>}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Statut de la commande</h3>
            <div
              className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{
                background: order.status === "delivered" ? "#DCFCE7" : isCancelled ? "#FEE2E2" : "#FEF3C7",
                color: order.status === "delivered" ? "#16A34A" : isCancelled ? "#dc2626" : "#D97706",
              }}
            >
              {order.status === "delivered" ? "Livrée ✓" : isCancelled ? "Annulée" : "En cours…"}
            </div>
          </div>
          {!isCancelled && <StatusStepper status={order.status} />}
        </div>

        {/* Order summary */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 mb-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Resume de la commande</h3>
          {restaurant && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">{restaurant.name}</p>}
          <div className="space-y-2">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{item.qty} x {item.name}</span>
                <span className="font-medium dark:text-white">{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 mt-3 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Sous-total articles</span>
              <span className="font-medium dark:text-white">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 dark:text-gray-400">Frais de livraison</span>
                {(order as any).deliveryZone && (
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900/40">{(order as any).deliveryZone}</span>
                )}
              </div>
              <span className="font-medium dark:text-white">{formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Frais de service</span>
              <span className="font-medium dark:text-white">{formatPrice(order.taxAmount)}</span>
            </div>
            {order.promoCode ? (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Réduction promo <span className="font-bold text-xs">({order.promoCode})</span></span>
                <span className="font-medium">-{formatPrice(order.promoDiscount)}</span>
              </div>
            ) : order.promoDiscount > 0 ? (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Réduction</span>
                <span className="font-medium">-{formatPrice(order.promoDiscount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="dark:text-white">Total payé</span>
              <span className="text-red-600">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 mb-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Details</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: "Numero",   value: order.orderNumber },
              { label: "Date",     value: formatDate(order.createdAt!) },
              { label: "Paiement", value: paymentLabels[order.paymentMethod] || order.paymentMethod },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className="font-medium dark:text-white">{value}</span>
              </div>
            ))}
            <div className="flex justify-between items-start gap-2">
              <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">Adresse</span>
              <span className="font-medium dark:text-white text-right">{order.deliveryAddress}</span>
            </div>
          </div>
        </div>

        {/* Admin remarks */}
        {adminRemarks.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 mb-4" data-testid="admin-remarks-client">
            <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
              <MessageSquare size={14} /> Notes MAWEJA
            </h3>
            <div className="space-y-2">
              {adminRemarks.map((r: any, i: number) => (
                <div key={i}>
                  <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">{r.text}</p>
                  <p className="text-[10px] text-amber-500 mt-0.5">{formatDate(r.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Driver */}
        {driver && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 mb-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Votre agent</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center">
                <Truck size={20} className="text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm dark:text-white">{driver.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{driver.phone}</p>
              </div>
              <a
                href={`tel:${driver.phone}`}
                className="w-10 h-10 bg-red-50 dark:bg-red-950/40 rounded-xl flex items-center justify-center text-red-600"
                data-testid="button-call-driver"
              >
                <Phone size={18} />
              </a>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate(`/support/new?orderId=${order.id}`)}
          data-testid="button-report-problem"
          className="w-full py-3.5 rounded-2xl bg-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-200 mt-4 hover:bg-amber-600 transition-all"
        >
          <LifeBuoy size={18} />
          Signaler un problème
        </button>

        <button
          onClick={openWhatsApp}
          data-testid="button-whatsapp-order"
          className="w-full py-3.5 rounded-2xl bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-green-200 mt-4 hover:bg-green-700 transition-all"
        >
          <SiWhatsapp size={18} />
          Contacter le service client via WhatsApp
        </button>

        <div className="flex flex-col gap-3 mt-4">
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              data-testid="button-cancel-order"
              className="w-full py-3 rounded-2xl border-2 border-red-200 dark:border-red-800 text-red-600 font-semibold text-sm flex items-center justify-center gap-2"
            >
              <AlertTriangle size={16} />
              Annuler la commande
            </button>
          )}
          {canRate && (
            <button
              onClick={() => setShowRateModal(true)}
              data-testid="button-rate-order"
              className="w-full py-3 rounded-2xl bg-red-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-200"
            >
              <Star size={16} />
              Evaluer la commande
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
