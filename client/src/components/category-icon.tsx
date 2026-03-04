import { UtensilsCrossed, Pizza, Fish, Drumstick, Globe, IceCreamCone, GlassWater, Flame } from "lucide-react";

const iconMap: Record<string, typeof UtensilsCrossed> = {
  burger: UtensilsCrossed,
  pizza: Pizza,
  sushi: Fish,
  chicken: Drumstick,
  african: Globe,
  dessert: IceCreamCone,
  drinks: GlassWater,
  grill: Flame,
};

export function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = iconMap[icon] || UtensilsCrossed;
  return <Icon className={className} />;
}
