import { useLocation } from "wouter";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import { authFetchJson, queryClient } from "../lib/queryClient";
import { Bell, ShoppingBag, MapPin, Search, X, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { onWSMessage } from "../lib/websocket";
import { handleWSEvent } from "../lib/notify";
import { useI18n } from "../lib/i18n";
import type { Notification as Notif } from "@shared/schema";

const logoRed = "/maweja-logo-red.png";

export default function ClientNav() {
  const [location, navigate] = useLocation();
  const { itemCount } = useCart();
  const { user } = useAuth();
  const { t } = useI18n();

  const [scrolled, setScrolled] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  /* ── Scroll detection ───────────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => {
      const sy = window.scrollY;
      setScrolled(sy > 70);
      if (sy <= 30) {
        setSearchActive(false);
        setSearchQuery("");
        document.dispatchEvent(new CustomEvent("maweja-search", { detail: { query: "" } }));
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Search broadcast ───────────────────────────────────────────── */
  const broadcastSearch = (q: string) => {
    document.dispatchEvent(new CustomEvent("maweja-search", { detail: { query: q } }));
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    broadcastSearch(q);
  };

  const openSearch = () => {
    setSearchActive(true);
    setTimeout(() => searchInputRef.current?.focus(), 80);
  };

  const closeSearch = () => {
    setSearchActive(false);
    setSearchQuery("");
    broadcastSearch("");
  };

  /* ── Notifications ──────────────────────────────────────────────── */
  const { data: notifications = [] } = useQuery<Notif[]>({
    queryKey: ["/api/notifications", user?.id],
    queryFn: () => authFetchJson(`/api/notifications/${user?.id}`),
    enabled: !!user,
    refetchInterval: 15000,
  });

  useEffect(() => {
    return onWSMessage((data) => {
      if (data.type === "chat_message" || data.type === "notification" ||
          data.type === "order_status" || data.type === "order_updated") {
        queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      }
      handleWSEvent(data);
    });
  }, []);

  const unreadNotifCount = notifications.filter(n => !n.isRead && n.type !== "chat").length;

  const handleProtectedNav = (path: string) => {
    if (!user && (path === "/orders" || path === "/settings" || path === "/notifications" || path === "/address")) {
      navigate("/login");
    } else {
      navigate(path);
    }
  };

  const navItems = [
    { path: "/",         icon: "home" },
    { path: "/orders",   icon: "orders", badge: unreadNotifCount },
    { path: "/settings", icon: "profile" },
  ];

  return (
    <>
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800/60 backdrop-blur-xl"
        style={{ boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.08)" : "none", transition: "box-shadow 0.3s" }}>
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center gap-3">

          {/* ── NORMAL HEADER (not scrolled OR search not active) ── */}
          {(!scrolled || !searchActive) && (
            <>
              {/* Logo */}
              <div className="flex-shrink-0 w-9 h-9">
                <img src={logoRed} alt="MAWEJA" className="w-full h-full object-contain" />
              </div>

              {scrolled ? (
                /* Scrolled but search not yet opened — show search trigger pill */
                <button
                  onClick={openSearch}
                  data-testid="button-search-pill"
                  className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-800/70 rounded-xl px-3 py-2 text-left active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
                >
                  <Search size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate text-[13px] text-gray-400 dark:text-gray-500">
                    Rechercher un plat, restaurant…
                  </span>
                </button>
              ) : (
                /* Normal — address pill */
                <button
                  className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-800/70 rounded-xl px-3 py-2 text-left active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
                  onClick={() => handleProtectedNav("/address")}
                  data-testid="button-address-pill"
                >
                  <MapPin size={14} className="text-red-500 flex-shrink-0" />
                  <span className="truncate text-[13px] font-normal text-gray-400 dark:text-gray-500">
                    Entrez votre adresse
                  </span>
                </button>
              )}

              {/* Bell */}
              <button
                className="relative w-9 h-9 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                onClick={() => handleProtectedNav("/notifications")}
                data-testid="button-notifications-header"
              >
                <Bell size={22} className="text-[#3B5BDB]" strokeWidth={1.8} />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center" data-testid="badge-notif">
                    {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Cart */}
              <button
                className="relative w-9 h-9 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                onClick={() => navigate("/cart")}
                data-testid="button-cart-header"
              >
                <ShoppingBag size={22} className="text-[#3B5BDB]" strokeWidth={1.8} />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-bold min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center" data-testid="badge-cart-header">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </button>
            </>
          )}

          {/* ── SEARCH BAR (scrolled + search active) ── */}
          {scrolled && searchActive && (
            <>
              <button onClick={closeSearch} className="flex-shrink-0 w-9 h-9 flex items-center justify-center active:scale-90 transition-transform" data-testid="button-close-search">
                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Plat, restaurant, service…"
                  data-testid="input-global-search"
                  className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl pl-9 pr-9 py-2 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none border-none"
                />
                {searchQuery.length > 0 && (
                  <button onClick={() => handleSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X size={14} className="text-gray-400" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* ─── Bottom navigation ────────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 flex items-center justify-around px-6 pt-2 pb-5 border-t border-gray-100 dark:border-gray-800/60"
        style={{ boxShadow: "0 -2px 16px rgba(0,0,0,0.06)" }}
      >
        {navItems.map((item) => {
          const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
          const color = isActive ? "#3B5BDB" : "#9CA3AF";

          return (
            <button
              key={item.path}
              onClick={() => handleProtectedNav(item.path)}
              data-testid={`nav-${item.path.replace(/\//g, "") || "home"}`}
              className="relative flex flex-col items-center justify-center min-w-[56px] active:scale-90 transition-transform duration-150"
            >
              {item.icon === "home" && (
                <svg width="26" height="26" viewBox="0 0 24 24" fill={isActive ? color : "none"} stroke={color} strokeWidth={isActive ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                  <path d="M9 21V12h6v9" fill="none" stroke={isActive ? "white" : color} strokeWidth="1.8" />
                </svg>
              )}
              {item.icon === "orders" && (
                <svg width="26" height="26" viewBox="0 0 24 24" fill={isActive ? color : "none"} stroke={color} strokeWidth={isActive ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="2" width="18" height="20" rx="3" />
                  <path d="M7 7h10M7 11h7M7 15h5" fill="none" stroke={isActive ? "white" : color} strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
              {item.icon === "profile" && (
                <svg width="26" height="26" viewBox="0 0 24 24" fill={isActive ? color : "none"} stroke={color} strokeWidth={isActive ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" fill={isActive ? color : "none"} stroke={isActive ? "transparent" : color} strokeWidth="1.8" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="none" stroke={isActive ? "white" : color} strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
              {(item as any).badge != null && (item as any).badge > 0 && (
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
