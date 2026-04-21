import { useTheme, type ThemeMode } from "../../../lib/theme";
import { Sun, Moon, MonitorSmartphone } from "lucide-react";

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const options: { value: ThemeMode; icon: any; label: string }[] = [
    { value: "auto",  icon: MonitorSmartphone, label: "Automatique" },
    { value: "light", icon: Sun,               label: "Clair"       },
    { value: "dark",  icon: Moon,              label: "Sombre"      },
  ];
  return (
    <div className="flex gap-2">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          data-testid={`button-theme-${value}`}
          className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all text-xs font-semibold ${
            theme === value
              ? "bg-red-50 dark:bg-red-950 border-red-500 text-red-600"
              : "bg-gray-50 dark:bg-gray-800 border-transparent text-gray-600 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600"
          }`}
        >
          <Icon size={18} />
          {label}
        </button>
      ))}
    </div>
  );
}
