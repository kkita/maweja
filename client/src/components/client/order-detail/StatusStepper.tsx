import { Clock, CheckCircle, Truck, MapPin } from "lucide-react";

const STATUS_TO_STEP: Record<string, string> = {
  pending:   "pending",
  confirmed: "confirmed",
  preparing: "picked_up",
  ready:     "picked_up",
  picked_up: "picked_up",
  delivered: "delivered",
};

const STEPS = [
  { key: "pending",   icon: Clock,        label: "En attente" },
  { key: "confirmed", icon: CheckCircle,  label: "Confirmée" },
  { key: "picked_up", icon: Truck,        label: "En Cours de Livraison" },
  { key: "delivered", icon: MapPin,       label: "Livrée" },
];

export function StatusStepper({ status }: { status: string }) {
  const mappedStep = STATUS_TO_STEP[status] || status;
  const currentIdx = STEPS.findIndex(s => s.key === mappedStep);

  return (
    <div className="relative flex justify-between items-start w-full">
      <div className="absolute h-0.5 rounded-full bg-gray-200 dark:bg-gray-700" style={{ left: 16, right: 16, top: 16, zIndex: 0 }} />
      <div
        className="absolute h-0.5 rounded-full transition-all duration-700"
        style={{
          left: 16,
          top: 16,
          background: "linear-gradient(to right, #EC0000, #ff5555)",
          width: currentIdx === 0 ? 0 : `calc(${(currentIdx / (STEPS.length - 1)) * 100}% - 32px)`,
          zIndex: 0,
        }}
      />
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIdx;
        const isCurrent   = i === currentIdx;
        const isFuture    = i > currentIdx;
        const StepIcon    = step.icon;
        return (
          <div key={step.key} className="flex flex-col items-center" style={{ zIndex: 1, width: `${100 / STEPS.length}%` }} data-testid={`step-${step.key}`}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 flex-shrink-0"
              style={{
                background: isCurrent ? "#EC0000" : isCompleted ? "#DCFCE7" : "#F3F4F6",
                border: isFuture ? "1.5px dashed #D1D5DB" : "none",
                boxShadow: isCurrent ? "0 0 0 3px rgba(236,0,0,0.15)" : "none",
              }}
            >
              <StepIcon size={14} style={{ color: isCurrent ? "#fff" : isCompleted ? "#16A34A" : "#C4C4C4" }} />
            </div>
            <p
              className="text-center leading-tight mt-1.5 w-full"
              style={{
                fontSize: 9,
                fontWeight: isCurrent ? 700 : 500,
                color: isCurrent ? "#EC0000" : isCompleted ? "#16A34A" : "#9CA3AF",
                wordBreak: "break-word",
                hyphens: "auto",
              }}
            >
              {step.label}
            </p>
            {isCurrent && (
              <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: "#EC0000", animation: "pulse 1s ease-in-out infinite" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
