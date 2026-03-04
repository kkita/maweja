import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CreditCard, Banknote, Smartphone, MapPin, Check, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/lib/cart-store";
import { SERVICE_FEE } from "@/lib/demo-data";

const paymentMethods = [
  { id: "mobile_money", name: "Mobile Money", description: "Airtel Money, M-PSA, Orange Money, AfriMoney, Illico Cash", icon: Smartphone, color: "text-amber-500" },
  { id: "cash", name: "Cash", description: "Payer a la livraison", icon: Banknote, color: "text-emerald-500" },
  { id: "card", name: "Carte de Credit", description: "Visa, Mastercard", icon: CreditCard, color: "text-blue-500" },
];

export default function CheckoutPage() {
  const cart = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPayment, setSelectedPayment] = useState("mobile_money");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("123 Avenue de la Paix");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cart.getSubtotal();
  const deliveryFee = subtotal > 0 ? 2.00 : 0;
  const serviceFee = subtotal > 0 ? SERVICE_FEE : 0;
  const total = subtotal + deliveryFee + serviceFee;

  useEffect(() => {
    if (cart.items.length === 0) {
      setLocation("/cart");
    }
  }, [cart.items.length, setLocation]);

  if (cart.items.length === 0) {
    return null;
  }

  async function handlePlaceOrder() {
    if (!phone) {
      toast({ title: "Numero requis", description: "Veuillez entrer votre numero de telephone", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    cart.clearCart();
    setLocation("/order-success");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => setLocation("/cart")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold">Finaliser la commande</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-36">
        <Card className="p-4 border-card-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Adresse de livraison</h3>
              <p className="text-xs text-muted-foreground">Ou souhaitez-vous etre livre ?</p>
            </div>
          </div>
          <Input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Votre adresse"
            data-testid="input-address"
          />
        </Card>

        <Card className="p-4 border-card-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Numero de telephone</h3>
              <p className="text-xs text-muted-foreground">Pour vous contacter lors de la livraison</p>
            </div>
          </div>
          <Input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+243 XXX XXX XXX"
            type="tel"
            data-testid="input-phone"
          />
        </Card>

        <Card className="p-4 border-card-border">
          <h3 className="font-semibold text-sm mb-3">Mode de paiement</h3>
          <div className="space-y-2">
            {paymentMethods.map(method => {
              const Icon = method.icon;
              const isSelected = selectedPayment === method.id;
              return (
                <Button
                  key={method.id}
                  variant="ghost"
                  onClick={() => setSelectedPayment(method.id)}
                  className={`w-full flex items-center justify-start gap-3 rounded-md border no-default-hover-elevate no-default-active-elevate ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  data-testid={`button-payment-${method.id}`}
                >
                  <div className={`w-9 h-9 rounded-full bg-accent flex items-center justify-center ${method.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{method.name}</p>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </Card>

        <Card className="p-4 border-card-border">
          <Label htmlFor="note" className="text-sm font-semibold">Note pour le livreur (optionnel)</Label>
          <Input
            id="note"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ex: Sonner a la porte, batiment B..."
            className="mt-2"
            data-testid="input-note"
          />
        </Card>

        <Card className="p-4 border-card-border">
          <h3 className="font-semibold text-sm mb-3">Resume</h3>
          <div className="space-y-1.5 text-sm">
            {cart.items.map(item => (
              <div key={item.menuItem.id} className="flex justify-between gap-2">
                <span className="text-muted-foreground truncate">
                  {item.quantity}x {item.menuItem.name}
                </span>
                <span className="font-medium flex-shrink-0">${(item.menuItem.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Sous-total</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Frais de livraison</span>
              <span className="font-medium">${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Frais de service</span>
              <span className="font-medium">${serviceFee.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between gap-2 text-base">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-primary" data-testid="text-checkout-total">${total.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border p-4 z-50">
        <div className="max-w-3xl mx-auto space-y-2">
          <Button
            size="lg"
            className="w-full text-base"
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            data-testid="button-place-order"
          >
            {isSubmitting ? "Traitement en cours..." : `Confirmer et payer - $${total.toFixed(2)}`}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            En confirmant, vous acceptez nos conditions d'utilisation
          </p>
        </div>
      </div>
    </div>
  );
}
