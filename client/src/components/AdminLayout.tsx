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
    <div className="flex items-center bg-gray-100 dark:bg-gray-800/60 rounded-lg p-0.5">
      {options.map(({ value, icon: Icon, title }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={title}
          data-testid={`admin-theme-${value}`}
          className={`p-1.5 rounded-md transition-all duration-200 ${theme === value ? "bg-white dark:bg-gray-700 shadow-sm text-red-600" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}

export default function AdminLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
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
    <div className="min-h-screen bg-[#f8f8fa] dark:bg-[#0a0a0c] flex">
      <AdminSidebar />
      <main className="flex-1 ml-64">
        <header className="bg-white/80 dark:bg-[#0f0f12]/80 backdrop-blur-xl border-b border-gray-100/80 dark:border-gray-800/30 px-8 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">{title}</h1>
              {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700/50 mx-1" />
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  data-testid="button-admin-lang"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-gray-600 dark:text-gray-400"
                >
                  <Globe size={14} />
                  <span className="text-xs font-semibold">{lang === "fr" ? "FR" : "EN"}</span>
                </button>
                {showLangMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white dark:bg-[#1a1a1e] border border-gray-100 dark:border-gray-800/50 rounded-xl shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden z-50 min-w-[140px]">
                    <button
                      onClick={() => { setLang("fr"); setShowLangMenu(false); }}
                      data-testid="button-admin-lang-fr"
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${lang === "fr" ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold" : "text-gray-600 dark:text-gray-400"}`}
                    >
                      <span>🇫🇷</span> {t.common.french}
                    </button>
                    <button
                      onClick={() => { setLang("en"); setShowLangMenu(false); }}
                      data-testid="button-admin-lang-en"
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${lang === "en" ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold" : "text-gray-600 dark:text-gray-400"}`}
                    >
                      <span>🇬🇧</span> {t.common.english}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <div className="p-6 lg:p-8">
          {children}
        </div>
        <footer className="px-8 pb-6 text-center text-[10px] text-gray-300 dark:text-gray-700 font-medium">
          Made By Khevin Andrew Kita - Ed Corporation
        </footer>
      </main>
    </div>
  );
}
