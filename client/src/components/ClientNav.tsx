import { useLocation } from "wouter";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import { authFetchJson, queryClient } from "../lib/queryClient";
import { Bell, ShoppingBag, Home, User, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
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

  const { data: unreadChatCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ["/api/chat/unread", user?.id],
    queryFn: () => authFetchJson(`/api/chat/unread/${user?.id}`),
    enabled: !!user,
    refetchInterval: 10000,
  });

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
    if (!user && (path === "/orders" || path === "/settings" || path === "/notifications")) {
      navigate("/login");
    } else {
      navigate(path);
    }
  };

  /* 3 tabs: Home / Orders / Settings */
  const navItems = [
    { path: "/",        label: t.client.home },
    { path: "/orders",  label: t.client.myOrders, badge: unreadNotifCount },
    { path: "/settings",label: t.common.settings },
  ];

  return (
    <>
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-2.5">
        <div className="max-w-lg mx-auto flex items-center gap-3">

          {/* Logo */}
          <div className="flex-shrink-0 w-9 h-9">
            <img
              src={logoRed}
              alt="MAWEJA"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Address pill — centre */}
          <button
            className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 text-left active:bg-gray-200 transition-colors"
            onClick={() => handleProtectedNav("/settings")}
            data-testid="button-address-pill"
          >
            <MapPin size={14} className="text-gray-400 flex-shrink-0" />
            <span style={{ fontSize: 13, fontWeight: 400, color: "#9CA3AF" }} className="truncate">
              Entrez votre adresse
            </span>
          </button>

          {/* Bell → notifications */}
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

          {/* Cart icon (header only) */}
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
        </div>
      </header>

      {/* ─── Bottom navigation — 3 tabs flat ─────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white flex items-center justify-around px-6 pt-2 pb-5 border-t border-gray-100"
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
              className="relative flex flex-col items-center justify-center gap-1 min-w-[56px] active:scale-90 transition-transform duration-150"
            >
              {item.path === "/" && (
                <svg width="26" height="26" viewBox="0 0 24 24" fill={isActive ? color : "none"} stroke={color} strokeWidth={isActive ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                  <path d="M9 21V12h6v9" fill="none" stroke={isActive ? "white" : color} strokeWidth="1.8" />
                </svg>
              )}
              {item.path === "/orders" && (
                <svg width="26" height="26" viewBox="0 0 24 24" fill={isActive ? color : "none"} stroke={color} strokeWidth={isActive ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="2" width="18" height="20" rx="3" />
                  <path d="M7 7h10M7 11h7M7 15h5" fill="none" stroke={isActive ? "white" : color} strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
              {item.path === "/settings" && (
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
