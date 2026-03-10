import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "../../lib/auth";
import { authFetch, apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { formatPrice, formatDate, statusLabels, statusColors, paymentLabels } from "../../lib/utils";
import ClientNav from "../../components/ClientNav";
import {
  ArrowLeft, Clock, CheckCircle, ChefHat, Package, Truck, MapPin,
  Star, X, Phone, MessageCircle, AlertTriangle, Ban,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import type { Order, User, Restaurant } from "@shared/schema";

const steps = [
  { key: "pending", icon: Clock, label: "En attente" },
  { key: "confirmed", icon: CheckCircle, label: "Confirmee" },
  { key: "preparing", icon: ChefHat, label: "En preparation" },
  { key: "ready", icon: Package, label: "Prete" },
  { key: "picked_up", icon: Truck, label: "En livraison" },
  { key: "delivered", icon: MapPin, label: "Livree" },
];

const cancelReasons = [
  "Delai trop long",
  "Changement d'avis",
  "Erreur de commande",
  "Autre",
];

export default function OrderDetailPage() {
  const [, params] = useRoute("/order/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const id = Number(params?.id);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const [showRateModal, setShowRateModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["/api/orders", id],
    queryFn: () => authFetch(`/api/orders/${id}`).then((r) => r.json()),
    enabled: !!id,
    refetchInterval: 10000,
  });

  const { data: restaurant } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", order?.restaurantId],
    queryFn: () => authFetch(`/api/restaurants/${order?.restaurantId}`).then((r) => r.json()),
    enabled: !!order?.restaurantId,
  });

  const { data: driver } = useQuery<Omit<User, "password">>({
    queryKey: ["/api/drivers", order?.driverId],
    queryFn: () =>
      authFetch("/api/drivers")
        .then((r) => r.json())
        .then((drivers: any[]) => drivers.find((d) => d.id === order?.driverId)),
    enabled: !!order?.driverId,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) =>
      apiRequest(`/api/orders/${id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setShowCancelModal(false);
      toast({ title: "Commande annulee", description: "Votre commande a ete annulee avec succes." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'annuler la commande.", variant: "destructive" });
    },
  });

  const rateMutation = useMutation({
    mutationFn: (data: { rating: number; feedback: string }) =>
      apiRequest(`/api/orders/${id}/rate`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setShowRateModal(false);
      toast({ title: "Merci!", description: "Votre avis a ete enregistre." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'envoyer l'avis.", variant: "destructive" });
    },
  });

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);
  const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
  const isCancelled = order.status === "cancelled";
  const canCancel = order.status === "pending" || order.status === "confirmed";
  const canRate = order.status === "delivered" && order.rating == null;

  const handleCancel = () => {
    const reason = cancelReason === "Autre" ? customReason : cancelReason;
    if (!reason.trim()) {
      toast({ title: "Erreur", description: "Veuillez indiquer une raison.", variant: "destructive" });
      return;
    }
    cancelMutation.mutate(reason);
  };

  const handleRate = () => {
    if (rating === 0) {
      toast({ title: "Erreur", description: "Veuillez donner une note.", variant: "destructive" });
      return;
    }
    rateMutation.mutate({ rating, feedback });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/orders")}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200"
            data-testid="button-back-orders"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Commande {order.orderNumber}</h2>
            <p className="text-xs text-gray-500">{formatDate(order.createdAt!)}</p>
          </div>
        </div>

        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-center gap-3" data-testid="banner-cancelled">
            <Ban size={20} className="text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-700 text-sm">Commande annulee</p>
              {order.cancelReason && (
                <p className="text-xs text-red-500 mt-0.5">Raison : {order.cancelReason}</p>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-6">Statut de la commande</h3>
          {!isCancelled && (
            <div className="space-y-0">
              {steps.map((step, i) => {
                const isCompleted = i < currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const isFuture = i > currentStepIndex;
                return (
                  <div key={step.key} className="flex gap-4" data-testid={`step-${step.key}`}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          isCurrent
                            ? "bg-red-600 text-white shadow-lg shadow-red-200"
                            : isCompleted
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <step.icon size={18} />
                      </div>
                      {i < steps.length - 1 && (
                        <div
                          className={`w-0.5 h-8 my-1 ${
                            isCompleted ? "bg-green-300" : isCurrent ? "bg-red-300" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                    <div className="pb-4">
                      <p
                        className={`font-semibold text-sm ${
                          isCurrent
                            ? "text-red-600"
                            : isCompleted
                            ? "text-green-700"
                            : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && <p className="text-xs text-gray-500 mt-0.5">En cours...</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Resume de la commande</h3>
          {restaurant && (
            <p className="text-xs text-gray-500 mb-3 font-medium">{restaurant.name}</p>
          )}
          <div className="space-y-2">
            {(items as any[]).map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.qty} x {item.name}
                </span>
                <span className="font-medium">{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sous-total</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Livraison</span>
              <span>{formatPrice(order.deliveryFee)}</span>
            </div>
            {order.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Taxes</span>
                <span>{formatPrice(order.taxAmount)}</span>
              </div>
            )}
            {order.promoDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Reduction promo</span>
                <span>-{formatPrice(order.promoDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-1 border-t border-gray-100">
              <span>Total</span>
              <span className="text-red-600">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Numero</span>
              <span className="font-medium">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium">{formatDate(order.createdAt!)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Paiement</span>
              <span className="font-medium">{paymentLabels[order.paymentMethod] || order.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-gray-500 flex-shrink-0">Adresse</span>
              <span className="font-medium text-right">{order.deliveryAddress}</span>
            </div>
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
              <a
                href={`tel:${driver.phone}`}
                className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600"
                data-testid="button-call-driver"
              >
                <Phone size={18} />
              </a>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            const dateStr = new Date(order.createdAt!).toLocaleDateString("fr-CD", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
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
            window.open(`https://wa.me/243812345678?text=${msg}`, "_blank");
          }}
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
              className="w-full py-3 rounded-2xl border-2 border-red-200 text-red-600 font-semibold text-sm flex items-center justify-center gap-2"
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

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" data-testid="modal-cancel">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between gap-2 mb-6">
              <h3 className="font-bold text-lg">Annuler la commande</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                data-testid="button-close-cancel-modal"
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Pourquoi souhaitez-vous annuler ?</p>
            <div className="space-y-2 mb-4">
              {cancelReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setCancelReason(reason)}
                  data-testid={`cancel-reason-${reason}`}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    cancelReason === reason
                      ? "bg-red-50 text-red-700 border-2 border-red-300"
                      : "bg-gray-50 text-gray-700 border border-gray-200"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            {cancelReason === "Autre" && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Decrivez votre raison..."
                data-testid="input-custom-reason"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-4 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            )}
            <button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              data-testid="button-confirm-cancel"
              className="w-full py-3 rounded-2xl bg-red-600 text-white font-semibold text-sm disabled:opacity-50"
            >
              {cancelMutation.isPending ? "Annulation..." : "Confirmer l'annulation"}
            </button>
          </div>
        </div>
      )}

      {showRateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" data-testid="modal-rate">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between gap-2 mb-6">
              <h3 className="font-bold text-lg">Evaluer la commande</h3>
              <button
                onClick={() => setShowRateModal(false)}
                data-testid="button-close-rate-modal"
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4 text-center">Comment etait votre commande ?</p>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  data-testid={`star-${s}`}
                  className="p-1 transition-transform"
                >
                  <Star
                    size={36}
                    className={s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Un commentaire ? (optionnel)"
              data-testid="input-feedback"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-4 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <button
              onClick={handleRate}
              disabled={rateMutation.isPending}
              data-testid="button-submit-rating"
              className="w-full py-3 rounded-2xl bg-red-600 text-white font-semibold text-sm disabled:opacity-50"
            >
              {rateMutation.isPending ? "Envoi..." : "Envoyer mon avis"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
