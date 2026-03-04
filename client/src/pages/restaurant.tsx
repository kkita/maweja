import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Star, Clock, Truck, MapPin, Plus, Minus, ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getRestaurantById, getMenuByRestaurant, getMenuCategories, getPopularItems } from "@/lib/demo-data";
import type { MenuItem } from "@/lib/demo-data";
import { useCart } from "@/lib/cart-store";

function MenuItemCard({ item, restaurantName }: { item: MenuItem; restaurantName: string }) {
  const cart = useCart();
  const { toast } = useToast();
  const [justAdded, setJustAdded] = useState(false);
  const cartItem = cart.items.find(c => c.menuItem.id === item.id);
  const initials = item.name.split(" ").map(w => w[0]).join("").slice(0, 2);

  function handleAdd() {
    cart.addItem(item, restaurantName);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
    toast({
      title: "Ajoute au panier",
      description: `${item.name} - $${item.price.toFixed(2)}`,
    });
  }

  return (
    <Card className="flex gap-3 p-3 border-card-border" data-testid={`card-menu-item-${item.id}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <h3 className="font-semibold text-sm leading-tight" data-testid={`text-item-name-${item.id}`}>{item.name}</h3>
          {item.popular && <Badge variant="secondary" className="text-[10px] flex-shrink-0">Top</Badge>}
        </div>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-bold text-primary text-sm" data-testid={`text-item-price-${item.id}`}>${item.price.toFixed(2)}</span>
          {cartItem ? (
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => cart.updateQuantity(item.id, cartItem.quantity - 1)}
                data-testid={`button-decrease-${item.id}`}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-sm font-medium w-5 text-center" data-testid={`text-quantity-${item.id}`}>{cartItem.quantity}</span>
              <Button
                size="icon"
                variant="outline"
                onClick={() => cart.updateQuantity(item.id, cartItem.quantity + 1)}
                data-testid={`button-increase-${item.id}`}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={handleAdd} data-testid={`button-add-item-${item.id}`}>
              {justAdded ? <Check className="w-3.5 h-3.5 mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
              {justAdded ? "Ajoute" : "Ajouter"}
            </Button>
          )}
        </div>
      </div>
      <div className="w-20 h-20 rounded-md bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0">
        <span className="text-lg font-bold text-primary/30">{initials}</span>
      </div>
    </Card>
  );
}

export default function RestaurantPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const cart = useCart();
  const restaurantId = Number(params.id);
  const restaurant = getRestaurantById(restaurantId);
  const menuItems = getMenuByRestaurant(restaurantId);
  const menuCategories = getMenuCategories(restaurantId);
  const popularItems = getPopularItems(restaurantId);
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return menuItems;
    if (activeCategory === "popular") return popularItems;
    return menuItems.filter(item => item.category === activeCategory);
  }, [activeCategory, menuItems, popularItems]);

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Restaurant non trouve</p>
          <Button onClick={() => setLocation("/")} data-testid="button-back-home">Retour a l'accueil</Button>
        </div>
      </div>
    );
  }

  const initials = restaurant.name.split(" ").map(w => w[0]).join("").slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-48 md:h-56 bg-gradient-to-br from-primary/20 via-primary/10 to-accent flex items-center justify-center">
        <span className="text-7xl font-bold text-primary/15">{initials}</span>
        {restaurant.promo && (
          <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground text-sm" data-testid="badge-restaurant-promo">
            {restaurant.promo}
          </Badge>
        )}
        <div className="absolute top-4 left-4 flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6 relative z-10">
        <Card className="p-5 mb-6 border-card-border">
          <h1 className="text-xl md:text-2xl font-bold mb-1" data-testid="text-restaurant-title">{restaurant.name}</h1>
          <p className="text-sm text-muted-foreground mb-3">{restaurant.description}</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-sm" data-testid="text-restaurant-rating">{restaurant.rating}</span>
              <span className="text-xs text-muted-foreground">({restaurant.reviewCount} avis)</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{restaurant.deliveryTime}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Truck className="w-4 h-4" />
              <span className="text-sm">
                {restaurant.deliveryFee === 0 ? "Livraison gratuite" : `$${restaurant.deliveryFee.toFixed(2)} livraison`}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{restaurant.address}</span>
            </div>
          </div>
        </Card>

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-4">
          <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            <TabsTrigger value="all" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4" data-testid="tab-all">
              Tout
            </TabsTrigger>
            <TabsTrigger value="popular" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4" data-testid="tab-popular">
              Populaire
            </TabsTrigger>
            {menuCategories.map(cat => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4"
                data-testid={`tab-${cat}`}
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="space-y-3 pb-28">
          {filteredItems.map(item => (
            <MenuItemCard key={item.id} item={item} restaurantName={restaurant.name} />
          ))}
          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Aucun plat dans cette categorie
            </div>
          )}
        </div>
      </div>

      {cart.getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border p-4 z-50">
          <div className="max-w-3xl mx-auto">
            <Button
              size="lg"
              className="w-full text-base"
              onClick={() => setLocation("/cart")}
              data-testid="button-view-cart"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Voir le panier ({cart.getTotalItems()}) - ${cart.getSubtotal().toFixed(2)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
