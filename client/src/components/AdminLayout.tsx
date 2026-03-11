import { type ReactNode, useState, useRef, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import { useI18n } from "../lib/i18n";
import { useTheme, type ThemeMode } from "../lib/theme";
import { Globe, Sun, Moon, MonitorSmartphone } from "lucide-react";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const options: { value: ThemeMode; icon: any; title: string }[] = [
    { value: "auto", icon: MonitorSmartphone, title: "Auto" },
    { value: "light", icon: Sun, title: "Clair" },
    { value: "dark", icon: Moon, title: "Sombre" },
  ];
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
      {options.map(({ value, icon: Icon, title }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={title}
          data-testid={`admin-theme-${value}`}
          className={`p-2 rounded-lg transition-all ${theme === value ? "bg-white dark:bg-gray-700 shadow text-red-600" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}

export default function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const { lang, setLang, t } = useI18n();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowLangMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <AdminSidebar />
      <main className="flex-1 ml-64">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-8 py-5 sticky top-0 z-30 flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">{title}</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                data-testid="button-admin-lang"
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
              >
                <span className="text-lg">{lang === "fr" ? "🇫🇷" : "🇬🇧"}</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{lang === "fr" ? "FR" : "EN"}</span>
              </button>
              {showLangMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50 min-w-[160px]">
                  <button
                    onClick={() => { setLang("fr"); setShowLangMenu(false); }}
                    data-testid="button-admin-lang-fr"
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${lang === "fr" ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 font-bold" : "text-gray-700 dark:text-gray-300"}`}
                  >
                    <span>🇫🇷</span> {t.common.french}
                  </button>
                  <button
                    onClick={() => { setLang("en"); setShowLangMenu(false); }}
                    data-testid="button-admin-lang-en"
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${lang === "en" ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 font-bold" : "text-gray-700 dark:text-gray-300"}`}
                  >
                    <span>🇬🇧</span> {t.common.english}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
        <footer className="p-8 text-center text-xs text-gray-400 dark:text-gray-500">
          Made By Khevin Andrew Kita - Ed Corporation
        </footer>
      </main>
    </div>
  );
}
