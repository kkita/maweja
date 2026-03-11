import { type ReactNode, useState, useRef, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import { useI18n, type Lang } from "../lib/i18n";
import { Globe } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-100 px-8 py-5 sticky top-0 z-30 flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-900">{title}</h1>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              data-testid="button-admin-lang"
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <span className="text-lg">{lang === "fr" ? "🇫🇷" : "🇬🇧"}</span>
              <span className="text-xs font-semibold text-gray-700">{lang === "fr" ? "FR" : "EN"}</span>
            </button>
            {showLangMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50 min-w-[160px]">
                <button
                  onClick={() => { setLang("fr"); setShowLangMenu(false); }}
                  data-testid="button-admin-lang-fr"
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${lang === "fr" ? "bg-red-50 text-red-700 font-bold" : "text-gray-700"}`}
                >
                  <span>🇫🇷</span> {t.common.french}
                </button>
                <button
                  onClick={() => { setLang("en"); setShowLangMenu(false); }}
                  data-testid="button-admin-lang-en"
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${lang === "en" ? "bg-red-50 text-red-700 font-bold" : "text-gray-700"}`}
                >
                  <span>🇬🇧</span> {t.common.english}
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
        <footer className="p-8 text-center text-xs text-gray-400">
          Made By Khevin Andrew Kita - Ed Corporation
        </footer>
      </main>
    </div>
  );
}
