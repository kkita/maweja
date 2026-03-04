import { useState } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, Bell, ChevronRight, Star, Clock, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CategoryIcon } from "@/components/category-icon";
import { categories, promotions, restaurants, getFeaturedRestaurants, searchRestaurants } from "@/lib/demo-data";
import type { Restaurant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart-store";

function PromoBanner() {
  const [current, setCurrent] = useState(0);
  const promo = promotions[current];

  return (
    <div className="relative">
      <div
        className={`bg-gradient-to-r ${promo.bgColor} rounded-2xl p-6 md:p-8 relative overflow-hidden cursor-pointer`}
        onClick={() => setCurrent((current + 1) % promotions.length)}
        data-testid="promo-banner"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-1/2 w-24 h-24 bg-white/5 rounded-full translate-y-8" />
        <div className="relative z-10">
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30 mb-3" data-testid="badge-promo-discount">
            {promo.discount}
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1" data-testid="text-promo-title">{promo.title}</h2>
          <p className="text-white/80 text-sm md:text-base" data-testid="text-promo-subtitle">{promo.subtitle}</p>
          <Button variant="secondary" size="sm" className="mt-4 bg-white text-foreground" data-testid="button-promo-order">
            Commander maintenant
          </Button>
        </div>
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {promotions.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-white w-5" : "bg-white/40"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryRow() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map(cat => (
        <Button
          key={cat.id}
          variant="ghost"
          onClick={() => setLocation(`/?category=${cat.name}`)}
          className="flex flex-col items-center gap-2 min-w-[72px] no-default-hover-elevate no-default-active-elevate"
          data-testid={`button-category-${cat.id}`}
        >
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center">
            <CategoryIcon icon={cat.icon} className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{cat.name}</span>
        </Button>
      ))}
    </div>
  );
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const [, setLocation] = useLocation();
  const initials = restaurant.name.split(" ").map(w => w[0]).join("").slice(0, 2);

  return (
    <Card
      className="hover-elevate cursor-pointer group border-card-border"
      onClick={() => setLocation(`/restaurant/${restaurant.id}`)}
      data-testid={`card-restaurant-${restaurant.id}`}
    >
      <div className="relative h-40 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-md flex items-center justify-center">
        <span className="text-4xl font-bold text-primary/30">{initials}</span>
        {restaurant.promo && (
          <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground" data-testid={`badge-discount-${restaurant.id}`}>
            {restaurant.promo}
          </Badge>
        )}
        {restaurant.featured && (
          <Badge variant="secondary" className="absolute top-3 right-3" data-testid={`badge-featured-${restaurant.id}`}>
            Populaire
          </Badge>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-base mb-1" data-testid={`text-restaurant-name-${restaurant.id}`}>{restaurant.name}</h3>
        <p className="text-sm text-muted-foreground mb-3">{restaurant.cuisine}</p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium" data-testid={`text-rating-${restaurant.id}`}>{restaurant.rating}</span>
            <span className="text-xs text-muted-foreground">({restaurant.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">{restaurant.deliveryTime}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Truck className="w-3.5 h-3.5" />
            <span className="text-xs">{restaurant.deliveryFee === 0 ? "Gratuit" : `$${restaurant.deliveryFee.toFixed(2)}`}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const cart = useCart();
  const [, setLocation] = useLocation();

  const featured = getFeaturedRestaurants();
  const filteredRestaurants = searchQuery
    ? searchRestaurants(searchQuery)
    : restaurants;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Livrer a</p>
              <p className="text-sm font-semibold truncate" data-testid="text-delivery-address">123 Avenue de la Paix</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" data-testid="button-notifications">
              <Bell className="w-5 h-5" />
            </Button>
            <Button
              size="sm"
              className="relative"
              onClick={() => setLocation("/cart")}
              data-testid="button-cart-header"
            >
              Panier
              {cart.getTotalItems() > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center" data-testid="text-cart-count">
                  {cart.getTotalItems()}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1" data-testid="text-home-title">
            Que souhaitez-vous manger ?
          </h1>
          <p className="text-muted-foreground text-sm mb-4">Decouvrez les meilleurs restaurants pres de chez vous</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un restaurant ou un plat..."
              className="pl-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
        </div>

        {!searchQuery && <PromoBanner />}

        {!searchQuery && (
          <section>
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold">Categories</h2>
              <Button variant="ghost" size="sm" className="text-primary text-xs" data-testid="button-see-all-categories">
                Voir tout <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
            <CategoryRow />
          </section>
        )}

        {!searchQuery && (
          <section>
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold">Restaurants populaires</h2>
              <Button variant="ghost" size="sm" className="text-primary text-xs" data-testid="button-see-all-featured">
                Voir tout <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {featured.map(r => (
                <div key={r.id} className="min-w-[260px] max-w-[280px] flex-shrink-0">
                  <RestaurantCard restaurant={r} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-4">
            {searchQuery ? `Resultats pour "${searchQuery}"` : "Tous les restaurants"}
          </h2>
          {filteredRestaurants.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground" data-testid="text-no-results">Aucun restaurant trouve</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRestaurants.map(r => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">FoodDash - Livraison de repas rapide et fiable</p>
        </div>
      </footer>
    </div>
  );
}
