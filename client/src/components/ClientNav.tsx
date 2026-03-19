import { useLocation } from "wouter";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import { authFetchJson, queryClient } from "../lib/queryClient";
import { Bell, ShoppingBag, MapPin, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { onWSMessage } from "../lib/websocket";
import { handleWSEvent } from "../lib/notify";
import { useI18n } from "../lib/i18n";
import SearchOverlay from "./SearchOverlay";
import type { Notification as Notif } from "@shared/schema";

const logoRed = "/maweja-logo-red.png";

export default function ClientNav() {
  const [location, navigate] = useLocation();
  const { itemCount } = useCart();
  const { user } = useAuth();
  const { t } = useI18n();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  /* ── Dark mode tracking ─────────────────────────────────────────── */
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains("dark"))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  /* ── Scroll detection ───────────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 70);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Notifications ──────────────────────────────────────────────── */
  const { data: notifications = [] } = useQuery<Notif[]>({
    queryKey: ["/api/notifications", user?.id],
    queryFn: () => authFetchJson(`/api/notifications/${user?.id}`),
    enabled: !!user,
    refetchInterval: 15000,
  });

  useEffect(() => {
    return onWSMessage((data) => {
      if (["chat_message", "notification", "order_status", "order_updated"].includes(data.type)) {
        queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      }
      handleWSEvent(data);
    });
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead && n.type !== "chat").length;

  const handleProtectedNav = (path: string) => {
    const protectedPaths = ["/orders", "/settings", "/notifications", "/addresses"];
    if (!user && protectedPaths.includes(path)) navigate("/login");
    else navigate(path);
  };

  /* ─── Header colors ──────────────────────────────────────────────
     Not scrolled  → white (light) / #0d0d0d (dark)
     Scrolled      → always Maweja red
  ──────────────────────────────────────────────────────────────── */
  const headerBg   = scrolled ? "#dc2626" : isDark ? "#0d0d0d" : "#ffffff";
  const headerShadow = scrolled
    ? "0 4px 24px rgba(220,38,38,0.3)"
    : isDark ? "0 1px 0 rgba(255,255,255,0.06)" : "0 1px 0 rgba(0,0,0,0.06)";

  const navItems = [
    { path: "/",         icon: "home",    label: "Accueil" },
    { path: "/orders",   icon: "orders",  label: "Commandes", badge: unreadCount },
    { path: "/settings", icon: "profile", label: "Profil" },
  ];

  return (
    <>
      {/* ── Search overlay (full-screen) ─────────────────────────────── */}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}

      {/* ─── Sticky header ───────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: headerBg,
          transition: "background 0.38s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: headerShadow,
        }}
      >
        <div className="max-w-lg mx-auto px-4 relative" style={{ height: 56 }}>

          {/* ─── NORMAL MODE: logo + address + icons ─────────────────── */}
          <div
            className="absolute inset-0 px-4 flex items-center gap-3"
            style={{
              opacity: scrolled ? 0 : 1,
              transform: scrolled ? "translateY(-12px) scale(0.96)" : "translateY(0) scale(1)",
              transition: "opacity 0.26s cubic-bezier(0.4,0,0.2,1), transform 0.28s cubic-bezier(0.4,0,0.2,1)",
              pointerEvents: scrolled ? "none" : "auto",
            }}
          >
            {/* Logo + "Maweja" text in Montserrat Bold */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-8 h-8">
                <img src={logoRed} alt="Maweja" className="w-full h-full object-contain" />
              </div>
              <span
                style={{
                  fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
                  fontWeight: 800,
                  fontSize: 18,
                  color: "#dc2626",
                  letterSpacing: "-0.3px",
                  lineHeight: 1,
                }}
              >
                Maweja
              </span>
            </div>

            <button
              className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-opacity active:opacity-70"
              style={{ background: isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6" }}
              onClick={() => handleProtectedNav("/addresses")}
              data-testid="button-address-pill"
            >
              <MapPin size={14} className="text-red-500 flex-shrink-0" />
              <span className="truncate text-[13px]" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>
                Entrez votre adresse
              </span>
            </button>

            <button
              className="relative w-9 h-9 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
              onClick={() => handleProtectedNav("/notifications")}
              data-testid="button-notifications-header"
            >
              <Bell size={22} style={{ color: "#dc2626" }} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center" data-testid="badge-notif">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            <button
              className="relative w-9 h-9 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
              onClick={() => navigate("/cart")}
              data-testid="button-cart-header"
            >
              <ShoppingBag size={22} style={{ color: "#dc2626" }} strokeWidth={1.8} />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-bold min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center" data-testid="badge-cart-header">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>
          </div>

          {/* ─── SCROLL MODE: search trigger button (red bg) ────────────── */}
          <div
            className="absolute inset-0 px-4 flex items-center"
            style={{
              opacity: scrolled ? 1 : 0,
              transform: scrolled ? "translateY(0) scale(1)" : "translateY(12px) scale(0.96)",
              transition: "opacity 0.28s cubic-bezier(0.4,0,0.2,1) 0.07s, transform 0.30s cubic-bezier(0.4,0,0.2,1) 0.07s",
              pointerEvents: scrolled ? "auto" : "none",
            }}
          >
            <button
              className="flex-1 flex items-center gap-2.5 active:scale-[0.97] transition-transform"
              style={{
                background: "rgba(255,255,255,0.97)",
                borderRadius: 14,
                paddingLeft: 14,
                paddingRight: 14,
                height: 38,
                boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
              }}
              onClick={() => setSearchOpen(true)}
              data-testid="button-open-search"
            >
              <Search size={15} style={{ color: "#dc2626", flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: "#9ca3af", flex: 1, textAlign: "left" }}>
                Plat, restaurant, service…
              </span>
            </button>
          </div>

        </div>
      </header>

      {/* ─── Bottom navigation ───────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 flex items-center justify-around px-6 pt-2 border-t border-gray-100 dark:border-gray-800/60"
        style={{
          boxShadow: "0 -2px 16px rgba(0,0,0,0.06)",
          paddingBottom: "max(20px, env(safe-area-inset-bottom))",
        }}
      >
        {navItems.map((item) => {
          const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
          const activeColor = "#dc2626";
          const inactiveColor = "#9CA3AF";
          const color = isActive ? activeColor : inactiveColor;
          return (
            <button
              key={item.path}
              onClick={() => handleProtectedNav(item.path)}
              data-testid={`nav-${item.path.replace(/\//g, "") || "home"}`}
              className="relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] active:scale-90 transition-transform duration-150"
            >
              {item.icon === "home" && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive ? activeColor : "none"} stroke={color} strokeWidth={isActive ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                  <path d="M9 21V12h6v9" fill="none" stroke={isActive ? "white" : color} strokeWidth="1.8" />
                </svg>
              )}
              {item.icon === "orders" && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive ? activeColor : "none"} stroke={color} strokeWidth={isActive ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="2" width="18" height="20" rx="3" />
                  <path d="M7 7h10M7 11h7M7 15h5" fill="none" stroke={isActive ? "white" : color} strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
              {item.icon === "profile" && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive ? activeColor : "none"} stroke={color} strokeWidth={isActive ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" fill={isActive ? activeColor : "none"} stroke={isActive ? "transparent" : color} strokeWidth="1.8" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="none" stroke={isActive ? "white" : color} strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
              {/* Label */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? activeColor : inactiveColor,
                  letterSpacing: "0.01em",
                  lineHeight: 1,
                }}
              >
                {item.label}
              </span>
              {(item as any).badge > 0 && (
                <span
                  className="absolute -top-0.5 right-1 bg-red-600 text-white text-[8px] font-black min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center"
                  data-testid={`badge-${item.path.replace(/\//g, "") || "home"}`}
                >
                  {(item as any).badge > 99 ? "99+" : (item as any).badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
