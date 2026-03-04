import { useLocation } from "wouter";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart-store";
import { SERVICE_FEE } from "@/lib/demo-data";

export default function CartPage() {
  const cart = useCart();
  const [, setLocation] = useLocation();

  const subtotal = cart.getSubtotal();
  const deliveryFee = subtotal > 0 ? 2.00 : 0;
  const serviceFee = subtotal > 0 ? SERVICE_FEE : 0;
  const total = subtotal + deliveryFee + serviceFee;

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={() => setLocation("/")} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">Mon Panier</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-24 px-4">
          <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mb-4">
            <ShoppingBag className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h2 className="text-lg font-semibold mb-1" data-testid="text-empty-cart">Votre panier est vide</h2>
          <p className="text-sm text-muted-foreground mb-6 text-center">Ajoutez des plats delicieux depuis nos restaurants</p>
          <Button onClick={() => setLocation("/")} data-testid="button-browse-restaurants">
            Parcourir les restaurants
          </Button>
        </div>
      </div>
    );
  }

  const groupedByRestaurant = cart.items.reduce((groups, item) => {
    const name = item.restaurantName;
    if (!groups[name]) groups[name] = [];
    groups[name].push(item);
    return groups;
  }, {} as Record<string, typeof cart.items>);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={() => setLocation("/")} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">Mon Panier</h1>
          </div>
          <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => cart.clearCart()} data-testid="button-clear-cart">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Vider
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-52">
        {Object.entries(groupedByRestaurant).map(([restaurantName, items]) => (
          <div key={restaurantName}>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">{restaurantName}</h2>
            <Card className="divide-y divide-border border-card-border">
              {items.map(item => {
                const initials = item.menuItem.name.split(" ").map(w => w[0]).join("").slice(0, 2);
                return (
                  <div key={item.menuItem.id} className="flex gap-3 p-3" data-testid={`cart-item-${item.menuItem.id}`}>
                    <div className="w-16 h-16 rounded-md bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary/30">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate" data-testid={`text-cart-item-name-${item.menuItem.id}`}>{item.menuItem.name}</h3>
                      <p className="text-primary font-semibold text-sm mt-0.5" data-testid={`text-cart-item-price-${item.menuItem.id}`}>
                        ${(item.menuItem.price * item.quantity).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => cart.updateQuantity(item.menuItem.id, item.quantity - 1)}
                          data-testid={`button-cart-decrease-${item.menuItem.id}`}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-5 text-center" data-testid={`text-cart-quantity-${item.menuItem.id}`}>{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => cart.updateQuantity(item.menuItem.id, item.quantity + 1)}
                          data-testid={`button-cart-increase-${item.menuItem.id}`}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="ml-auto text-muted-foreground"
                          onClick={() => cart.removeItem(item.menuItem.id)}
                          data-testid={`button-cart-remove-${item.menuItem.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        ))}

        <Card className="p-4 border-card-border">
          <h3 className="font-semibold mb-3">Resume de la commande</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Sous-total</span>
              <span className="font-medium" data-testid="text-subtotal">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Frais de livraison</span>
              <span className="font-medium" data-testid="text-delivery-fee">${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Frais de service</span>
              <span className="font-medium" data-testid="text-service-fee">${serviceFee.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between gap-2 text-base">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-primary" data-testid="text-total">${total.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border p-4 z-50">
        <div className="max-w-3xl mx-auto">
          <Button
            size="lg"
            className="w-full text-base"
            onClick={() => setLocation("/checkout")}
            data-testid="button-checkout"
          >
            Commander - ${total.toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  );
}
