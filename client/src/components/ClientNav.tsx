import { useLocation } from "wouter";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import { authFetchJson, queryClient } from "../lib/queryClient";
import { MapPin, LogOut, LogIn, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { onWSMessage } from "../lib/websocket";
import { handleWSEvent } from "../lib/notify";
import { useI18n } from "../lib/i18n";
import type { Notification as Notif } from "@shared/schema";

export default function ClientNav() {
  const [location, navigate] = useLocation();
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
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

  const unreadMsgCount = Object.values(unreadChatCounts).reduce((s, n) => s + n, 0);
  const unreadNotifCount = notifications.filter(n => !n.isRead && n.type !== "chat").length;

  const links = user
    ? [
        {
          path: "/",
          label: t.client.home,
          badge: 0,
          icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              <path d="M9 21V12h6v9" strokeWidth="1.8" fill="none" stroke="currentColor" />
            </svg>
          ),
        },
        {
          path: "/cart",
          label: t.client.cart,
          badge: itemCount,
          icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16 10a4 4 0 01-8 0" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          ),
        },
        {
          path: "/orders",
          label: t.client.myOrders,
          badge: unreadNotifCount,
          icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="18" rx="3" />
              <path d="M7 8h10M7 12h7M7 16h5" fill="none" stroke={active ? "white" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          ),
        },
        {
          path: "/settings",
          label: t.common.settings,
          badge: 0,
          icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" fill={active ? "white" : "none"} stroke={active ? "transparent" : "currentColor"} strokeWidth="1.8" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="none" stroke={active ? "white" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          ),
        },
      ]
    : [
        {
          path: "/",
          label: t.client.home,
          badge: 0,
          icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              <path d="M9 21V12h6v9" strokeWidth="1.8" fill="none" stroke="currentColor" />
            </svg>
          ),
        },
        {
          path: "/cart",
          label: t.client.cart,
          badge: itemCount,
          icon: (active: boolean) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16 10a4 4 0 01-8 0" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          ),
        },
      ];

  return (
    <>
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">

          {/* Brand */}
          <div className="flex flex-col leading-none">
            <span
              className="text-[22px] text-gray-900 dark:text-white tracking-tight"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: "-0.02em", fontWeight: 400 }}
            >
              MAWEJA
            </span>
            <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium tracking-wide mt-0.5">
              <MapPin size={9} className="flex-shrink-0" strokeWidth={2.5} />
              Kinshasa, RDC
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {unreadMsgCount > 0 && (
                  <button
                    onClick={() => navigate("/settings")}
                    className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all active:scale-95"
                    data-testid="button-messages-header"
                  >
                    <MessageCircle size={17} />
                    <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[8px] font-bold min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center" data-testid="badge-unread-messages">
                      {unreadMsgCount > 9 ? "9+" : unreadMsgCount}
                    </span>
                  </button>
                )}
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-1.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{(user.name || "C").charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold max-w-[70px] truncate" data-testid="text-username">{user.name?.split(" ")[0]}</span>
                </div>
                <button
                  onClick={async () => { await logout(); navigate("/"); }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all active:scale-95"
                  data-testid="button-logout"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-200 dark:shadow-red-900/30"
                data-testid="button-login"
              >
                <LogIn size={13} />
                {t.common.login}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── Bottom navigation ────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-3 pt-2 pointer-events-none">
        <div
          className="pointer-events-auto flex items-center gap-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-[28px] px-2 py-2"
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)" }}
        >
          {links.map((l) => {
            const isActive = location === l.path || (l.path !== "/" && location.startsWith(l.path));
            return (
              <button
                key={l.path}
                onClick={() => navigate(l.path)}
                data-testid={`nav-${l.path.replace(/\//g, "") || "home"}`}
                className={`relative flex flex-col items-center justify-center gap-1 rounded-[20px] transition-all duration-250 active:scale-90 ${
                  isActive
                    ? "bg-red-600 text-white px-5 py-2.5 min-w-[72px]"
                    : "text-gray-400 dark:text-gray-500 px-4 py-2.5 min-w-[60px] hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                <div className={`transition-transform duration-200 ${isActive ? "scale-105" : "scale-100"}`}>
                  {l.icon(isActive)}
                </div>
                <span className={`text-[9px] font-bold transition-all leading-none ${isActive ? "opacity-100" : "opacity-0 absolute"}`}>
                  {l.label}
                </span>
                {l.badge > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 text-white text-[8px] font-black min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center ${isActive ? "bg-white text-red-600" : "bg-red-600"}`}
                    data-testid={`badge-${l.path.replace(/\//g, "") || "home"}`}
                  >
                    {l.badge > 99 ? "99+" : l.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
