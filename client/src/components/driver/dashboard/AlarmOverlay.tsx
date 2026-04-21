import { useEffect } from "react";
import { Bell } from "lucide-react";

interface AlarmOverlayProps {
  reason: string;
  onDismiss: () => void;
}

export default function AlarmOverlay({ reason, onDismiss }: AlarmOverlayProps) {
  useEffect(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sawtooth";
      gain.gain.value = 0.3;
      osc.start();
      setTimeout(() => { try { osc.stop(); ctx.close(); } catch {} }, 3000);
    } catch {}
    if ("vibrate" in navigator) navigator.vibrate([500, 200, 500, 200, 500]);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: "rgba(239,68,68,0.95)" }}>
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-bounce">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell size={36} className="text-red-600" />
        </div>
        <h2 className="text-xl font-black text-red-600 mb-2">ALERTE URGENTE</h2>
        <p className="text-gray-700 text-sm mb-6 leading-relaxed">{reason}</p>
        <button
          onClick={onDismiss}
          data-testid="dismiss-alarm"
          className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-sm"
        >
          J'ai compris
        </button>
      </div>
    </div>
  );
}
