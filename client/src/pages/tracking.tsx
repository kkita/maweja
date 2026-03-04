import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Check, ChefHat, Truck, Package, Home, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const steps = [
  { id: 1, label: "Commande recue", description: "Votre commande a ete recue par le restaurant", icon: Check },
  { id: 2, label: "En preparation", description: "Le chef prepare votre repas avec soin", icon: ChefHat },
  { id: 3, label: "En route", description: "Un livreur est en chemin vers vous", icon: Truck },
  { id: 4, label: "Livree", description: "Votre commande a ete livree. Bon appetit !", icon: Package },
];

export default function TrackingPage() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= 3) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => setLocation("/")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold">Suivi de commande</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="h-48 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent flex items-center justify-center">
          <div className="text-center">
            <Truck className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Carte de suivi en temps reel</p>
            <p className="text-xs text-muted-foreground">(Simulation pour la demo)</p>
          </div>
        </div>

        <Card className="p-5 border-card-border">
          <h2 className="font-semibold mb-1" data-testid="text-tracking-status">
            {steps[currentStep - 1].label}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">{steps[currentStep - 1].description}</p>

          <div className="space-y-0">
            {steps.map((step, index) => {
              const isCompleted = step.id < currentStep;
              const isActive = step.id === currentStep;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex gap-3" data-testid={`tracking-step-${step.id}`}>
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      isCompleted || isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-muted-foreground"
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-0.5 h-10 transition-colors ${
                        isCompleted ? "bg-primary" : "bg-border"
                      }`} />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={`text-sm font-medium ${isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4 border-card-border">
          <h3 className="font-semibold text-sm mb-3">Besoin d'aide ?</h3>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" data-testid="button-call-driver">
              <Phone className="w-4 h-4 mr-2" />
              Appeler le livreur
            </Button>
            <Button variant="outline" className="flex-1" data-testid="button-whatsapp-support">
              <MessageCircle className="w-4 h-4 mr-2" />
              Support WhatsApp
            </Button>
          </div>
        </Card>

        <Button variant="outline" className="w-full" onClick={() => setLocation("/")} data-testid="button-back-home">
          <Home className="w-4 h-4 mr-2" />
          Retour a l'accueil
        </Button>
      </div>
    </div>
  );
}
