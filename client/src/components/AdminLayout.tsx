import { type ReactNode, useState, useRef, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import { useI18n } from "../lib/i18n";
import { useTheme, type ThemeMode } from "../lib/theme";
import { useAuth } from "../lib/auth";
import { useLocation } from "wouter";
import {
  Globe, Sun, Moon, MonitorSmartphone, Search, ChevronDown,
  Settings, LogOut, User, ExternalLink, BookOpen,
} from "lucide-react";

/* ─── Theme Toggle ──────────────────────────── */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const options: { value: ThemeMode; icon: any; title: string }[] = [
    { value: "auto", icon: MonitorSmartphone, title: "Auto" },
    { value: "light", icon: Sun, title: "Clair" },
    { value: "dark", icon: Moon, title: "Sombre" },
  ];
  return (
    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 rounded-lg p-0.5">
      {options.map(({ value, icon: Icon, title }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={title}
          data-testid={`admin-theme-${value}`}
          className={`p-1.5 rounded-md transition-all duration-200 ${
            theme === value
              ? "bg-white dark:bg-zinc-700 shadow-sm text-rose-600"
              : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
        >
          <Icon size={13} />
        </button>
      ))}
    </div>
  );
}

/* ─── Language Selector ─────────────────────── */
function LangSelector() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        data-testid="button-admin-lang"
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400"
      >
        <Globe size={13} />
        <span className="text-[11px] font-bold">{lang === "fr" ? "FR" : "EN"}</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg shadow-black/8 dark:shadow-black/40 overflow-hidden z-50 min-w-[140px]"
          style={{ animation: "slideInDown 0.15s ease-out" }}
        >
          {[
            { code: "fr", flag: "🇫🇷", label: t.common.french },
            { code: "en", flag: "🇬🇧", label: t.common.english },
          ].map(({ code, flag, label }) => (
            <button
              key={code}
              onClick={() => { setLang(code as any); setOpen(false); }}
              data-testid={`button-admin-lang-${code}`}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                lang === code
                  ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <span>{flag}</span> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Profile Dropdown ──────────────────────── */
function ProfileDropdown() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = user?.name?.[0]?.toUpperCase() ?? "A";

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        data-testid="button-admin-profile"
        className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-sm shadow-rose-200 dark:shadow-none">
          <span className="text-white font-black text-[11px]">{initial}</span>
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">{user?.name}</p>
        </div>
        <ChevronDown size={12} className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg shadow-black/8 dark:shadow-black/40 overflow-hidden z-50"
          style={{ animation: "slideInDown 0.15s ease-out" }}
        >
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{user?.name}</p>
            <p className="text-[10px] text-zinc-400 truncate">{user?.email}</p>
          </div>
          <div className="py-1">
            <button
              onClick={() => { navigate("/admin/accounts"); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              <User size={13} /> Mon profil
            </button>
            <button
              onClick={() => { navigate("/admin/settings"); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              <Settings size={13} /> Paramètres
            </button>
            <button
              onClick={() => { window.open("/guide-dashboard-maweja.html", "_blank"); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              <BookOpen size={13} /> Guide
              <ExternalLink size={10} className="ml-auto text-zinc-300" />
            </button>
          </div>
          <div className="py-1 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={async () => { await logout(); navigate("/admin/login"); }}
              data-testid="admin-logout-dropdown"
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-medium"
            >
              <LogOut size={13} /> Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Global Search Bar ─────────────────────── */
function GlobalSearch() {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const ref = useRef<HTMLInputElement>(null);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && query.trim()) {
      navigate(`/admin/orders?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
      ref.current?.blur();
    }
    if (e.key === "Escape") { setQuery(""); ref.current?.blur(); }
  }

  return (
    <div className={`relative flex items-center transition-all duration-200 ${focused ? "w-52 sm:w-64" : "w-40 sm:w-48"}`}>
      <Search size={13} className="absolute left-2.5 text-zinc-400 pointer-events-none" />
      <input
        ref={ref}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKey}
        placeholder="Recherche globale…"
        data-testid="input-admin-search"
        className="w-full pl-7 pr-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/50 rounded-lg text-[12px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-400 dark:focus:border-rose-500 transition-all"
      />
      {query && (
        <button
          onMouseDown={e => e.preventDefault()}
          onClick={() => setQuery("")}
          className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <span className="text-[10px]">✕</span>
        </button>
      )}
    </div>
  );
}

/* ─── Main AdminLayout ──────────────────────── */
export default function AdminLayout({ children, title, subtitle }: {
  children: ReactNode; title: string; subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      <AdminSidebar />

      <main className="flex-1 ml-60 flex flex-col min-h-screen">

        {/* ── TopBar ── */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0E0E10]/80 backdrop-blur-xl border-b border-zinc-200/70 dark:border-zinc-800/60">
          <div className="flex items-center justify-between px-6 h-[58px] gap-4">

            {/* Left: page title */}
            <div className="min-w-0">
              <h1 className="text-[15px] font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight truncate">{title}</h1>
              {subtitle && <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium leading-tight">{subtitle}</p>}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <GlobalSearch />
              <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700/60" />
              <ThemeToggle />
              <LangSelector />
              <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700/60" />
              <ProfileDropdown />
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="flex-1 p-6 lg:p-7">
          {children}
        </div>

        {/* ── Footer ── */}
        <footer className="px-7 pb-5 text-center text-[10px] text-zinc-300 dark:text-zinc-700 font-medium select-none">
          Made By Khevin Andrew Kita — Ed Corporation
        </footer>
      </main>
    </div>
  );
}
