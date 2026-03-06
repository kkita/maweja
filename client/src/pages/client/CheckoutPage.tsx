import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "../../lib/cart";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient } from "../../lib/queryClient";
import ClientNav from "../../components/ClientNav";
import { ArrowLeft, MapPin, CreditCard, Smartphone, Banknote, Wallet, Award, Check } from "lucide-react";
import { formatPrice } from "../../lib/utils";

const paymentMethods = [
  { id: "mobile_money", name: "Mobile Money", desc: "Airtel Money, M-PESA, Orange Money", icon: Smartphone, color: "bg-orange-50 border-orange-200 text-orange-700" },
  { id: "cash", name: "Cash", desc: "Paiement a la livraison", icon: Banknote, color: "bg-green-50 border-green-200 text-green-700" },
  { id: "illico_cash", name: "Illico Cash", desc: "Paiement via Illico Cash", icon: CreditCard, color: "bg-blue-50 border-blue-200 text-blue-700" },
  { id: "wallet", name: "Wallet MAWEJA", desc: "Payez avec votre solde", icon: Wallet, color: "bg-red-50 border-red-200 text-red-700" },
  { id: "loyalty", name: "Points de fidelite", desc: "Utilisez vos points", icon: Award, color: "bg-purple-50 border-purple-200 text-purple-700" },
  { id: "card", name: "Carte Bancaire", desc: "Visa, Mastercard", icon: CreditCard, color: "bg-gray-50 border-gray-300 text-gray-700" },
];

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [address, setAddress] = useState("Avenue Kasavubu, Kinshasa");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mobile_money");
  const [loading, setLoading] = useState(false);

  const deliveryFee = 2500;
  const grandTotal = total + deliveryFee;

  const handleOrder = async () => {
    if (!user || items.length === 0) return;
    setLoading(true);
    try {
      const res = await apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          clientId: user.id,
          restaurantId: items[0].restaurantId,
          items: JSON.stringify(items.map((i) => ({ name: i.name, qty: i.quantity, price: i.price }))),
          subtotal: total,
          deliveryFee,
          total: grandTotal,
          paymentMethod,
          paymentStatus: paymentMethod === "cash" ? "pending" : "paid",
          deliveryAddress: address,
          notes,
          status: "pending",
        }),
      });
      const order = await res.json();
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Commande passee!", description: `Commande ${order.orderNumber} confirmee` });
      navigate(`/tracking/${order.id}`);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Finaliser la commande</h2>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <MapPin size={18} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900">Adresse de livraison</h3>
              <p className="text-xs text-gray-500">Ou souhaitez-vous etre livre ?</p>
            </div>
          </div>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            data-testid="input-address"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Mode de paiement</h3>
          <div className="space-y-2">
            {paymentMethods.map((m) => (
              <button
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                data-testid={`payment-${m.id}`}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  paymentMethod === m.id ? "border-red-500 bg-red-50" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.color.split(" ")[0]}`}>
                  <m.icon size={18} className={m.color.split(" ")[2]} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.desc}</p>
                </div>
                {paymentMethod === m.id && (
                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Notes pour le livreur</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instructions speciales, etage, code portail..."
            data-testid="input-notes"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Resume de la commande</h3>
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm py-1">
              <span className="text-gray-600">{item.quantity}x {item.name}</span>
              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Sous-total</span><span>{formatPrice(total)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Livraison</span><span>{formatPrice(deliveryFee)}</span></div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100"><span>Total</span><span className="text-red-600">{formatPrice(grandTotal)}</span></div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-gray-100">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleOrder}
            disabled={loading}
            data-testid="button-place-order"
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-red-200 hover:bg-red-700 transition-all disabled:opacity-50"
          >
            {loading ? "Traitement en cours..." : `Confirmer et payer ${formatPrice(grandTotal)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
