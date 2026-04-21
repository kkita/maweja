import { useTheme, type ThemeMode } from "../../../lib/theme";
import { Sun, Moon, MonitorSmartphone, X } from "lucide-react";

export function BottomSheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg max-h-[90vh] rounded-t-3xl overflow-hidden flex flex-col bg-driver-surface border border-driver-border2"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-driver-s3" />
        </div>
        <div className="overflow-y-auto flex-1 pb-10">{children}</div>
      </div>
    </div>
  );
}

export function SheetHeader({ icon: Icon, title, onClose }: { icon: any; title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-driver-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-driver-accent/12">
          <Icon size={18} className="text-driver-accent" />
        </div>
        <h3 className="font-black text-base text-white">{title}</h3>
      </div>
      <button
        onClick={onClose}
        className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 bg-driver-s2 text-driver-subtle"
      >
        <X size={17} />
      </button>
    </div>
  );
}

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const options: { value: ThemeMode; icon: any; label: string }[] = [
    { value: "auto",  icon: MonitorSmartphone, label: "Auto"   },
    { value: "light", icon: Sun,               label: "Clair"  },
    { value: "dark",  icon: Moon,              label: "Sombre" },
  ];
  return (
    <div className="flex gap-2">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          data-testid={`button-theme-${value}`}
          className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all text-xs font-bold border-2 ${
            theme === value
              ? "bg-driver-accent text-white border-driver-accent shadow-[0_4px_12px_rgba(225,0,0,0.3)]"
              : "bg-driver-s3 text-driver-subtle border-transparent"
          }`}
        >
          <Icon size={18} />
          {label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ value, onChange, testId }: { value: boolean; onChange: (v: boolean) => void; testId?: string }) {
  return (
    <button
      onClick={() => onChange(!value)}
      data-testid={testId}
      className={`w-12 h-6 rounded-full relative transition-all flex-shrink-0 ${value ? "bg-driver-accent" : "bg-driver-s3"}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all ${value ? "left-7" : "left-1"}`} />
    </button>
  );
}
