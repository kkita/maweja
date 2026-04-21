import { useState, useEffect } from "react";
import { Timer } from "lucide-react";
import { dt } from "../DriverUI";

interface CountdownProps {
  estimatedDelivery: string | null;
}

export default function Countdown({ estimatedDelivery }: CountdownProps) {
  const [remaining, setRemaining] = useState("");
  const [isLate, setIsLate] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!estimatedDelivery) { setRemaining("--:--"); return; }
    const update = () => {
      const diff = new Date(estimatedDelivery).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining(`-${Math.abs(Math.floor(diff / 60000))}min`);
        setIsLate(true); setIsUrgent(true);
      } else {
        const min = Math.floor(diff / 60000);
        const sec = Math.floor((diff % 60000) / 1000);
        setRemaining(`${min}:${sec.toString().padStart(2, "0")}`);
        setIsLate(false); setIsUrgent(min < 5);
      }
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [estimatedDelivery]);

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black"
      style={{
        background: isLate ? "rgba(239,68,68,0.2)" : isUrgent ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.15)",
        color: isLate ? dt.red : isUrgent ? dt.amber : dt.green,
        animation: isLate ? "pulse 1s ease-in-out infinite" : "none",
      }}
    >
      <Timer size={12} />
      <span className="font-mono" data-testid="driver-countdown">{remaining}</span>
      <span className="text-[9px] opacity-80">{isLate ? "RETARD" : isUrgent ? "URGENT" : "restant"}</span>
    </div>
  );
}
