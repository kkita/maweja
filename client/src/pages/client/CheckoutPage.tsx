import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "../../lib/cart";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient } from "../../lib/queryClient";
import ClientNav from "../../components/ClientNav";
import { MapPin, CreditCard, Smartphone, Banknote, Wallet, Award, Check, Lock, User, Mail, Phone, Eye, EyeOff, ArrowRight, LogIn } from "lucide-react";
import { formatPrice } from "../../lib/utils";

const paymentMethods = [
  { id: "mobile_money", name: "Mobile Money", desc: "Airtel Money, M-PESA, Orange Money", icon: Smartphone, color: "bg-orange-50 border-orange-200 text-orange-700" },
  { id: "cash", name: "Cash", desc: "Paiement a la livraison", icon: Banknote, color: "bg-green-50 border-green-200 text-green-700" },
  { id: "illico_cash", name: "Illico Cash", desc: "Paiement via Illico Cash", icon: CreditCard, color: "bg-blue-50 border-blue-200 text-blue-700" },
  { id: "wallet", name: "Wallet MAWEJA", desc: "Payez avec votre solde", icon: Wallet, color: "bg-red-50 border-red-200 text-red-700" },
  { id: "loyalty", name: "Points de fidelite", desc: "Utilisez vos points", icon: Award, color: "bg-purple-50 border-purple-200 text-purple-700" },
  { id: "card", name: "Carte Bancaire", desc: "Visa, Mastercard", icon: CreditCard, color: "bg-gray-50 border-gray-300 text-gray-700" },
];

function AuthGate({ onSuccess }: { onSuccess: () => void }) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressField, setAddressField] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password, "client");
      } else {
        if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caracteres"); setLoading(false); return; }
        await register({ email, password, name, phone, role: "client", address: addressField });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
          <Lock size={18} className="text-red-600" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-gray-900">Connexion requise</h3>
          <p className="text-xs text-gray-500">Connectez-vous ou inscrivez-vous pour finaliser votre commande</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 bg-gray-100 rounded-xl p-1">
        <button onClick={() => { setIsLogin(true); setError(""); }} data-testid="checkout-tab-login"
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${isLogin ? "bg-red-600 text-white shadow" : "text-gray-500"}`}>
          Connexion
        </button>
        <button onClick={() => { setIsLogin(false); setError(""); }} data-testid="checkout-tab-register"
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${!isLogin ? "bg-red-600 text-white shadow" : "text-gray-500"}`}>
          Inscription
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {!isLogin && (
          <>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Nom complet" value={name} onChange={e => setName(e.target.value)}
                data-testid="checkout-input-name" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" required />
            </div>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="tel" placeholder="Telephone (ex: 0812345678)" value={phone} onChange={e => setPhone(e.target.value)}
                data-testid="checkout-input-phone" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" required />
            </div>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Adresse (quartier, commune)" value={addressField} onChange={e => setAddressField(e.target.value)}
                data-testid="checkout-input-addr" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
          </>
        )}
        <div className="relative">
          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="email" placeholder="Adresse email" value={email} onChange={e => setEmail(e.target.value)}
            data-testid="checkout-input-email" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" required />
        </div>
        <div className="relative">
          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type={showPassword ? "text" : "password"} placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)}
            data-testid="checkout-input-password" className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" required />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <p className="text-red-600 text-xs font-medium" data-testid="checkout-error">{error}</p>
          </div>
        )}

        <button type="submit" disabled={loading} data-testid="checkout-auth-submit"
          className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-200 flex items-center justify-center gap-2">
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {isLogin ? "Se connecter" : "Creer mon compte"}
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

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

  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <ClientNav />
      <div className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Finaliser la commande</h2>

        {!isAuthenticated && (
          <AuthGate onSuccess={() => {}} />
        )}

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
          {isAuthenticated ? (
            <button
              onClick={handleOrder}
              disabled={loading}
              data-testid="button-place-order"
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-red-200 hover:bg-red-700 transition-all disabled:opacity-50"
            >
              {loading ? "Traitement en cours..." : `Confirmer et payer ${formatPrice(grandTotal)}`}
            </button>
          ) : (
            <div className="text-center py-3">
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                <LogIn size={16} />
                <span className="font-medium">Connectez-vous ci-dessus pour commander</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
