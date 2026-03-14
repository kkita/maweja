import { useLocation } from "wouter";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import { authFetchJson, queryClient } from "../lib/queryClient";
import { Home, ShoppingBag, ClipboardList, Settings, LogOut, LogIn, MessageCircle, Briefcase, Bell } from "lucide-react";
import logoImg from "@assets/image_1772833363714.png";
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
        { path: "/", icon: Home, label: t.client.home, badge: 0 },
        { path: "/cart", icon: ShoppingBag, label: t.client.cart, badge: itemCount },
        { path: "/orders", icon: ClipboardList, label: t.client.myOrders, badge: unreadNotifCount },
        { path: "/services", icon: Briefcase, label: t.client.services, badge: 0 },
        { path: "/settings", icon: Settings, label: t.common.settings, badge: 0 },
      ]
    : [
        { path: "/", icon: Home, label: t.client.home, badge: 0 },
        { path: "/cart", icon: ShoppingBag, label: t.client.cart, badge: itemCount },
      ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white overflow-hidden ring-2 ring-red-100 dark:ring-red-900/30 shadow-lg shadow-red-100/50 dark:shadow-red-900/20 flex items-center justify-center">
              <img src={logoImg} alt="MAWEJA" className="w-full h-full object-contain p-0.5" />
            </div>
            <div>
              <h1 className="text-base font-black text-gray-900 dark:text-white leading-tight tracking-tight">MAWEJA</h1>
              <p className="text-[9px] text-red-500 font-bold -mt-0.5 uppercase tracking-widest">Kinshasa · RDC</p>
            </div>
          </div>
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

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="max-w-lg mx-auto flex items-center px-2 py-1">
          {links.map((l) => {
            const isActive = location === l.path || (l.path !== "/" && location.startsWith(l.path));
            return (
              <button
                key={l.path}
                onClick={() => navigate(l.path)}
                data-testid={`nav-${l.path.replace(/\//g, "") || "home"}`}
                className={`flex-1 flex flex-col items-center py-2 px-1 rounded-2xl relative transition-all duration-200 active:scale-90 ${
                  isActive
                    ? "text-red-600"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-red-50 dark:bg-red-900/20 rounded-2xl" />
                )}
                <div className="relative z-10">
                  <div className={`transition-transform duration-200 ${isActive ? "scale-110" : "scale-100"}`}>
                    <l.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  {l.badge > 0 && (
                    <span
                      className="absolute -top-2 -right-2.5 bg-red-600 text-white text-[8px] font-bold min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center animate-pulse"
                      data-testid={`badge-${l.path.replace(/\//g, "") || "home"}`}
                    >
                      {l.badge > 99 ? "99+" : l.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-bold mt-0.5 relative z-10 transition-all ${isActive ? "text-red-600" : ""}`}>
                  {l.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-red-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
