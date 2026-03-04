import { useLocation } from "wouter";
import { Check, Home, MapPin, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function OrderSuccessPage() {
  const [, setLocation] = useLocation();

  const orderNumber = `FD-${Math.floor(10000 + Math.random() * 90000)}`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Check className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2" data-testid="text-success-title">Commande confirmee</h1>
          <p className="text-muted-foreground">Votre commande a ete passee avec succes</p>
        </div>

        <Card className="p-5 text-left border-card-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Numero de commande</p>
              <p className="font-semibold text-sm" data-testid="text-order-number">{orderNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Temps estime</p>
              <p className="font-semibold text-sm">30-45 minutes</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Support</p>
              <p className="font-semibold text-sm">WhatsApp: +243 0911742202</p>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <Button className="w-full" onClick={() => setLocation("/tracking")} data-testid="button-track-order">
            Suivre ma commande
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setLocation("/")} data-testid="button-back-home">
            <Home className="w-4 h-4 mr-2" />
            Retour a l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
