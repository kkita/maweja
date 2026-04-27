import { useState, useEffect, useRef } from "react";

export default function AnimatedBalance({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current;
    const diff = value - start;
    const duration = 600;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * ease);
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = value;
    };
    requestAnimationFrame(tick);
  }, [value]);

  const formatted = display.toFixed(2);
  const [dollars, cents] = formatted.split(".");
  return (
    <span data-testid="text-wallet-balance">
      <span className="text-[44px] font-black leading-none tracking-tight">{dollars}</span>
      <span className="text-[22px] font-black opacity-70">.{cents} $</span>
    </span>
  );
}
