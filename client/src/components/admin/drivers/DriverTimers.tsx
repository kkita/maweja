import { useState, useEffect } from "react";
import { Timer, Clock } from "lucide-react";

export function CountdownTimer({ estimatedDelivery, compact }: { estimatedDelivery: string | null; compact?: boolean }) {
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

  if (compact) {
    return (
      <span className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-md ${isLate ? "bg-red-100 text-red-700 animate-pulse" : isUrgent ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`} data-testid="countdown-timer">
        <Timer size={8} className="inline mr-0.5" />{remaining}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${isLate ? "bg-red-50 border border-red-200" : isUrgent ? "bg-orange-50 border border-orange-200" : "bg-green-50 border border-green-200"}`}>
      <Timer size={12} className={isLate ? "text-red-600 animate-pulse" : isUrgent ? "text-orange-600" : "text-green-600"} />
      <span className={`font-mono font-bold text-xs ${isLate ? "text-red-700" : isUrgent ? "text-orange-700" : "text-green-700"}`}>{remaining}</span>
      <span className={`text-[9px] ${isLate ? "text-red-500" : isUrgent ? "text-orange-500" : "text-green-500"}`}>
        {isLate ? "RETARD" : isUrgent ? "URGENT" : "restant"}
      </span>
    </div>
  );
}

export function ElapsedTime({ createdAt }: { createdAt: string | Date | null }) {
  const [elapsed, setElapsed] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!createdAt) { setElapsed("--"); return; }
    const update = () => {
      const diff = Date.now() - new Date(createdAt).getTime();
      const min = Math.floor(diff / 60000);
      setElapsed(`${min} min`);
      setIsUrgent(min >= 45);
    };
    update();
    const i = setInterval(update, 30000);
    return () => clearInterval(i);
  }, [createdAt]);

  return (
    <span className={`text-[10px] font-semibold ${isUrgent ? "text-red-600" : "text-zinc-500 dark:text-zinc-400"}`} data-testid="elapsed-time">
      <Clock size={9} className="inline mr-0.5" />{elapsed}
      {isUrgent && <span className="ml-1 px-1 py-0.5 bg-red-600 text-white text-[8px] font-bold rounded">URGENT</span>}
    </span>
  );
}
